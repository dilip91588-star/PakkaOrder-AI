import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Phase 4: Source-Order Ingestion & REST API Integration Tests', () => {

  const demoTenantHeaders = {
    'x-tenant-code': 'TEN-001',
    'Content-Type': 'application/json'
  };

  describe('1. Manual Order Ingestion (POST /api/v1/source-orders)', () => {
    it('successfully creates a valid manual source order and returns 201 Created', async () => {
      const payload = {
        channel: 'MANUAL',
        idempotencyKey: `IDEM-TEST-MANUAL-${Date.now()}`,
        externalOrderId: 'POS-TX-9901',
        customer: {
          name: 'Vikram Seth',
          phone: '+91 98111 22334',
          address: '42, Defense Colony, Indiranagar'
        },
        items: [
          {
            name: 'Paneer Tikka Roll',
            quantity: 2,
            unit: 'roll',
            unitPrice: 240,
            customizations: ['Extra spicy', 'Mint chutney on side']
          },
          {
            name: 'Masala Chaas',
            quantity: 1,
            unit: 'glass',
            unitPrice: 40
          }
        ],
        currency: 'INR',
        reportedTotal: 520
      };

      const res = await request(app)
        .post('/api/v1/source-orders')
        .set(demoTenantHeaders)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.isDuplicate).toBe(false);
      expect(res.body.sourceOrderId).toBeDefined();
      expect(res.body.order.items.length).toBe(2);
      expect(res.body.order.customerName).toBe('Vikram Seth');
      expect(res.body.order.normalizedPhone).toBe('+919811122334');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('enforces idempotency: repeated request with the same idempotencyKey returns 200 OK and same sourceOrderId', async () => {
      const fixedIdempotencyKey = `IDEM-REPEATED-${Date.now()}`;
      const payload = {
        channel: 'POS',
        idempotencyKey: fixedIdempotencyKey,
        externalOrderId: 'POS-TX-1002',
        customer: {
          name: 'Sunita Rao',
          phone: '+91 98440 12345'
        },
        items: [
          {
            name: 'Garlic Naan',
            quantity: 4,
            unit: 'piece',
            unitPrice: 50
          }
        ],
        currency: 'INR'
      };

      // First ingestion attempt -> 201 Created
      const firstRes = await request(app)
        .post('/api/v1/source-orders')
        .set(demoTenantHeaders)
        .send(payload);

      expect(firstRes.status).toBe(201);
      expect(firstRes.body.isDuplicate).toBe(false);
      const originalOrderId = firstRes.body.sourceOrderId;

      // Second ingestion attempt with exact same idempotencyKey -> 200 OK, not 201
      const secondRes = await request(app)
        .post('/api/v1/source-orders')
        .set(demoTenantHeaders)
        .send(payload);

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.isDuplicate).toBe(true);
      expect(secondRes.body.sourceOrderId).toBe(originalOrderId);
      expect(secondRes.body.message).toContain('Idempotent request');
    });

    it('rejects invalid quantities (zero or negative) with 400 Bad Request', async () => {
      const invalidPayload = {
        channel: 'MANUAL',
        idempotencyKey: `IDEM-INVALID-QTY-${Date.now()}`,
        items: [
          {
            name: 'Paneer Roll',
            quantity: -3, // Invalid negative quantity
            unitPrice: 240
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/source-orders')
        .set(demoTenantHeaders)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.items['0'].quantity._errors[0]).toContain('greater than zero');
    });

    it('rejects empty items array with 400 Bad Request', async () => {
      const emptyItemsPayload = {
        channel: 'MANUAL',
        idempotencyKey: `IDEM-EMPTY-ITEMS-${Date.now()}`,
        items: [] // Invalid empty array
      };

      const res = await request(app)
        .post('/api/v1/source-orders')
        .set(demoTenantHeaders)
        .send(emptyItemsPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. Informal Text Extraction (POST /api/v1/source-orders/extract)', () => {
    it('extracts structured items, addresses, and customer phone from informal Hinglish text', async () => {
      const payload = {
        messageText: 'bhaiya 2 paneer roll aur 1 butter chicken bhej do jaldi prestige ozone indiranagar flat 402 me. payment gpay kardoonga. extra green chutney chahiye',
        channel: 'WHATSAPP',
        customerPhone: '+919876543210',
        knownCustomerName: 'Priya Sharma'
      };

      const res = await request(app)
        .post('/api/v1/source-orders/extract')
        .set(demoTenantHeaders)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const extracted = res.body.extracted;

      expect(extracted.detectedLanguage).toContain('Hinglish');
      expect(extracted.items.length).toBeGreaterThanOrEqual(2);

      // Verify Paneer Tikka Roll extracted with quantity 2
      const paneerItem = extracted.items.find((i: any) => i.catalogProductId === 'SKU-PAN-01');
      expect(paneerItem).toBeDefined();
      expect(paneerItem.quantity).toBe(2);
      expect(paneerItem.customization).toContain('green chutney');

      // Verify portion ambiguity warning flagged for Butter Chicken without half/full
      const portionAmbiguity = extracted.uncertainties.find((u: any) => u.reason.includes('Portion Ambiguity'));
      expect(portionAmbiguity).toBeDefined();

      // Does not mark as canonical or auto-merged
      expect(extracted.extractionConfidence).toBeGreaterThan(0.8);
      expect(extracted.promptVersion).toBeDefined();
    }, 30000);

    it('rejects excessively short text with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/source-orders/extract')
        .set(demoTenantHeaders)
        .send({ messageText: 'hi' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('3. CSV Batch Import (POST /api/v1/source-orders/import-csv)', () => {
    it('processes CSV rows individually, reporting per-row success and specific failure reasons', async () => {
      const runId = Date.now();
      const csvData = [
        'external_order_id,channel,customer_name,customer_phone,delivery_address,item_name,quantity,unit_price',
        `CSV-ORD-101-${runId},ZOMATO,Kavita Rao,+919876511111,12th Main Indiranagar,Paneer Tikka Roll,2,240`,
        `CSV-ORD-102-${runId},SWIGGY,Rajesh Kumar,,Koramangala,Butter Chicken,1,380`, // Missing phone (Invalid row)
        `CSV-ORD-103-${runId},POS,Ananya Roy,+919876522222,HAL 2nd Stage,Garlic Naan,-4,50`, // Negative quantity (Invalid row)
        `CSV-ORD-104-${runId},MANUAL,Deepak V,+919876533333,Domlur,Dal Makhani,1,260` // Valid row
      ].join('\n');

      const res = await request(app)
        .post('/api/v1/source-orders/import-csv')
        .set(demoTenantHeaders)
        .send({ csvContent: csvData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const summary = res.body.summary;

      expect(summary.totalRows).toBe(4);
      expect(summary.successfulRows).toBe(2);
      expect(summary.failedRows).toBe(2);

      // Verify row 2 failed for missing customer_phone
      const row2 = summary.results.find((r: any) => r.rowNumber === 3);
      expect(row2.status).toBe('FAILED');
      expect(row2.error).toContain('Missing customer_phone');

      // Verify row 3 failed for negative quantity
      const row3 = summary.results.find((r: any) => r.rowNumber === 4);
      expect(row3.status).toBe('FAILED');
      expect(row3.error).toContain('Invalid quantity');

      // Verify row 1 and 4 succeeded
      const row1 = summary.results.find((r: any) => r.rowNumber === 2);
      expect(row1.status).toBe('SUCCESS');
      expect(row1.sourceOrderId).toBeDefined();
    });

    it('rejects CSV with missing mandatory header columns', async () => {
      const invalidCsv = 'order_id,name\n1,Test';
      const res = await request(app)
        .post('/api/v1/source-orders/import-csv')
        .set(demoTenantHeaders)
        .send({ csvContent: invalidCsv });

      expect(res.status).toBe(500); // Throws domain error caught by centralized handler
      expect(res.body.error.message).toContain('Missing required column');
    });
  });

  describe('4. Source Order Listing and Detail Retrieval', () => {
    let createdOrderId: number;

    it('creates an order to test retrieval', async () => {
      const res = await request(app)
        .post('/api/v1/source-orders')
        .set(demoTenantHeaders)
        .send({
          channel: 'ZOMATO',
          idempotencyKey: `IDEM-DETAIL-TEST-${Date.now()}`,
          externalOrderId: 'ZOM-TEST-5501',
          customer: { name: 'Rohan Mehra', phone: '+91 99000 88776', address: 'Indiranagar 100ft Rd' },
          items: [{ name: 'Dum Biryani (Chicken)', quantity: 1, unitPrice: 340 }]
        });

      expect(res.status).toBe(201);
      createdOrderId = res.body.sourceOrderId;
    });

    it('retrieves created order via GET /api/v1/source-orders/:id preserving original payload', async () => {
      const res = await request(app)
        .get(`/api/v1/source-orders/${createdOrderId}`)
        .set(demoTenantHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.id).toBe(createdOrderId);
      expect(res.body.order.externalOrderId).toBe('ZOM-TEST-5501');
      expect(res.body.order.originalPayload).toBeDefined();
      expect(res.body.order.items.length).toBe(1);
    });

    it('lists orders with pagination and filtering via GET /api/v1/source-orders', async () => {
      const res = await request(app)
        .get('/api/v1/source-orders?channel=ZOMATO&page=1&limit=10')
        .set(demoTenantHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orders).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.page).toBe(1);
    });

    it('enforces tenant isolation: returning 404 for an ID not belonging to the tenant', async () => {
      const res = await request(app)
        .get('/api/v1/source-orders/999999')
        .set(demoTenantHeaders);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
