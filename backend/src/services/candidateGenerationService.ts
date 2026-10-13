import { sourceOrderRepository } from '../repositories/sourceOrderRepository.js';
import { DuplicateCandidateRepository } from '../repositories/duplicateCandidateRepository.js';
import { MatchingEngine, type MatchEvaluationResult, type SourceOrderComparisonRecord } from './matchingEngine.js';
import { DEFAULT_MATCHING_CONFIG } from '../config/matchingConfig.js';
import type { SourceOrderWithItems } from '../repositories/sourceOrderRepository.js';

export class CandidateGenerationService {
  private matchingEngine: MatchingEngine;

  constructor() {
    this.matchingEngine = new MatchingEngine(DEFAULT_MATCHING_CONFIG);
  }

  /**
   * Evaluates candidates for an ingested source order using indexed blocking paths,
   * evaluates explainable features, and persists candidates and conflicts.
   */
  async processOrderForCandidates(
    tenantId: number,
    orderId: number
  ): Promise<{ evaluatedCandidates: MatchEvaluationResult[] }> {
    const targetOrder = await sourceOrderRepository.findById(tenantId, orderId);
    if (!targetOrder) {
      throw new Error(`Source order ${orderId} not found in tenant ${tenantId}.`);
    }

    // 1. Find candidate orders using indexed blocking queries (tenant scoped)
    const potentialMatches = await sourceOrderRepository.findPotentialCandidateOrders(
      tenantId,
      targetOrder,
      DEFAULT_MATCHING_CONFIG.timeWindowMinutes
    );

    const evaluatedCandidates: MatchEvaluationResult[] = [];
    const targetComparisonRec = this.toComparisonRecord(targetOrder);

    // 2. Evaluate each potential candidate pair
    for (const matchOrder of potentialMatches) {
      // Invariant: enforce tenant boundary
      if (matchOrder.tenantId !== tenantId) continue;

      const matchComparisonRec = this.toComparisonRecord(matchOrder);
      const evalResult = this.matchingEngine.evaluatePair(targetComparisonRec, matchComparisonRec);

      // Filter by candidate threshold or presence of material conflicts
      if (
        evalResult.matchScore >= DEFAULT_MATCHING_CONFIG.candidateMinScore ||
        evalResult.conflicts.length > 0
      ) {
        // Persist candidate pair in database
        const candidateRow = await DuplicateCandidateRepository.upsertCandidate({
          tenantId,
          sourceAId: evalResult.sourceAId,
          sourceBId: evalResult.sourceBId,
          matchScore: evalResult.matchScore,
          matchFeatures: evalResult.matchFeatures,
          algorithmVersion: evalResult.algorithmVersion,
          relationshipType: evalResult.relationshipType
        });

        // Persist detected conflicts
        if (evalResult.conflicts.length > 0) {
          await DuplicateCandidateRepository.replaceConflicts(
            candidateRow.id,
            tenantId,
            evalResult.conflicts
          );
        }

        evaluatedCandidates.push(evalResult);
      }
    }

    return { evaluatedCandidates };
  }

  private toComparisonRecord(o: SourceOrderWithItems): SourceOrderComparisonRecord {
    return {
      id: o.id,
      tenantId: o.tenantId,
      channel: o.channel,
      externalOrderId: o.externalOrderId,
      customerName: o.customerName,
      customerPhone: o.normalizedPhone || o.customerPhone,
      deliveryAddress: o.normalizedAddress || o.deliveryAddress,
      receivedAt: o.receivedAt,
      reportedTotal: o.reportedTotal,
      currency: o.currency,
      items: o.items.map(itm => ({
        id: itm.id,
        productId: itm.productId,
        name: itm.normalizedItemName || itm.rawItemName,
        quantity: itm.quantity,
        unitPrice: itm.unitPrice,
        unit: itm.unit,
        variant: itm.variant ? String(itm.variant) : null,
        customizations: itm.customization ? (Array.isArray(itm.customization) ? itm.customization : [String(itm.customization)]) : []
      }))
    };
  }
}

export const candidateGenerationService = new CandidateGenerationService();
