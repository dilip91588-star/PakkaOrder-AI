import { pool } from '../db/pool.js';
import type { 
  DuplicateCandidateRow, 
  OrderConflictRow, 
  ReviewStatus, 
  CandidateRelationshipType 
} from '../types/index.js';
import type { DetectedConflict } from '../services/itemComparisonService.js';
import type { MatchFeatures } from '../services/matchingEngine.js';

export interface CandidateUpsertInput {
  tenantId: number;
  sourceAId: number;
  sourceBId: number;
  matchScore: number;
  matchFeatures: MatchFeatures;
  algorithmVersion: string;
  relationshipType: CandidateRelationshipType;
  reviewStatus?: ReviewStatus;
}

export interface CandidateFilters {
  reviewStatus?: ReviewStatus;
  minScore?: number;
  relationshipType?: CandidateRelationshipType;
  channel?: string;
  page?: number;
  pageSize?: number;
}

// In-memory store fallback for testing & local development
const inMemoryCandidates: Map<string, DuplicateCandidateRow> = new Map();
const inMemoryConflicts: Map<number, OrderConflictRow[]> = new Map();
let candidateAutoId = 1000;
let conflictAutoId = 5000;

export class DuplicateCandidateRepository {
  /**
   * Upserts a duplicate candidate record ensuring pair order invariant (source_a_id < source_b_id)
   * and preserving historical review decisions if already decided.
   */
  static async upsertCandidate(input: CandidateUpsertInput): Promise<DuplicateCandidateRow> {
    const sourceAId = Math.min(input.sourceAId, input.sourceBId);
    const sourceBId = Math.max(input.sourceAId, input.sourceBId);

    if (sourceAId === sourceBId) {
      throw new Error('A source order cannot be a duplicate candidate of itself.');
    }

    try {
      // Check if candidate already exists in MySQL
      const [existingRows] = (await pool.execute(
        `SELECT id, review_status, reviewed_by, reviewed_at, resolution_notes
         FROM duplicate_candidates
         WHERE tenant_id = ? AND source_a_id = ? AND source_b_id = ?`,
        [input.tenantId, sourceAId, sourceBId]
      )) as any;

      if (existingRows.length > 0) {
        const existing = existingRows[0];
        // Preserve historical decision if already resolved
        const isAlreadyResolved = existing.review_status !== 'PENDING';
        const finalStatus = isAlreadyResolved ? existing.review_status : (input.reviewStatus || 'PENDING');
        const finalReviewedBy = isAlreadyResolved ? existing.reviewed_by : null;
        const finalReviewedAt = isAlreadyResolved ? existing.reviewed_at : null;
        const finalNotes = isAlreadyResolved ? existing.resolution_notes : null;

        await pool.execute(
          `UPDATE duplicate_candidates
           SET match_score = ?,
               match_features = ?,
               algorithm_version = ?,
               relationship_type = ?,
               review_status = ?,
               reviewed_by = ?,
               reviewed_at = ?,
               resolution_notes = ?,
               updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          [
            input.matchScore.toFixed(4),
            JSON.stringify(input.matchFeatures),
            input.algorithmVersion,
            input.relationshipType,
            finalStatus,
            finalReviewedBy,
            finalReviewedAt,
            finalNotes,
            existing.id
          ]
        );

        return {
          id: existing.id,
          tenant_id: input.tenantId,
          source_a_id: sourceAId,
          source_b_id: sourceBId,
          match_score: input.matchScore.toFixed(4),
          match_features: input.matchFeatures as unknown as Record<string, unknown>,
          algorithm_version: input.algorithmVersion,
          relationship_type: input.relationshipType,
          review_status: finalStatus,
          reviewed_by: finalReviewedBy,
          reviewed_at: finalReviewedAt,
          resolution_notes: finalNotes,
          created_at: new Date(),
          updated_at: new Date()
        };
      } else {
        const [result] = (await pool.execute(
          `INSERT INTO duplicate_candidates (
             tenant_id, source_a_id, source_b_id, match_score, match_features,
             algorithm_version, relationship_type, review_status, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
          [
            input.tenantId,
            sourceAId,
            sourceBId,
            input.matchScore.toFixed(4),
            JSON.stringify(input.matchFeatures),
            input.algorithmVersion,
            input.relationshipType,
            input.reviewStatus || 'PENDING'
          ]
        )) as any;

        return {
          id: result.insertId,
          tenant_id: input.tenantId,
          source_a_id: sourceAId,
          source_b_id: sourceBId,
          match_score: input.matchScore.toFixed(4),
          match_features: input.matchFeatures as unknown as Record<string, unknown>,
          algorithm_version: input.algorithmVersion,
          relationship_type: input.relationshipType,
          review_status: input.reviewStatus || 'PENDING',
          reviewed_by: null,
          reviewed_at: null,
          resolution_notes: null,
          created_at: new Date(),
          updated_at: new Date()
        };
      }
    } catch (_err) {
      console.error('[DuplicateCandidateRepository] upsertCandidate error:', _err);
      // In-Memory Fallback
      const key = `${input.tenantId}:${sourceAId}:${sourceBId}`;
      const existing = inMemoryCandidates.get(key);

      if (existing) {
        const isResolved = existing.review_status !== 'PENDING';
        existing.match_score = input.matchScore.toFixed(4);
        existing.match_features = input.matchFeatures as unknown as Record<string, unknown>;
        existing.algorithm_version = input.algorithmVersion;
        existing.relationship_type = input.relationshipType;
        if (!isResolved) {
          existing.review_status = input.reviewStatus || 'PENDING';
        }
        existing.updated_at = new Date();
        return existing;
      }

      const id = ++candidateAutoId;
      const record: DuplicateCandidateRow = {
        id,
        tenant_id: input.tenantId,
        source_a_id: sourceAId,
        source_b_id: sourceBId,
        match_score: input.matchScore.toFixed(4),
        match_features: input.matchFeatures as unknown as Record<string, unknown>,
        algorithm_version: input.algorithmVersion,
        relationship_type: input.relationshipType,
        review_status: input.reviewStatus || 'PENDING',
        reviewed_by: null,
        reviewed_at: null,
        resolution_notes: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryCandidates.set(key, record);
      return record;
    }
  }

  /**
   * Persists detected field-level conflicts for a candidate.
   */
  static async replaceConflicts(
    candidateId: number,
    tenantId: number,
    conflicts: DetectedConflict[]
  ): Promise<void> {
    try {
      // Delete old unresolved conflicts for this candidate
      await pool.execute(
        `DELETE FROM order_conflicts
         WHERE candidate_id = ? AND tenant_id = ? AND resolution_status = 'UNRESOLVED'`,
        [candidateId, tenantId]
      );

      for (const c of conflicts) {
        await pool.execute(
          `INSERT INTO order_conflicts (
             tenant_id, candidate_id, conflict_type, field_path,
             value_a, value_b, severity, resolution_status, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED', CURRENT_TIMESTAMP(3))`,
          [
            tenantId,
            candidateId,
            c.conflictType,
            c.fieldPath,
            JSON.stringify(c.valueA),
            JSON.stringify(c.valueB),
            c.severity
          ]
        );
      }
    } catch (_err) {
      // In-Memory Fallback
      const conflictRows: OrderConflictRow[] = conflicts.map(c => ({
        id: ++conflictAutoId,
        tenant_id: tenantId,
        candidate_id: candidateId,
        conflict_type: c.conflictType,
        field_path: c.fieldPath,
        value_a: c.valueA,
        value_b: c.valueB,
        severity: c.severity,
        resolution_status: 'UNRESOLVED',
        resolution_notes: null,
        resolved_by: null,
        resolved_at: null,
        created_at: new Date()
      }));
      inMemoryConflicts.set(candidateId, conflictRows);
    }
  }

  /**
   * Finds candidate by ID with associated conflicts.
   */
  static async findById(
    tenantId: number,
    candidateId: number
  ): Promise<{ candidate: DuplicateCandidateRow; conflicts: OrderConflictRow[] } | null> {
    try {
      const [candRows] = (await pool.execute(
        `SELECT * FROM duplicate_candidates WHERE id = ? AND tenant_id = ?`,
        [candidateId, tenantId]
      )) as any;

      if (!candRows.length) return null;

      const [conflictRows] = (await pool.execute(
        `SELECT * FROM order_conflicts WHERE candidate_id = ? AND tenant_id = ?`,
        [candidateId, tenantId]
      )) as any;

      return {
        candidate: candRows[0],
        conflicts: conflictRows
      };
    } catch (_err) {
      // In-Memory Fallback
      for (const c of inMemoryCandidates.values()) {
        if (c.id === candidateId && c.tenant_id === tenantId) {
          const conflicts = inMemoryConflicts.get(candidateId) || [];
          return { candidate: c, conflicts };
        }
      }
      return null;
    }
  }

  /**
   * Lists candidates with filters and pagination for the Review Queue.
   */
  static async findCandidates(
    tenantId: number,
    filters: CandidateFilters = {}
  ): Promise<{ candidates: DuplicateCandidateRow[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize || 20));
    const offset = (page - 1) * pageSize;

    try {
      let query = `SELECT * FROM duplicate_candidates WHERE tenant_id = ?`;
      const params: any[] = [tenantId];

      if (filters.reviewStatus) {
        query += ` AND review_status = ?`;
        params.push(filters.reviewStatus);
      }
      if (filters.relationshipType) {
        query += ` AND relationship_type = ?`;
        params.push(filters.relationshipType);
      }
      if (filters.minScore !== undefined) {
        query += ` AND match_score >= ?`;
        params.push(filters.minScore);
      }

      query += ` ORDER BY match_score DESC, created_at DESC LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);

      const [rows] = (await pool.execute(query, params)) as any;
      const [countRows] = (await pool.execute(
        `SELECT COUNT(*) as total FROM duplicate_candidates WHERE tenant_id = ?`,
        [tenantId]
      )) as any;

      return {
        candidates: rows,
        total: countRows[0]?.total || rows.length
      };
    } catch (_err) {
      // In-Memory Fallback
      let list = Array.from(inMemoryCandidates.values()).filter(c => c.tenant_id === tenantId);

      if (filters.reviewStatus) {
        list = list.filter(c => c.review_status === filters.reviewStatus);
      }
      if (filters.relationshipType) {
        list = list.filter(c => c.relationship_type === filters.relationshipType);
      }
      if (filters.minScore !== undefined) {
        list = list.filter(c => Number(c.match_score) >= filters.minScore!);
      }

      list.sort((a, b) => Number(b.match_score) - Number(a.match_score));
      const total = list.length;
      const paginated = list.slice(offset, offset + pageSize);

      return { candidates: paginated, total };
    }
  }

  /**
   * Resets in-memory store (for testing purposes).
   */
  static resetStore(): void {
    inMemoryCandidates.clear();
    inMemoryConflicts.clear();
    candidateAutoId = 1000;
    conflictAutoId = 5000;
  }
}
