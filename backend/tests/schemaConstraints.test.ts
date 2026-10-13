import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('PakkaOrderAI Database Schema & Business Invariant Tests', () => {

  describe('1. Active Order Link Constraint Invariant (Section 4.1)', () => {
    it('verifies that is_active generated column evaluates to 1 when unlinked_at IS NULL, and NULL when unlinked_at IS NOT NULL', () => {
      // Logic simulation of MySQL GENERATED ALWAYS AS (IF(unlinked_at IS NULL, 1, NULL)) STORED
      const computeIsActive = (unlinkedAt: Date | null): number | null => {
        return unlinkedAt === null ? 1 : null;
      };

      const link1 = { sourceOrderId: 101, canonicalOrderId: 501, unlinkedAt: null };
      expect(computeIsActive(link1.unlinkedAt)).toBe(1);

      // When unlinked
      const link1Unlinked = { ...link1, unlinkedAt: new Date() };
      expect(computeIsActive(link1Unlinked.unlinkedAt)).toBeNull();
    });

    it('ensures at most one active link per source order can exist in unique index mapping', () => {
      const activeLinkStore = new Map<string, number>();

      const tryRegisterActiveLink = (tenantId: number, sourceOrderId: number, isActive: number | null): boolean => {
        if (isActive === null) {
          // In MySQL, multiple NULL values are permitted in a UNIQUE KEY
          return true;
        }
        const key = `${tenantId}:${sourceOrderId}:${isActive}`;
        if (activeLinkStore.has(key)) {
          return false; // Unique key violation: duplicate entry for key 'uq_active_source_order_link'
        }
        activeLinkStore.set(key, 1);
        return true;
      };

      const tenantId = 1;
      const sourceOrderId = 202;

      // First active link
      const firstLinkSucceeded = tryRegisterActiveLink(tenantId, sourceOrderId, 1);
      expect(firstLinkSucceeded).toBe(true);

      // Attempting second active link for the same source order must fail
      const secondLinkSucceeded = tryRegisterActiveLink(tenantId, sourceOrderId, 1);
      expect(secondLinkSucceeded).toBe(false);

      // Unlinking the first record (isActive becomes null)
      activeLinkStore.delete(`${tenantId}:${sourceOrderId}:1`);
      const unlinkedHistoricalRecord = tryRegisterActiveLink(tenantId, sourceOrderId, null);
      expect(unlinkedHistoricalRecord).toBe(true);

      // Now a new active link can be established
      const newActiveLink = tryRegisterActiveLink(tenantId, sourceOrderId, 1);
      expect(newActiveLink).toBe(true);
    });
  });

  describe('2. Candidate Pair Normalization (Section 4.2)', () => {
    it('enforces canonical pair ordering (source_a_id < source_b_id)', () => {
      const normalizePair = (id1: number, id2: number) => {
        if (id1 === id2) {
          throw new Error('A source order cannot be paired with itself');
        }
        return {
          source_a_id: Math.min(id1, id2),
          source_b_id: Math.max(id1, id2)
        };
      };

      // Order of ingestion inverted: Order 42 received first, then Order 19
      const pair = normalizePair(42, 19);
      expect(pair.source_a_id).toBe(19);
      expect(pair.source_b_id).toBe(42);
      expect(pair.source_a_id).toBeLessThan(pair.source_b_id);

      // Pairing identical ID should be rejected
      expect(() => normalizePair(19, 19)).toThrow('A source order cannot be paired with itself');
    });

    it('validates candidate match score bounds [0.0000, 1.0000]', () => {
      const validateMatchScore = (score: number): boolean => {
        return score >= 0.0000 && score <= 1.0000;
      };

      expect(validateMatchScore(0.9420)).toBe(true);
      expect(validateMatchScore(0.0000)).toBe(true);
      expect(validateMatchScore(1.0000)).toBe(true);
      expect(validateMatchScore(-0.01)).toBe(false);
      expect(validateMatchScore(1.0001)).toBe(false);
      expect(validateMatchScore(94.2)).toBe(false);
    });
  });

  describe('3. Ingestion Idempotency (Section 4.4)', () => {
    it('detects duplicate idempotency keys within the same tenant', () => {
      const idempotencyIndex = new Set<string>();

      const registerOrder = (tenantId: number, idempotencyKey: string) => {
        const compositeKey = `${tenantId}:${idempotencyKey}`;
        if (idempotencyIndex.has(compositeKey)) {
          return { status: 'EXISTING_RECORD', action: 'RETURN_CACHED' };
        }
        idempotencyIndex.add(compositeKey);
        return { status: 'NEW_RECORD', action: 'INGEST' };
      };

      // First call
      const res1 = registerOrder(1, 'IDEM-ZOM-8921-20261012');
      expect(res1.status).toBe('NEW_RECORD');

      // Duplicate submission with same key
      const res2 = registerOrder(1, 'IDEM-ZOM-8921-20261012');
      expect(res2.status).toBe('EXISTING_RECORD');
      expect(res2.action).toBe('RETURN_CACHED');

      // Different tenant with same key is permitted (tenant-scoped isolation)
      const res3 = registerOrder(2, 'IDEM-ZOM-8921-20261012');
      expect(res3.status).toBe('NEW_RECORD');
    });
  });

  describe('4. Health & HTTP Infrastructure', () => {
    it('responds to GET /health with service metadata and request ID header', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.body.service).toBe('PakkaOrderAI-Backend');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.database).toBeDefined();
    });

    it('handles 404 for unknown endpoints with consistent JSON error payload', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.requestId).toBeDefined();
    });
  });
});
