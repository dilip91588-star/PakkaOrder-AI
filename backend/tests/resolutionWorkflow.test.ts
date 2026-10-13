import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resolutionService } from '../src/services/resolutionService.js';
import { DuplicateCandidateRepository } from '../src/repositories/duplicateCandidateRepository.js';
import { sourceOrderRepository } from '../src/repositories/sourceOrderRepository.js';
import { canonicalOrderRepository } from '../src/repositories/canonicalOrderRepository.js';
import { orderLinkRepository } from '../src/repositories/orderLinkRepository.js';
import { AuditRepository } from '../src/repositories/auditRepository.js';

describe('Phase 6: Duplicate-Candidate Review & Resolution Workflow Tests', () => {

  const tenantHeaders = {
    'x-tenant-code': 'TEN-001',
    'Content-Type': 'application/json'
  };

  const crossTenantHeaders = {
    'x-tenant-code': 'TEN-999',
    'Content-Type': 'application/json'
  };

  // Helper to create a quantity conflict pair: Order A (Qty = 2) vs Order B (Qty = 3)
  const setupQuantityConflictPair = async () => {
    const tenantId = 1;
    const now = new Date().toISOString();

    // Create Source A (Zomato: 2 Paneer Tikka Rolls)
    const sourceAId = await sourceOrderRepository.create({
      tenantId,
      channel: 'ZOMATO',
      idempotencyKey: `SRC-A-${Date.now()}-${Math.random()}`,
      externalOrderId: `ZOM-${Date.now()}`,
      sourceCreatedAt: now,
      customerName: 'Aditya Nair',
      customerPhone: '+91 98765 43210',
      deliveryAddress: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
      currency: 'INR',
      reportedTotal: 756.00,
      originalPayload: { note: 'First order' },
      items: [
        {
          name: 'Paneer Tikka Roll',
          quantity: 2,
          unit: 'roll',
          unitPrice: 240.00,
          lineTotal: 480.00
        },
        {
          name: 'Butter Garlic Naan',
          quantity: 2,
          unit: 'piece',
          unitPrice: 70.00,
          lineTotal: 140.00
        }
      ]
    });
    const sourceA = (await sourceOrderRepository.findById(tenantId, sourceAId))!;

    // Create Source B (WhatsApp: 3 Paneer Tikka Rolls)
    const sourceBId = await sourceOrderRepository.create({
      tenantId,
      channel: 'WHATSAPP',
      idempotencyKey: `SRC-B-${Date.now()}-${Math.random()}`,
      externalOrderId: `WA-${Date.now()}`,
      sourceCreatedAt: now,
      customerName: 'Aditya Nair',
      customerPhone: '+91 98765 43210',
      deliveryAddress: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
      currency: 'INR',
      reportedTotal: 1008.00,
      originalPayload: { note: 'make rolls 3' },
      items: [
        {
          name: 'Paneer Tikka Roll',
          quantity: 3,
          unit: 'roll',
          unitPrice: 240.00,
          lineTotal: 720.00
        },
        {
          name: 'Butter Garlic Naan',
          quantity: 2,
          unit: 'piece',
          unitPrice: 70.00,
          lineTotal: 140.00
        }
      ]
    });
    const sourceB = (await sourceOrderRepository.findById(tenantId, sourceBId))!;

    // Create Candidate Flagged Pair
    const candidate = await DuplicateCandidateRepository.upsertCandidate({
      tenantId,
      sourceAId: sourceA.id,
      sourceBId: sourceB.id,
      matchScore: 0.94,
      matchFeatures: {
        phoneSimilarity: 1.0,
        addressSimilarity: 0.96,
        timeProximityScore: 0.92,
        itemSimilarity: 0.95
      },
      algorithmVersion: 'v2.4.0-deterministic',
      relationshipType: 'SUSPECTED_UPDATE',
      reviewStatus: 'PENDING'
    });

    // Record Material Conflict (2 vs 3)
    await DuplicateCandidateRepository.replaceConflicts(candidate.id, tenantId, [
      {
        conflictType: 'QUANTITY_MISMATCH',
        severity: 'CRITICAL',
        fieldPath: 'items[Paneer Tikka Roll].quantity',
        valueA: 2,
        valueB: 3
      }
    ]);

    return { tenantId, sourceA, sourceB, candidate };
  };

  describe('1. Business Safety Rule: CONFIRMED_DUPLICATE Does NOT Sum Quantities', () => {
    it('links duplicate records to the same canonical order without adding quantities together', async () => {
      const { tenantId, sourceA, sourceB, candidate } = await setupQuantityConflictPair();

      const res = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_DUPLICATE',
          reason: 'Source B is duplicate chatter for initial order. Retaining original intake quantity.',
          idempotencyKey: `RES-DUP-${candidate.id}-${Date.now()}`
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newCandidateStatus).toBe('RESOLVED_DUPLICATE');

      // Verify canonical order: Paneer Tikka Roll quantity must remain 2 (NOT 2 + 3 = 5!)
      const canon = await canonicalOrderRepository.findById(tenantId, res.body.canonicalOrderId);
      expect(canon).toBeDefined();
      const rollItem = canon!.items.find(i => i.itemName.toLowerCase().includes('paneer'));
      expect(rollItem).toBeDefined();
      expect(rollItem!.quantity).toBe(2); // Non-negotiable: MUST NOT SUM

      // Verify source quantities remain completely unchanged
      const freshSourceA = await sourceOrderRepository.findById(tenantId, sourceA.id);
      const freshSourceB = await sourceOrderRepository.findById(tenantId, sourceB.id);
      expect(freshSourceA!.items[0].quantity).toBe(2);
      expect(freshSourceB!.items[0].quantity).toBe(3);

      // Verify both source orders are linked to the same canonical order
      const linkA = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceA.id);
      const linkB = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceB.id);
      expect(linkA!.canonicalOrderId).toBe(canon!.id);
      expect(linkB!.canonicalOrderId).toBe(canon!.id);
    });
  });

  describe('2. Business Safety Rule: CONFIRMED_UPDATE Modifies Only Approved Value', () => {
    it('updates only the approved item quantity to 3 while preserving raw source records unmodified', async () => {
      const { tenantId, sourceA, sourceB, candidate } = await setupQuantityConflictPair();

      const res = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_UPDATE',
          reason: 'Customer explicitly amended order via WhatsApp to 3 rolls.',
          approvedChanges: [
            { fieldPath: 'items[Paneer Tikka Roll].quantity', value: 3 }
          ],
          idempotencyKey: `RES-UPD-${candidate.id}-${Date.now()}`
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newCandidateStatus).toBe('RESOLVED_UPDATE');

      // Canonical truth is now updated to 3
      const canon = await canonicalOrderRepository.findById(tenantId, res.body.canonicalOrderId);
      const rollItem = canon!.items.find(i => i.itemName.toLowerCase().includes('paneer'));
      expect(rollItem!.quantity).toBe(3);

      // Other items (Naan) remain completely unaffected (2)
      const naanItem = canon!.items.find(i => i.itemName.toLowerCase().includes('naan'));
      expect(naanItem!.quantity).toBe(2);

      // Raw source orders must preserve their original evidence unmodified
      const freshSourceA = await sourceOrderRepository.findById(tenantId, sourceA.id);
      const freshSourceB = await sourceOrderRepository.findById(tenantId, sourceB.id);
      expect(freshSourceA!.items[0].quantity).toBe(2); // Still 2
      expect(freshSourceB!.items[0].quantity).toBe(3); // Still 3
    });
  });

  describe('3. CONFIRMED_SEPARATE Maintains Independent Canonical Orders', () => {
    it('maintains distinct canonical orders and does not merge records', async () => {
      const { tenantId, sourceA, sourceB, candidate } = await setupQuantityConflictPair();

      const res = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_SEPARATE',
          reason: 'Two separate orders placed for different members of the family.',
          idempotencyKey: `RES-SEP-${candidate.id}-${Date.now()}`
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newCandidateStatus).toBe('RESOLVED_SEPARATE');

      // Verify both source orders have distinct canonical orders
      const linkA = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceA.id);
      const linkB = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceB.id);
      expect(linkA!.canonicalOrderId).not.toBe(linkB!.canonicalOrderId);
    });
  });

  describe('4. KEEP_PENDING Leaves Canonical State Untouched', () => {
    it('retains candidate in review without altering canonical orders or links', async () => {
      const { tenantId, sourceA, sourceB, candidate } = await setupQuantityConflictPair();

      const res = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'KEEP_PENDING',
          reason: 'Customer verification message dispatched; awaiting customer confirmation.',
          idempotencyKey: `RES-PEND-${candidate.id}-${Date.now()}`
        });

      expect(res.status).toBe(200);
      expect(res.body.newCandidateStatus).toBe('IN_REVIEW');

      // Canonical state of Source A remains version 1 and unmerged
      const linkA = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceA.id);
      const canon = await canonicalOrderRepository.findById(tenantId, linkA!.canonicalOrderId);
      expect(canon!.version).toBe(1);
    });
  });

  describe('5. Concurrency & Optimistic Version Control', () => {
    it('rejects stale requests with HTTP 409 Conflict when canonical version does not match', async () => {
      const { tenantId, sourceA, sourceB, candidate } = await setupQuantityConflictPair();

      // Establish canonical order
      const linkA = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceA.id) || 
        await (async () => {
          const canon = await canonicalOrderRepository.createFromSourceOrder(tenantId, sourceA, 'INITIAL_INTAKE');
          return await orderLinkRepository.linkSourceToCanonical(tenantId, sourceA.id, canon.id, 'INITIAL_CANONICAL', 'Ops');
        })();

      // Reviewer 1 resolves the case successfully
      const firstRes = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_UPDATE',
          reason: 'Reviewer 1 approved update',
          expectedCanonicalVersion: 1,
          approvedChanges: [
            { fieldPath: 'items[Paneer Tikka Roll].quantity', value: 3 }
          ],
          idempotencyKey: `RES-CONC-1-${Date.now()}`
        });

      expect(firstRes.status).toBe(200);

      // Reviewer 2 concurrently submits with the now stale version (version 1)
      const staleRes = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_UPDATE',
          reason: 'Reviewer 2 submitted on stale screen',
          expectedCanonicalVersion: 1, // Stale!
          approvedChanges: [
            { fieldPath: 'items[Paneer Tikka Roll].quantity', value: 2 }
          ],
          idempotencyKey: `RES-CONC-2-${Date.now()}`
        });

      expect(staleRes.status).toBe(409);
      expect(staleRes.body.error).toBeDefined();
      expect(['ERR_ALREADY_RESOLVED', 'ERR_STALE_VERSION']).toContain(staleRes.body.error.code);
    });
  });

  describe('6. Multi-Tenant Isolation & Security', () => {
    it('rejects cross-tenant resolution attempts with HTTP 404', async () => {
      const { candidate } = await setupQuantityConflictPair();

      const res = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(crossTenantHeaders) // Tenant 999 attempting to resolve Tenant 1 candidate
        .send({
          decision: 'CONFIRMED_DUPLICATE',
          reason: 'Malicious or accidental cross-tenant action',
          idempotencyKey: `RES-CROSS-${Date.now()}`
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('7. Request Idempotency', () => {
    it('returns identical cached result when repeating the same idempotency key', async () => {
      const { candidate } = await setupQuantityConflictPair();
      const idempotencyKey = `IDEM-REPLAY-${Date.now()}`;

      const res1 = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_DUPLICATE',
          reason: 'Duplicate intake',
          idempotencyKey
        });

      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_DUPLICATE',
          reason: 'Duplicate intake replay',
          idempotencyKey
        });

      expect(res2.status).toBe(200);
      expect(res2.body.isIdempotentReplay).toBe(true);
      expect(res2.body.auditId).toBe(res1.body.auditId);
    });
  });

  describe('8. Immutable Audit Trail & HMAC Verification', () => {
    it('records an HMAC-signed audit event for every material resolution action', async () => {
      const { candidate } = await setupQuantityConflictPair();

      const res = await request(app)
        .post(`/api/v1/duplicate-candidates/${candidate.id}/resolve`)
        .set(tenantHeaders)
        .send({
          decision: 'CONFIRMED_UPDATE',
          reason: 'Audit verification test',
          approvedChanges: [
            { fieldPath: 'items[Paneer Tikka Roll].quantity', value: 3 }
          ],
          idempotencyKey: `RES-AUD-${candidate.id}-${Date.now()}`
        });

      expect(res.status).toBe(200);
      expect(res.body.auditId).toBeDefined();

      // Retrieve audit events
      const events = await AuditRepository.findEventsByEntity(1, 'DUPLICATE_CANDIDATE', String(candidate.id));
      expect(events.length).toBeGreaterThanOrEqual(1);

      const event = events.find(e => e.id === Number(res.body.auditId));
      expect(event).toBeDefined();
      expect(event!.action).toBe('OPERATOR_OVERRIDE_CONFIRMED');
      expect(event!.signature).toBeDefined();
      expect(event!.signature).toContain('HMAC-SHA256');
    });
  });

  describe('9. Single Active Canonical Link Invariant', () => {
    it('ensures a source order cannot have multiple active canonical links simultaneously', async () => {
      const { tenantId, sourceA, sourceB } = await setupQuantityConflictPair();

      const canonical1 = await canonicalOrderRepository.createFromSourceOrder(tenantId, sourceA, 'INITIAL_INGESTION');
      const canonical2 = await canonicalOrderRepository.createFromSourceOrder(tenantId, sourceB, 'MANUAL');

      // First link
      const link1 = await orderLinkRepository.linkSourceToCanonical(tenantId, sourceA.id, canonical1.id, 'INITIAL_CANONICAL', 'Admin');
      expect(link1.unlinkedAt).toBeNull();

      // Establishing link to a different canonical order must supersede the first one
      const link2 = await orderLinkRepository.linkSourceToCanonical(tenantId, sourceA.id, canonical2.id, 'CONFIRMED_UPDATE', 'Admin');
      expect(link2.canonicalOrderId).toBe(canonical2.id);
      expect(link2.unlinkedAt).toBeNull();

      // Verify active link lookup returns exactly one active link
      const activeLink = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceA.id);
      expect(activeLink).toBeDefined();
      expect(activeLink!.canonicalOrderId).toBe(canonical2.id);
    });
  });
});
