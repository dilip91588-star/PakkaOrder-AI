import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { MatchingEngine, type SourceOrderComparisonRecord } from '../src/services/matchingEngine.js';
import { NormalizationService } from '../src/services/normalizationService.js';
import { ItemComparisonService } from '../src/services/itemComparisonService.js';
import { DuplicateCandidateRepository } from '../src/repositories/duplicateCandidateRepository.js';
import { sourceOrderRepository } from '../src/repositories/sourceOrderRepository.js';
import { candidateGenerationService } from '../src/services/candidateGenerationService.js';
import { DEFAULT_MATCHING_CONFIG } from '../src/config/matchingConfig.js';

describe('Phase 5: Deterministic Order Matching & Conflict Detection Engine', () => {
  let engine: MatchingEngine;

  beforeEach(() => {
    engine = new MatchingEngine(DEFAULT_MATCHING_CONFIG);
    DuplicateCandidateRepository.resetStore();
    sourceOrderRepository.resetStore();
  });

  describe('1. Normalization Subsystem', () => {
    it('normalizes Indian phone numbers into standard E.164 (+91) format', () => {
      expect(NormalizationService.normalizePhone('9811234555').normalized).toBe('+919811234555');
      expect(NormalizationService.normalizePhone('+91 98112-34555').normalized).toBe('+919811234555');
      expect(NormalizationService.normalizePhone('09811234555').normalized).toBe('+919811234555');
    });

    it('treats missing or invalid phone numbers as unknown (normalized: null)', () => {
      const empty = NormalizationService.normalizePhone('');
      expect(empty.normalized).toBeNull();
      expect(empty.isValid).toBe(false);

      const invalid = NormalizationService.normalizePhone('12345');
      expect(invalid.normalized).toBeNull();
      expect(invalid.isValid).toBe(false);
    });

    it('normalizes product names while isolating variants and customizations', () => {
      const item = NormalizationService.normalizeItemRef('Butter Chicken (Boneless) [Extra Spicy]', 'pcs');
      expect(item.normalizedName).toBe('butter chicken');
      expect(item.detectedVariant).toBe('boneless');
      expect(item.detectedCustomizations).toContain('Extra Spicy');
      expect(item.unit).toBe('item');
    });

    it('standardizes Indian delivery addresses and expands common abbreviations', () => {
      const addr = NormalizationService.normalizeAddress('Flat 402, 12th Main Rd, Opp Metro, Indiranagar, Blr 560038');
      expect(addr.normalized).toContain('road');
      expect(addr.normalized).toContain('opposite');
      expect(addr.normalized).toContain('bangalore');
      expect(addr.pincode).toBe('560038');
    });
  });

  describe('2. Required Test Dataset & Matching Scenarios', () => {
    it('Scenario 1: Same order on WhatsApp and POS with matching quantities -> Potential Duplicate with 0 conflicts', () => {
      const whatsappOrder: SourceOrderComparisonRecord = {
        id: 101,
        tenantId: 1,
        channel: 'WHATSAPP',
        externalOrderId: 'WA-8831',
        customerName: 'Aditya Nair',
        customerPhone: '+919811234555',
        deliveryAddress: 'HAL 2nd Stage, Indiranagar',
        receivedAt: new Date('2026-10-12T12:00:00Z'),
        reportedTotal: 280,
        items: [
          { name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 120, unit: 'portion' },
          { name: 'Masala Chaas', quantity: 1, unitPrice: 40, unit: 'bottle' }
        ]
      };

      const posOrder: SourceOrderComparisonRecord = {
        id: 102,
        tenantId: 1,
        channel: 'POS',
        externalOrderId: 'POS-4401',
        customerName: 'Aditya Nair',
        customerPhone: '+91 98112-34555',
        deliveryAddress: 'HAL 2nd Stage, Indiranagar',
        receivedAt: new Date('2026-10-12T12:03:00Z'),
        reportedTotal: 280,
        items: [
          { name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 120, unit: 'portion' },
          { name: 'Masala Chaas', quantity: 1, unitPrice: 40, unit: 'bottle' }
        ]
      };

      const result = engine.evaluatePair(whatsappOrder, posOrder);

      expect(result.matchScore).toBeGreaterThanOrEqual(0.90);
      expect(result.relationshipType).toBe('POTENTIAL_DUPLICATE');
      expect(result.conflicts).toHaveLength(0);
      expect(result.matchFeatures.phoneSimilarity).toBe(1.0);
      expect(result.matchFeatures.hasQuantityMismatch).toBe(false);
      expect(result.algorithmVersion).toBe(DEFAULT_MATCHING_CONFIG.algorithmVersion);
    });

    it('Scenario 2 (CRITICAL PRODUCT RULE): Quantity 2 versus Quantity 3 -> creates explicit reviewable QUANTITY_MISMATCH conflict and does not auto-merge', () => {
      const orderA: SourceOrderComparisonRecord = {
        id: 201,
        tenantId: 1,
        channel: 'WHATSAPP',
        customerName: 'Priya Sharma',
        customerPhone: '+919876543210',
        deliveryAddress: 'Prestige Ozone, Whitefield',
        receivedAt: new Date('2026-10-12T13:00:00Z'),
        reportedTotal: 480,
        items: [
          { name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 240, unit: 'portion' }
        ]
      };

      const orderB: SourceOrderComparisonRecord = {
        id: 202,
        tenantId: 1,
        channel: 'POS',
        customerName: 'Priya Sharma',
        customerPhone: '+919876543210',
        deliveryAddress: 'Prestige Ozone, Whitefield',
        receivedAt: new Date('2026-10-12T13:04:00Z'),
        reportedTotal: 720,
        items: [
          { name: 'Paneer Tikka Roll', quantity: 3, unitPrice: 240, unit: 'portion' }
        ]
      };

      const result = engine.evaluatePair(orderA, orderB);

      // Verify score is high due to customer/address/item match, BUT quantity mismatch is explicitly flagged
      expect(result.matchScore).toBeGreaterThanOrEqual(0.80);
      expect(result.matchFeatures.hasQuantityMismatch).toBe(true);
      expect(result.relationshipType).toBe('SUSPECTED_UPDATE');

      // Verify explicit field-level conflict
      const qtyConflict = result.conflicts.find(c => c.conflictType === 'QUANTITY_MISMATCH');
      expect(qtyConflict).toBeDefined();
      expect(qtyConflict?.severity).toBe('CRITICAL');
      expect(qtyConflict?.fieldPath).toContain('quantity');
      expect(qtyConflict?.valueA).toEqual({ quantity: 2, unitPrice: 240, name: 'Paneer Tikka Roll' });
      expect(qtyConflict?.valueB).toEqual({ quantity: 3, unitPrice: 240, name: 'Paneer Tikka Roll' });

      // Non-negotiable rule #7: Never sum duplicate quantities (e.g. 2 + 3 = 5 is forbidden)
      expect(result.matchFeatures.reportedTotalDifference).toBe(240);
    });

    it('Scenario 3: Same customer placing two separate orders close together -> ITEM_MISMATCH conflict keeps them distinct', () => {
      const lunchOrder: SourceOrderComparisonRecord = {
        id: 301,
        tenantId: 1,
        channel: 'SWIGGY',
        customerName: 'Vikram Seth',
        customerPhone: '+919988776655',
        deliveryAddress: '100 Feet Rd, Indiranagar',
        receivedAt: new Date('2026-10-12T13:00:00Z'),
        reportedTotal: 300,
        items: [
          { name: 'Veg Dum Biryani', quantity: 1, unitPrice: 300 }
        ]
      };

      const beverageOrder: SourceOrderComparisonRecord = {
        id: 302,
        tenantId: 1,
        channel: 'SWIGGY',
        customerName: 'Vikram Seth',
        customerPhone: '+919988776655',
        deliveryAddress: '100 Feet Rd, Indiranagar',
        receivedAt: new Date('2026-10-12T13:08:00Z'),
        reportedTotal: 80,
        items: [
          { name: 'Cold Coffee Frappe', quantity: 1, unitPrice: 80 }
        ]
      };

      const result = engine.evaluatePair(lunchOrder, beverageOrder);

      // Item overlap is 0
      expect(result.matchFeatures.itemSimilarity).toBe(0.0);
      expect(result.relationshipType).toBe('SEPARATE_ORDER_AMBIGUOUS');
      const itemConflicts = result.conflicts.filter(c => c.conflictType === 'ITEM_MISMATCH');
      expect(itemConflicts.length).toBeGreaterThan(0);
    });

    it('Scenario 4: Same product name but different variant -> variant conflict flagged', () => {
      const boneless: SourceOrderComparisonRecord = {
        id: 401,
        tenantId: 1,
        channel: 'POS',
        customerName: 'Rahul Verma',
        customerPhone: '+919123456789',
        receivedAt: new Date('2026-10-12T14:00:00Z'),
        reportedTotal: 380,
        items: [
          { name: 'Butter Chicken (Boneless)', quantity: 1, unitPrice: 380, variant: 'boneless' }
        ]
      };

      const withBone: SourceOrderComparisonRecord = {
        id: 402,
        tenantId: 1,
        channel: 'WHATSAPP',
        customerName: 'Rahul Verma',
        customerPhone: '+919123456789',
        receivedAt: new Date('2026-10-12T14:02:00Z'),
        reportedTotal: 340,
        items: [
          { name: 'Butter Chicken (Regular with bone)', quantity: 1, unitPrice: 340, variant: 'with bone' }
        ]
      };

      const result = engine.evaluatePair(boneless, withBone);
      const variantConflict = result.conflicts.find(c => c.fieldPath.includes('variant'));
      expect(variantConflict).toBeDefined();
      expect(variantConflict?.severity).toBe('WARNING');
    });

    it('Scenario 5: Missing phone and address -> treated as unknown, never scored as a confirmed match', () => {
      const orderUnknownA: SourceOrderComparisonRecord = {
        id: 501,
        tenantId: 1,
        channel: 'MANUAL',
        customerName: 'Cash Counter Guest',
        customerPhone: null,
        deliveryAddress: null,
        receivedAt: new Date('2026-10-12T15:00:00Z'),
        reportedTotal: 150,
        items: [{ name: 'Masala Dosa', quantity: 1, unitPrice: 150 }]
      };

      const orderUnknownB: SourceOrderComparisonRecord = {
        id: 502,
        tenantId: 1,
        channel: 'MANUAL',
        customerName: 'Walk-in Guest',
        customerPhone: null,
        deliveryAddress: null,
        receivedAt: new Date('2026-10-12T15:01:00Z'),
        reportedTotal: 150,
        items: [{ name: 'Masala Dosa', quantity: 1, unitPrice: 150 }]
      };

      const result = engine.evaluatePair(orderUnknownA, orderUnknownB);

      // Rule #1: Missing phone/address must NOT be counted as 1.0 match!
      expect(result.matchFeatures.phoneSimilarity).toBeNull();
      expect(result.matchFeatures.addressSimilarity).toBeNull();
      expect(result.relationshipType).toBe('SEPARATE_ORDER_AMBIGUOUS');
    });

    it('Scenario 6: Different customers at the same address -> phone mismatch prevents false duplication', () => {
      const residentA: SourceOrderComparisonRecord = {
        id: 601,
        tenantId: 1,
        channel: 'SWIGGY',
        customerName: 'Neha Kapoor',
        customerPhone: '+919811122233',
        deliveryAddress: 'Flat 101, Palm Grove Apartments, Indiranagar',
        receivedAt: new Date('2026-10-12T19:00:00Z'),
        reportedTotal: 400,
        items: [{ name: 'Paneer Butter Masala', quantity: 1, unitPrice: 400 }]
      };

      const residentB: SourceOrderComparisonRecord = {
        id: 602,
        tenantId: 1,
        channel: 'ZOMATO',
        customerName: 'Sanjay Gupta',
        customerPhone: '+919777888999',
        deliveryAddress: 'Flat 101, Palm Grove Apartments, Indiranagar',
        receivedAt: new Date('2026-10-12T19:05:00Z'),
        reportedTotal: 400,
        items: [{ name: 'Paneer Butter Masala', quantity: 1, unitPrice: 400 }]
      };

      const result = engine.evaluatePair(residentA, residentB);

      expect(result.matchFeatures.phoneSimilarity).toBe(0.0);
      expect(result.matchFeatures.addressSimilarity).toBe(1.0);
      expect(result.relationshipType).toBe('SEPARATE_ORDER_AMBIGUOUS');
    });

    it('Scenario 7: Reordered items -> line-order invariance correctly matches items', () => {
      const itemsA = [
        { name: 'Paneer Roll', quantity: 1, unitPrice: 200 },
        { name: 'Cold Coffee', quantity: 1, unitPrice: 100 },
        { name: 'Garlic Bread', quantity: 2, unitPrice: 150 }
      ];

      const itemsB = [
        { name: 'Garlic Bread', quantity: 2, unitPrice: 150 },
        { name: 'Paneer Roll', quantity: 1, unitPrice: 200 },
        { name: 'Cold Coffee', quantity: 1, unitPrice: 100 }
      ];

      const comparison = ItemComparisonService.compareItems(itemsA, itemsB);

      expect(comparison.overallItemSimilarity).toBe(1.0);
      expect(comparison.matchedPairs).toHaveLength(3);
      expect(comparison.quantityDisagreementDetected).toBe(false);
      expect(comparison.conflicts).toHaveLength(0);
    });

    it('Scenario 8: Two separate lines for the same product -> handled without crashes or duplicate counts', () => {
      const itemsA = [
        { name: 'Paneer Roll', quantity: 1, unitPrice: 200, customizations: ['no spicy'] },
        { name: 'Paneer Roll', quantity: 1, unitPrice: 200, customizations: ['extra spicy'] }
      ];

      const itemsB = [
        { name: 'Paneer Roll', quantity: 2, unitPrice: 200 }
      ];

      const comparison = ItemComparisonService.compareItems(itemsA, itemsB);
      // Items match the paneer roll identity
      expect(comparison.matchedPairs.length).toBeGreaterThanOrEqual(1);
    });

    it('Scenario 9: Candidate pair ordering invariant (source_a_id < source_b_id) is strictly enforced', () => {
      const orderHigherId: SourceOrderComparisonRecord = {
        id: 999,
        tenantId: 1,
        channel: 'POS',
        customerPhone: '+919811234555',
        receivedAt: new Date('2026-10-12T12:00:00Z'),
        reportedTotal: 200,
        items: [{ name: 'Roll', quantity: 1, unitPrice: 200 }]
      };

      const orderLowerId: SourceOrderComparisonRecord = {
        id: 111,
        tenantId: 1,
        channel: 'WHATSAPP',
        customerPhone: '+919811234555',
        receivedAt: new Date('2026-10-12T12:01:00Z'),
        reportedTotal: 200,
        items: [{ name: 'Roll', quantity: 1, unitPrice: 200 }]
      };

      const result = engine.evaluatePair(orderHigherId, orderLowerId);

      expect(result.sourceAId).toBe(111);
      expect(result.sourceBId).toBe(999);
      expect(result.sourceAId).toBeLessThan(result.sourceBId);
    });
  });

  describe('3. Candidate Generation, Cross-Tenant Isolation, and REST API', () => {
    it('enforces strict tenant isolation: zero candidate pairs generated across different tenants', async () => {
      // Ingest Order 1 in Tenant 1
      const runId = Date.now();
      const order1Id = await sourceOrderRepository.create({
        tenantId: 1,
        channel: 'WHATSAPP',
        idempotencyKey: `IDEM-T1-01-${runId}`,
        sourceCreatedAt: new Date().toISOString(),
        customerName: `Tenant Isolated User ${runId}`,
        customerPhone: `+9199${runId.toString().slice(-8)}`,
        deliveryAddress: `Isolated Address ${runId}`,
        reportedTotal: 280,
        originalPayload: {},
        currency: 'INR',
        extractionStatus: 'SUCCESS',
        recordStatus: 'UNPROCESSED',
        items: [{ name: 'Unique Isolated Item', quantity: 2, unitPrice: 140 }]
      });

      // Ingest identical Order 2 in Tenant 2 (different restaurant)
      const order2Id = await sourceOrderRepository.create({
        tenantId: 2,
        channel: 'POS',
        idempotencyKey: `IDEM-T2-01-${runId}`,
        sourceCreatedAt: new Date().toISOString(),
        customerName: `Tenant Isolated User ${runId}`,
        customerPhone: `+9199${runId.toString().slice(-8)}`,
        deliveryAddress: `Isolated Address ${runId}`,
        reportedTotal: 280,
        originalPayload: {},
        currency: 'INR',
        extractionStatus: 'SUCCESS',
        recordStatus: 'UNPROCESSED',
        items: [{ name: 'Unique Isolated Item', quantity: 2, unitPrice: 140 }]
      });

      // Process candidates for Tenant 1
      const t1Result = await candidateGenerationService.processOrderForCandidates(1, order1Id);
      // Strict cross-tenant isolation: Tenant 1 must never match Order 2 from Tenant 2
      expect(t1Result.evaluatedCandidates.some(c => c.sourceAId === order2Id || c.sourceBId === order2Id)).toBe(false);

      // Process candidates for Tenant 2
      const t2Result = await candidateGenerationService.processOrderForCandidates(2, order2Id);
      // Strict cross-tenant isolation: Tenant 2 must never match Order 1 from Tenant 1
      expect(t2Result.evaluatedCandidates.some(c => c.sourceAId === order1Id || c.sourceBId === order1Id)).toBe(false);
    });

    it('preserves historical review decisions when recomputing features on an existing candidate', async () => {
      const runId = Date.now();
      const sAId = await sourceOrderRepository.create({
        tenantId: 1,
        channel: 'POS',
        idempotencyKey: `IDEM-ME-A-${runId}`,
        sourceCreatedAt: new Date().toISOString(),
        customerPhone: '+919811234111',
        currency: 'INR',
        reportedTotal: 280,
        originalPayload: {},
        items: [{ name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 140 }]
      });
      const sBId = await sourceOrderRepository.create({
        tenantId: 1,
        channel: 'WHATSAPP',
        idempotencyKey: `IDEM-ME-B-${runId}`,
        sourceCreatedAt: new Date().toISOString(),
        customerPhone: '+919811234111',
        currency: 'INR',
        reportedTotal: 280,
        originalPayload: {},
        items: [{ name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 140 }]
      });

      const candidateRow = await DuplicateCandidateRepository.upsertCandidate({
        tenantId: 1,
        sourceAId: Math.min(sAId, sBId),
        sourceBId: Math.max(sAId, sBId),
        matchScore: 0.88,
        matchFeatures: {
          phoneSimilarity: 1.0,
          customerNameSimilarity: 1.0,
          addressSimilarity: 1.0,
          itemSimilarity: 1.0,
          timeDeltaMinutes: 2,
          timeProximityScore: 1.0,
          channelPair: ['POS', 'WHATSAPP'],
          hasQuantityMismatch: false,
          reportedTotalDifference: 0,
          matchedItemCount: 1,
          unmatchedItemCount: 0
        },
        algorithmVersion: 'v1.0-deterministic-heuristic',
        relationshipType: 'POTENTIAL_DUPLICATE',
        reviewStatus: 'RESOLVED_DUPLICATE'
      });

      // Simulate re-running candidate generation with new algorithm or recomputed features
      const updatedRow = await DuplicateCandidateRepository.upsertCandidate({
        tenantId: 1,
        sourceAId: Math.min(sAId, sBId),
        sourceBId: Math.max(sAId, sBId),
        matchScore: 0.95,
        matchFeatures: {
          phoneSimilarity: 1.0,
          customerNameSimilarity: 1.0,
          addressSimilarity: 1.0,
          itemSimilarity: 1.0,
          timeDeltaMinutes: 2,
          timeProximityScore: 1.0,
          channelPair: ['POS', 'WHATSAPP'],
          hasQuantityMismatch: false,
          reportedTotalDifference: 0,
          matchedItemCount: 1,
          unmatchedItemCount: 0
        },
        algorithmVersion: 'v1.1-deterministic-heuristic',
        relationshipType: 'POTENTIAL_DUPLICATE',
        reviewStatus: 'PENDING'
      });

      // Historical resolution decision must be preserved!
      expect(updatedRow.review_status).toBe('RESOLVED_DUPLICATE');
    });

    it('exposes GET /api/v1/duplicate-candidates and GET /api/v1/duplicate-candidates/:id', async () => {
      const runId = Date.now();
      const sAId = await sourceOrderRepository.create({
        tenantId: 1,
        channel: 'POS',
        idempotencyKey: `IDEM-ME-C-${runId}`,
        sourceCreatedAt: new Date().toISOString(),
        customerPhone: '+919811234222',
        currency: 'INR',
        reportedTotal: 280,
        originalPayload: {},
        items: [{ name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 140 }]
      });
      const sBId = await sourceOrderRepository.create({
        tenantId: 1,
        channel: 'WHATSAPP',
        idempotencyKey: `IDEM-ME-D-${runId}`,
        sourceCreatedAt: new Date().toISOString(),
        customerPhone: '+919811234222',
        currency: 'INR',
        reportedTotal: 280,
        originalPayload: {},
        items: [{ name: 'Paneer Tikka Roll', quantity: 2, unitPrice: 140 }]
      });

      // Seed a test candidate
      const cand = await DuplicateCandidateRepository.upsertCandidate({
        tenantId: 1,
        sourceAId: Math.min(sAId, sBId),
        sourceBId: Math.max(sAId, sBId),
        matchScore: 0.92,
        matchFeatures: {
          phoneSimilarity: 1.0,
          customerNameSimilarity: 1.0,
          addressSimilarity: 0.9,
          itemSimilarity: 1.0,
          timeDeltaMinutes: 3,
          timeProximityScore: 1.0,
          channelPair: ['POS', 'WHATSAPP'],
          hasQuantityMismatch: false,
          reportedTotalDifference: 0,
          matchedItemCount: 1,
          unmatchedItemCount: 0
        },
        algorithmVersion: 'v1.0-deterministic-heuristic',
        relationshipType: 'POTENTIAL_DUPLICATE'
      });

      const listRes = await request(app)
        .get('/api/v1/duplicate-candidates')
        .set('x-tenant-code', 'TEN-001');

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.candidates.length).toBeGreaterThan(0);

      const detailRes = await request(app)
        .get(`/api/v1/duplicate-candidates/${cand.id}`)
        .set('x-tenant-code', 'TEN-001');

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.candidate.id).toBe(cand.id);
      expect(detailRes.body.candidate.algorithmVersion).toBe('v1.0-deterministic-heuristic');
    });
  });
});
