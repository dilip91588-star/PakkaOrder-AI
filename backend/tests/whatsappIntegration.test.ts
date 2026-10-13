import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { whatsAppAdapter } from '../src/adapters/whatsappAdapter.js';
import { pool } from '../src/db/pool.js';

describe('Phase 10: Official WhatsApp Business Platform Channel Integration Tests', () => {
  const testSecret = 'test_meta_app_secret_12345';
  const originalSecret = env.WHATSAPP_APP_SECRET;

  const generateSignature = (body: object | string, secret: string): string => {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    const hash = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return `sha256=${hash}`;
  };

  beforeEach(() => {
    // Reset test secret
    (env as any).WHATSAPP_APP_SECRET = testSecret;
  });

  describe('1. Webhook Verification Handshake (GET /api/v1/webhooks/whatsapp)', () => {
    it('echoes hub.challenge with 200 OK when hub.verify_token matches server token', async () => {
      const challengeCode = '1158201444';
      const response = await request(app)
        .get('/api/v1/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': env.WHATSAPP_VERIFY_TOKEN,
          'hub.challenge': challengeCode
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe(challengeCode);
    });

    it('rejects handshake with 403 Forbidden when verify_token does not match', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_impostor_token',
          'hub.challenge': '123456'
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN_VERIFY_TOKEN_MISMATCH');
    });

    it('rejects handshake with 400 Bad Request when mandatory query parameters are missing', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe'
          // missing verify_token and challenge
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_CHALLENGE_PARAMETERS');
    });
  });

  describe('2. Webhook HMAC-SHA256 Signature Verification', () => {
    const samplePayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID_001',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550234567',
                  phone_number_id: '100234567890123'
                },
                statuses: [
                  {
                    id: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgg...',
                    status: 'delivered',
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    recipient_id: '919876543210'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    it('accepts valid HMAC-SHA256 signature in X-Hub-Signature-256 header', async () => {
      const payloadString = JSON.stringify(samplePayload);
      const signature = generateSignature(payloadString, testSecret);

      const response = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadString);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statusUpdatesProcessed.length).toBe(1);
    });

    it('rejects tampered or forged signature with 401 Unauthorized', async () => {
      const payloadString = JSON.stringify(samplePayload);
      const forgedSignature = generateSignature(payloadString, 'forged_fake_secret_key');

      const response = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', forgedSignature)
        .send(payloadString);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED_SIGNATURE_MISMATCH');
    });

    it('rejects missing or malformed signature header with 401 Unauthorized', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', 'invalid-format-without-sha256-prefix')
        .send(samplePayload);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED_SIGNATURE_MISMATCH');
    });
  });

  describe('3. Inbound Conversational Order Message Processing & Provenance Preservation', () => {
    it('translates Meta WhatsApp order message into a preserved source order', async () => {
      const testWamid = `wamid.TEST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const orderPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID_001',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550234567',
                    phone_number_id: '100234567890123'
                  },
                  contacts: [
                    {
                      profile: { name: 'Kavita Iyer' },
                      wa_id: '919876599888'
                    }
                  ],
                  messages: [
                    {
                      from: '919876599888',
                      id: testWamid,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      text: {
                        body: 'Bhaiya 2 Paneer Tikka Roll bhej do jaldi. Address 204 Palm Grove Indiranagar'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const payloadString = JSON.stringify(orderPayload);
      const signature = generateSignature(payloadString, testSecret);

      const response = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadString);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ordersIngested.length).toBe(1);

      const ingested = response.body.ordersIngested[0];
      expect(ingested.wamid).toBe(testWamid);
      expect(ingested.isDuplicate).toBe(false);
      expect(ingested.sourceOrderId).toBeDefined();

      // Verify in MySQL database that the raw payload and metadata are preserved verbatim
      const [rows] = await pool.query<any[]>(
        'SELECT * FROM source_orders WHERE id = ?',
        [ingested.sourceOrderId]
      );
      expect(rows.length).toBe(1);
      const orderRow = rows[0];
      expect(orderRow.channel).toBe('WHATSAPP');
      expect(orderRow.external_order_id).toBe(testWamid);
      expect(orderRow.idempotency_key).toBe(`WA_${testWamid}`);
      expect(orderRow.normalized_phone).toBe('+919876599888');

      // Verify original payload contains the raw Meta webhook payload
      const storedPayload = typeof orderRow.original_payload === 'string'
        ? JSON.parse(orderRow.original_payload)
        : orderRow.original_payload;
      expect(storedPayload.providerMetadata.wamid).toBe(testWamid);
      expect(storedPayload.providerMetadata.channel).toBe('WHATSAPP');
      expect(storedPayload.providerMetadata.displayPhoneNumber).toBe('15550234567');
    });
  });

  describe('4. Webhook Retries & Idempotency Protection', () => {
    it('returns 200 OK and suppresses duplicate ingestion when Meta retries the same message webhook', async () => {
      const testWamid = `wamid.RETRY_TEST_${Date.now()}`;
      const orderPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID_001',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550234567',
                    phone_number_id: '100234567890123'
                  },
                  contacts: [
                    {
                      profile: { name: 'Rohit Shenoy' },
                      wa_id: '919876544332'
                    }
                  ],
                  messages: [
                    {
                      from: '919876544332',
                      id: testWamid,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      text: {
                        body: '1 Butter Chicken and 2 Garlic Naan'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const payloadString = JSON.stringify(orderPayload);
      const signature = generateSignature(payloadString, testSecret);

      // Attempt 1: First delivery
      const res1 = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadString);

      expect(res1.status).toBe(200);
      expect(res1.body.ordersIngested[0].isDuplicate).toBe(false);
      const originalSourceId = res1.body.ordersIngested[0].sourceOrderId;

      // Attempt 2: Duplicate retry from Meta with identical wamid
      const res2 = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadString);

      expect(res2.status).toBe(200);
      expect(res2.body.ordersIngested[0].isDuplicate).toBe(true);
      expect(res2.body.ordersIngested[0].sourceOrderId).toBe(originalSourceId);

      // Verify only 1 row exists in database for this idempotency key
      const [rows] = await pool.query<any[]>(
        'SELECT count(*) as count FROM source_orders WHERE idempotency_key = ?',
        [`WA_${testWamid}`]
      );
      expect(rows[0].count).toBe(1);
    });
  });

  describe('5. Out-of-Order Customer Revision & Quantity Guardrail Conflict (Rule #QNT-04)', () => {
    it('creates a SUSPECTED_UPDATE candidate pair with CRITICAL quantity mismatch when customer modifies order', async () => {
      const customerPhone = '919876511223';
      const timestampBase = Math.floor(Date.now() / 1000);

      // Message 1: Initial Order (2 rolls)
      const wamid1 = `wamid.MSG1_${Date.now()}`;
      const payload1 = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID_001',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15550234567', phone_number_id: '100234567890123' },
                  contacts: [{ profile: { name: 'Siddharth R' }, wa_id: customerPhone }],
                  messages: [
                    {
                      from: customerPhone,
                      id: wamid1,
                      timestamp: `${timestampBase}`,
                      text: { body: '2 Paneer Tikka Roll please, flat 301 defence colony' },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const sig1 = generateSignature(payload1, testSecret);
      const res1 = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', sig1)
        .send(payload1);

      expect(res1.status).toBe(200);
      const sourceId1 = res1.body.ordersIngested[0].sourceOrderId;

      // Message 2: Customer Revision 2 minutes later ("2 nahi 3 roll kar do")
      const wamid2 = `wamid.MSG2_${Date.now()}`;
      const payload2 = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID_001',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '15550234567', phone_number_id: '100234567890123' },
                  contacts: [{ profile: { name: 'Siddharth R' }, wa_id: customerPhone }],
                  messages: [
                    {
                      from: customerPhone,
                      id: wamid2,
                      timestamp: `${timestampBase + 120}`,
                      text: { body: 'bhai 2 nahi 3 paneer roll kar do, flat 301 defence colony' },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const sig2 = generateSignature(payload2, testSecret);
      const res2 = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', sig2)
        .send(payload2);

      expect(res2.status).toBe(200);
      const sourceId2 = res2.body.ordersIngested[0].sourceOrderId;

      // Both source records must exist independently (provenance preservation)
      expect(sourceId1).not.toBe(sourceId2);

      // Verify in duplicate_candidates table that a candidate pair was generated
      const [candidates] = await pool.query<any[]>(
        `SELECT * FROM duplicate_candidates 
         WHERE (source_a_id = ? AND source_b_id = ?) 
            OR (source_a_id = ? AND source_b_id = ?)`,
        [sourceId1, sourceId2, sourceId2, sourceId1]
      );

      expect(candidates.length).toBeGreaterThanOrEqual(1);
      const candidate = candidates[0];
      // Matching score must reflect strong temporal and customer proximity
      expect(parseFloat(candidate.match_score)).toBeGreaterThan(0.70);

      // Review status must be PENDING (Never auto-merged)
      expect(candidate.review_status).toBe('PENDING');

      // Conflicts table must have quantity conflict flagged as CRITICAL
      const [conflicts] = await pool.query<any[]>(
        'SELECT * FROM order_conflicts WHERE candidate_id = ? AND conflict_type = ?',
        [candidate.id, 'QUANTITY_MISMATCH']
      );
      expect(conflicts.length).toBeGreaterThanOrEqual(1);
      expect(conflicts[0].severity).toBe('CRITICAL');
    });
  });

  describe('6. Integration Health & Diagnostic Telemetry (GET /api/v1/channels/whatsapp/status)', () => {
    it('returns comprehensive WhatsApp channel integration telemetry', async () => {
      const response = await request(app)
        .get('/api/v1/channels/whatsapp/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const integration = response.body.integration;
      expect(integration.channel).toBe('WHATSAPP');
      expect(integration.provider).toBe('Meta WhatsApp Business Cloud API');
      expect(integration.apiVersion).toBe('v21.0');
      expect(integration.webhookPath).toBe('/api/v1/webhooks/whatsapp');
      expect(integration.isVerifyTokenConfigured).toBe(true);
      expect(integration.signatureVerificationMode).toBe('STRICT_HMAC_SHA256');
      expect(integration.metrics.totalEventsReceived).toBeGreaterThan(0);
    });
  });
});
