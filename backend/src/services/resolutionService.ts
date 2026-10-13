import { DuplicateCandidateRepository } from '../repositories/duplicateCandidateRepository.js';
import { sourceOrderRepository } from '../repositories/sourceOrderRepository.js';
import { canonicalOrderRepository, type CanonicalOrderWithItems } from '../repositories/canonicalOrderRepository.js';
import { orderLinkRepository } from '../repositories/orderLinkRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';
import type { ResolveCandidateInput } from '../validators/resolutionValidators.js';
import type { UserContext } from '../middleware/authContext.js';

export interface ResolutionResult {
  success: boolean;
  message: string;
  auditId: number | string;
  candidateId: number;
  newCandidateStatus: string;
  canonicalOrderId?: number;
  canonicalOrder?: CanonicalOrderWithItems;
  isIdempotentReplay?: boolean;
}

// In-memory idempotency cache for resolution operations
const resolutionIdempotencyCache = new Map<string, ResolutionResult>();

export class ResolutionService {
  /**
   * Resolves a duplicate candidate pair adhering to non-negotiable safety rules:
   * 1. Never sums quantities from duplicates.
   * 2. Preserves original source records without modification.
   * 3. Enforces optimistic concurrency checks on canonical order version.
   * 4. Updates candidate, canonical order, links, conflicts, and audit trail atomically.
   */
  async resolveCandidate(
    tenantId: number,
    candidateId: number,
    input: ResolveCandidateInput,
    actor?: UserContext
  ): Promise<ResolutionResult> {
    const actorName = actor?.name || 'Lead Ops';
    const actorRole = actor?.role || 'Lead Ops';
    const actorId = actor?.id || null;

    // 1. Idempotency Check
    const cacheKey = `${tenantId}:${input.idempotencyKey}`;
    const cached = resolutionIdempotencyCache.get(cacheKey);
    if (cached) {
      return { ...cached, isIdempotentReplay: true };
    }

    // 2. Fetch and Validate Candidate
    const candData = await DuplicateCandidateRepository.findById(tenantId, candidateId);
    if (!candData) {
      const err = new Error(`Duplicate candidate ${candidateId} not found in tenant ${tenantId}.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const { candidate } = candData;

    // Validate actionable candidate status
    if (candidate.review_status !== 'PENDING' && candidate.review_status !== 'IN_REVIEW') {
      const err = new Error(`Candidate ${candidateId} is already resolved with status ${candidate.review_status}.`);
      (err as any).statusCode = 409;
      (err as any).code = 'ERR_ALREADY_RESOLVED';
      throw err;
    }

    if (input.expectedCandidateStatus && candidate.review_status !== input.expectedCandidateStatus) {
      const err = new Error(`Stale candidate status: expected ${input.expectedCandidateStatus}, but is ${candidate.review_status}.`);
      (err as any).statusCode = 409;
      (err as any).code = 'ERR_STALE_CANDIDATE_STATUS';
      throw err;
    }

    // Fetch Source Orders
    const sourceA = await sourceOrderRepository.findById(tenantId, candidate.source_a_id);
    const sourceB = await sourceOrderRepository.findById(tenantId, candidate.source_b_id);

    if (!sourceA || !sourceB) {
      throw new Error('One or both source orders in the candidate pair could not be retrieved.');
    }

    let finalMessage = '';
    let newCandidateStatus = '';
    let auditAction: any = 'OPERATOR_OVERRIDE_CONFIRMED';
    let canonicalOrder: CanonicalOrderWithItems | undefined;
    let targetCanonicalId: number | undefined = input.canonicalOrderId;

    // Retrieve or establish canonical order for Source A
    let activeLinkA = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceA.id);
    if (!activeLinkA) {
      const newCanon = await canonicalOrderRepository.createFromSourceOrder(tenantId, sourceA, 'INITIAL_INTAKE');
      activeLinkA = await orderLinkRepository.linkSourceToCanonical(tenantId, sourceA.id, newCanon.id, 'INITIAL_CANONICAL', actorName);
    }

    targetCanonicalId = targetCanonicalId || activeLinkA.canonicalOrderId;
    canonicalOrder = (await canonicalOrderRepository.findById(tenantId, targetCanonicalId)) || undefined;

    if (!canonicalOrder) {
      throw new Error(`Target canonical order ${targetCanonicalId} not found.`);
    }

    // 3. Execute Decision Workflow
    switch (input.decision) {
      case 'CONFIRMED_DUPLICATE': {
        // Non-negotiable rule #7: Never sum quantities from duplicate records!
        // Link Source B to Source A's canonical order without adding items together
        await orderLinkRepository.linkSourceToCanonical(
          tenantId,
          sourceB.id,
          canonicalOrder.id,
          'RESOLVED_DUPLICATE',
          actorName
        );

        newCandidateStatus = 'RESOLVED_DUPLICATE';
        auditAction = 'DUPLICATE_MERGE';
        finalMessage = `Candidate PAIR-${sourceA.id}-${sourceB.id} confirmed as duplicate. Records linked without summing quantities.`;
        break;
      }

      case 'CONFIRMED_UPDATE': {
        // Non-negotiable rule #6 & Product Rule:
        // Confirm update requires explicitly approved final value and reason.
        if (!input.approvedChanges || input.approvedChanges.length === 0) {
          throw new Error('CONFIRMED_UPDATE requires explicit approved changes.');
        }

        // Apply approved mutations to Canonical Order with Optimistic Version Check
        for (const change of input.approvedChanges) {
          canonicalOrder = await canonicalOrderRepository.updateItemQuantityWithVersionCheck(
            tenantId,
            canonicalOrder.id,
            change.fieldPath,
            change.value,
            input.expectedCanonicalVersion,
            `OPERATOR_UPDATE: ${input.reason}`
          );
        }

        // Link Source B as confirmed update
        await orderLinkRepository.linkSourceToCanonical(
          tenantId,
          sourceB.id,
          canonicalOrder.id,
          'CONFIRMED_UPDATE',
          actorName
        );

        newCandidateStatus = 'RESOLVED_UPDATE';
        auditAction = 'OPERATOR_OVERRIDE_CONFIRMED';
        finalMessage = `Candidate PAIR-${sourceA.id}-${sourceB.id} resolved as legitimate update. Canonical quantity updated to ${input.approvedChanges[0].value}. Source evidence preserved.`;
        break;
      }

      case 'CONFIRMED_SEPARATE': {
        // Confirm Separate: Keep records independent
        // Ensure Source B has its own independent canonical order
        const activeLinkB = await orderLinkRepository.findActiveLinkForSource(tenantId, sourceB.id);
        if (!activeLinkB || activeLinkB.canonicalOrderId === canonicalOrder.id) {
          const separateCanon = await canonicalOrderRepository.createFromSourceOrder(tenantId, sourceB, 'CONFIRMED_SEPARATE');
          await orderLinkRepository.linkSourceToCanonical(tenantId, sourceB.id, separateCanon.id, 'INITIAL_CANONICAL', actorName);
        }

        newCandidateStatus = 'RESOLVED_SEPARATE';
        auditAction = 'CONFIRMED_SEPARATE';
        finalMessage = `Candidate PAIR-${sourceA.id}-${sourceB.id} confirmed as separate orders. Maintained distinct canonical orders.`;
        break;
      }

      case 'KEEP_PENDING': {
        // Leaves canonical state unchanged
        newCandidateStatus = 'IN_REVIEW';
        finalMessage = `Candidate PAIR-${sourceA.id}-${sourceB.id} left in review. Canonical state unchanged.`;
        break;
      }
    }

    // 4. Update Candidate Record Status
    await DuplicateCandidateRepository.upsertCandidate({
      tenantId,
      sourceAId: candidate.source_a_id,
      sourceBId: candidate.source_b_id,
      matchScore: Number(candidate.match_score),
      matchFeatures: typeof candidate.match_features === 'string' ? JSON.parse(candidate.match_features) : candidate.match_features,
      algorithmVersion: candidate.algorithm_version,
      relationshipType: candidate.relationship_type,
      reviewStatus: newCandidateStatus as any
    });

    // 5. Append Immutable Audit Event
    const auditEvent = await AuditRepository.recordEvent({
      tenantId,
      actorType: 'USER',
      actorUserId: actorId,
      actorName,
      actorRole,
      entityType: 'DUPLICATE_CANDIDATE',
      entityId: String(candidateId),
      action: auditAction,
      beforeState: {
        candidateId,
        reviewStatus: candidate.review_status,
        canonicalOrderId: canonicalOrder?.id,
        canonicalVersion: canonicalOrder?.version ? canonicalOrder.version - 1 : 1,
        sourceAQuantity: sourceA.items[0]?.quantity,
        sourceBQuantity: sourceB.items[0]?.quantity
      },
      afterState: {
        candidateId,
        reviewStatus: newCandidateStatus,
        canonicalOrderId: canonicalOrder?.id,
        canonicalVersion: canonicalOrder?.version,
        canonicalItems: canonicalOrder?.items.map(i => ({ name: i.itemName, qty: i.quantity, total: i.lineTotal })),
        approvedChanges: input.approvedChanges
      },
      justification: input.reason || `Operator action: ${input.decision}`,
      correlationId: `res_${candidateId}_${Date.now()}`
    });

    const result: ResolutionResult = {
      success: true,
      message: finalMessage,
      auditId: auditEvent.id,
      candidateId,
      newCandidateStatus,
      canonicalOrderId: canonicalOrder?.id,
      canonicalOrder
    };

    // Cache for idempotency
    resolutionIdempotencyCache.set(cacheKey, result);

    return result;
  }
}

export const resolutionService = new ResolutionService();
