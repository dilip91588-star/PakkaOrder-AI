import { Request, Response } from 'express';
import { DuplicateCandidateRepository } from '../repositories/duplicateCandidateRepository.js';
import { candidateGenerationService } from '../services/candidateGenerationService.js';
import { sourceOrderRepository } from '../repositories/sourceOrderRepository.js';
import { geminiService } from '../services/gemini/geminiService.js';
import type { ReviewStatus, CandidateRelationshipType } from '../types/index.js';

export class DuplicateCandidateController {
  /**
   * GET /api/v1/duplicate-candidates
   * Lists candidates with filters for the Review Queue.
   */
  async listCandidates(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenant.id;
    const { reviewStatus, minScore, relationshipType, page, pageSize } = req.query;

    const filters = {
      reviewStatus: reviewStatus as ReviewStatus | undefined,
      minScore: minScore ? Number(minScore) : undefined,
      relationshipType: relationshipType as CandidateRelationshipType | undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    };

    const { candidates, total } = await DuplicateCandidateRepository.findCandidates(tenantId, filters);

    // Enrich with source order summaries
    const enriched = await Promise.all(
      candidates.map(async c => {
        const sourceA = await sourceOrderRepository.findById(tenantId, c.source_a_id);
        const sourceB = await sourceOrderRepository.findById(tenantId, c.source_b_id);
        const conflictsData = await DuplicateCandidateRepository.findById(tenantId, c.id);

        return {
          id: c.id,
          candidatePairId: `PAIR-${c.source_a_id}-${c.source_b_id}`,
          sourceAId: c.source_a_id,
          sourceBId: c.source_b_id,
          matchScore: Number(c.match_score),
          matchFeatures: typeof c.match_features === 'string' ? JSON.parse(c.match_features) : c.match_features,
          algorithmVersion: c.algorithm_version,
          relationshipType: c.relationship_type,
          reviewStatus: c.review_status,
          openConflictCount: (conflictsData?.conflicts || []).filter(cf => cf.resolution_status === 'UNRESOLVED').length,
          conflicts: conflictsData?.conflicts || [],
          sourceA: sourceA ? {
            id: sourceA.id,
            channel: sourceA.channel,
            externalOrderId: sourceA.externalOrderId,
            customerName: sourceA.customerName,
            customerPhone: sourceA.customerPhone,
            deliveryAddress: sourceA.deliveryAddress,
            reportedTotal: sourceA.reportedTotal,
            receivedAt: sourceA.receivedAt,
            items: sourceA.items
          } : null,
          sourceB: sourceB ? {
            id: sourceB.id,
            channel: sourceB.channel,
            externalOrderId: sourceB.externalOrderId,
            customerName: sourceB.customerName,
            customerPhone: sourceB.customerPhone,
            deliveryAddress: sourceB.deliveryAddress,
            reportedTotal: sourceB.reportedTotal,
            receivedAt: sourceB.receivedAt,
            items: sourceB.items
          } : null,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        };
      })
    );

    res.json({
      success: true,
      candidates: enriched,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total
      }
    });
  }

  /**
   * GET /api/v1/duplicate-candidates/:id
   * Detailed side-by-side view with features and open conflicts.
   */
  async getCandidateById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenant.id;
    const candidateId = Number(req.params.id);

    if (isNaN(candidateId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Candidate ID must be numeric' } });
      return;
    }

    const data = await DuplicateCandidateRepository.findById(tenantId, candidateId);
    if (!data) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: `Duplicate candidate ${candidateId} not found` } });
      return;
    }

    const sourceA = await sourceOrderRepository.findById(tenantId, data.candidate.source_a_id);
    const sourceB = await sourceOrderRepository.findById(tenantId, data.candidate.source_b_id);

    res.json({
      success: true,
      candidate: {
        id: data.candidate.id,
        candidatePairId: `PAIR-${data.candidate.source_a_id}-${data.candidate.source_b_id}`,
        matchScore: Number(data.candidate.match_score),
        matchFeatures: typeof data.candidate.match_features === 'string' ? JSON.parse(data.candidate.match_features) : data.candidate.match_features,
        algorithmVersion: data.candidate.algorithm_version,
        relationshipType: data.candidate.relationship_type,
        reviewStatus: data.candidate.review_status,
        conflicts: data.conflicts,
        sourceA,
        sourceB,
        reviewedBy: data.candidate.reviewed_by,
        reviewedAt: data.candidate.reviewed_at,
        resolutionNotes: data.candidate.resolution_notes,
        createdAt: data.candidate.created_at,
        updatedAt: data.candidate.updated_at
      }
    });
  }

  /**
   * POST /api/v1/source-orders/:id/match
   * Manually runs candidate matching pipeline on a source order.
   */
  async matchSourceOrder(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenant.id;
    const orderId = Number(req.params.id);

    if (isNaN(orderId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Source order ID must be numeric' } });
      return;
    }

    const order = await sourceOrderRepository.findById(tenantId, orderId);
    if (!order) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: `Source order ${orderId} not found` } });
      return;
    }

    const result = await candidateGenerationService.processOrderForCandidates(tenantId, orderId);

    res.json({
      success: true,
      sourceOrderId: orderId,
      candidatesEvaluated: result.evaluatedCandidates.length,
      candidates: result.evaluatedCandidates
    });
  }

  /**
   * POST /api/v1/duplicate-candidates/:id/resolve
   * Executes transactional operator resolution (CONFIRMED_DUPLICATE, CONFIRMED_UPDATE, CONFIRMED_SEPARATE, KEEP_PENDING).
   */
  async resolveCandidate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenant.id;
    const candidateId = Number(req.params.id);

    if (isNaN(candidateId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Candidate ID must be numeric' } });
      return;
    }

    const { resolveCandidateSchema } = await import('../validators/resolutionValidators.js');
    const parseResult = resolveCandidateSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid resolution request payload',
          details: parseResult.error.flatten()
        }
      });
      return;
    }

    try {
      const { resolutionService } = await import('../services/resolutionService.js');
      const result = await resolutionService.resolveCandidate(
        tenantId,
        candidateId,
        parseResult.data,
        req.user
      );

      res.status(200).json(result);
    } catch (err: any) {
      if (err.code === 'ERR_STALE_VERSION' || err.code === 'ERR_ALREADY_RESOLVED' || err.statusCode === 409) {
        res.status(409).json({
          error: {
            code: err.code || 'CONCURRENT_MODIFICATION_CONFLICT',
            message: err.message,
            currentVersion: err.currentVersion
          }
        });
        return;
      }

      if (err.statusCode === 404) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
        return;
      }

      console.error('[Resolution Error]', err);
      res.status(500).json({
        error: {
          code: 'RESOLUTION_FAILED',
          message: err.message || 'Resolution failed unexpectedly'
        }
      });
    }
  }

  /**
   * POST/GET /api/v1/duplicate-candidates/:id/explain
   * Uses Gemini to explain precomputed matching evidence without deciding merges.
   */
  async explainCandidate(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant.id;
      const candidateId = Number(req.params.id);

      const found = await DuplicateCandidateRepository.findById(tenantId, candidateId);
      if (!found) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Duplicate candidate pair not found for tenant',
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      const { candidate, conflicts } = found;
      const sourceA = await sourceOrderRepository.findById(tenantId, candidate.source_a_id);
      const sourceB = await sourceOrderRepository.findById(tenantId, candidate.source_b_id);

      const features = typeof candidate.match_features === 'string'
        ? JSON.parse(candidate.match_features)
        : candidate.match_features;

      const result = await geminiService.explainMatchingEvidence({
        candidateId: candidate.id,
        score: Number(candidate.match_score),
        algorithmVersion: candidate.algorithm_version,
        features: features || {},
        conflicts: (conflicts || []).map(c => ({
          fieldPath: c.field_path,
          valueA: c.value_a,
          valueB: c.value_b
        })),
        sourceAMetadata: {
          channel: sourceA?.channel,
          receivedAt: sourceA?.receivedAt,
          reportedTotal: sourceA?.reportedTotal,
          itemCount: sourceA?.items?.length
        },
        sourceBMetadata: {
          channel: sourceB?.channel,
          receivedAt: sourceB?.receivedAt,
          reportedTotal: sourceB?.reportedTotal,
          itemCount: sourceB?.items?.length
        }
      });

      res.status(200).json({
        success: true,
        candidateId: candidate.id,
        ...result,
        requestId: req.headers['x-request-id']
      });
    } catch (err: any) {
      console.error('[Explain Candidate Error]', err);
      res.status(500).json({
        error: {
          code: 'EXPLANATION_FAILED',
          message: err.message || 'Failed to explain matching evidence',
          requestId: req.headers['x-request-id']
        }
      });
    }
  }
}

export const duplicateCandidateController = new DuplicateCandidateController();
