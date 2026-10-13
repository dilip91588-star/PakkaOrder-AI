import { NormalizationService } from './normalizationService.js';
import { ItemComparisonService, type SourceItemComparisonInput, type DetectedConflict } from './itemComparisonService.js';
import { DEFAULT_MATCHING_CONFIG, type MatchingConfig } from '../config/matchingConfig.js';
import type { CandidateRelationshipType, Channel } from '../types/index.js';

export interface SourceOrderComparisonRecord {
  id: number;
  tenantId: number;
  channel: Channel;
  externalOrderId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  receivedAt: Date | string;
  reportedTotal: number;
  currency?: string;
  items: SourceItemComparisonInput[];
}

export interface MatchFeatures {
  phoneSimilarity: number | null; // null if missing
  customerNameSimilarity: number | null; // null if missing
  addressSimilarity: number | null; // null if missing
  itemSimilarity: number;
  timeDeltaMinutes: number;
  timeProximityScore: number;
  channelPair: [string, string];
  hasQuantityMismatch: boolean;
  reportedTotalDifference: number;
  matchedItemCount: number;
  unmatchedItemCount: number;
}

export interface MatchEvaluationResult {
  sourceAId: number;
  sourceBId: number;
  matchScore: number;
  matchFeatures: MatchFeatures;
  algorithmVersion: string;
  relationshipType: CandidateRelationshipType;
  conflicts: DetectedConflict[];
}

export class MatchingEngine {
  private config: MatchingConfig;

  constructor(config: MatchingConfig = DEFAULT_MATCHING_CONFIG) {
    this.config = config;
  }

  /**
   * Compares two source order records within the same tenant,
   * calculates explainable feature scores, flags all field-level conflicts,
   * and produces a deterministic evaluation.
   */
  evaluatePair(
    orderA: SourceOrderComparisonRecord,
    orderB: SourceOrderComparisonRecord
  ): MatchEvaluationResult {
    // Safety check: Candidate pair ordering invariant (source_a_id < source_b_id)
    const isSwapped = orderA.id > orderB.id;
    const recA = isSwapped ? orderB : orderA;
    const recB = isSwapped ? orderA : orderB;

    const conflicts: DetectedConflict[] = [];

    // 1. Phone Similarity
    const normPhoneA = NormalizationService.normalizePhone(recA.customerPhone);
    const normPhoneB = NormalizationService.normalizePhone(recB.customerPhone);

    let phoneSimilarity: number | null = null;
    if (normPhoneA.isValid && normPhoneB.isValid) {
      phoneSimilarity = normPhoneA.normalized === normPhoneB.normalized ? 1.0 : 0.0;
    } else {
      // Rule #1: Treat missing values as unknown rather than a confirmed match
      phoneSimilarity = null;
    }

    // 2. Customer Name Similarity
    let customerNameSimilarity: number | null = null;
    const nameA = (recA.customerName || '').trim().toLowerCase();
    const nameB = (recB.customerName || '').trim().toLowerCase();

    if (nameA && nameB) {
      customerNameSimilarity = this.calculateStringJaccard(nameA, nameB);
    } else {
      customerNameSimilarity = null;
    }

    // 3. Address Similarity
    const normAddrA = NormalizationService.normalizeAddress(recA.deliveryAddress);
    const normAddrB = NormalizationService.normalizeAddress(recB.deliveryAddress);

    let addressSimilarity: number | null = null;
    if (normAddrA.normalized && normAddrB.normalized) {
      addressSimilarity = this.calculateTokenJaccard(normAddrA.tokens, normAddrB.tokens);

      // Flag address variance if phones match but addresses differ
      if (phoneSimilarity === 1.0 && addressSimilarity < 0.40) {
        conflicts.push({
          conflictType: 'ADDRESS_VARIANCE',
          fieldPath: 'deliveryAddress',
          valueA: { raw: recA.deliveryAddress, normalized: normAddrA.normalized },
          valueB: { raw: recB.deliveryAddress, normalized: normAddrB.normalized },
          severity: 'WARNING',
          reason: `Customer phone matches (+${normPhoneA.nationalNumber}), but delivery destination differs (${recA.deliveryAddress} vs ${recB.deliveryAddress}).`
        });
      }
    } else {
      addressSimilarity = null;
    }

    // 4. Temporal Proximity
    const dateA = new Date(recA.receivedAt).getTime();
    const dateB = new Date(recB.receivedAt).getTime();
    const timeDeltaMinutes = Math.max(0, Math.round(Math.abs(dateA - dateB) / (1000 * 60)));

    let timeProximityScore = 0.0;
    if (timeDeltaMinutes <= 5) timeProximityScore = 1.0;
    else if (timeDeltaMinutes <= 15) timeProximityScore = 0.90;
    else if (timeDeltaMinutes <= 30) timeProximityScore = 0.75;
    else if (timeDeltaMinutes <= 60) timeProximityScore = 0.55;
    else if (timeDeltaMinutes <= 120) timeProximityScore = 0.35;
    else if (timeDeltaMinutes <= 240) timeProximityScore = 0.15;
    else timeProximityScore = 0.0;

    // Temporal anomaly flag if items/phone match but time difference is large
    if (timeDeltaMinutes > 180 && phoneSimilarity === 1.0) {
      conflicts.push({
        conflictType: 'TEMPORAL_ANOMALY',
        fieldPath: 'receivedAt',
        valueA: { receivedAt: recA.receivedAt },
        valueB: { receivedAt: recB.receivedAt },
        severity: 'INFO',
        reason: `Orders were received ${timeDeltaMinutes} minutes apart. May represent separate repeat dining orders.`
      });
    }

    // 5. Line Item Comparison & Conflicts
    const itemComparison = ItemComparisonService.compareItems(recA.items, recB.items);
    conflicts.push(...itemComparison.conflicts);

    // 6. Channel Pair
    const channelPair: [string, string] = [recA.channel, recB.channel].sort() as [string, string];

    // 7. Total Amount Discrepancy
    const totalDiff = Math.abs(Number(recA.reportedTotal || 0) - Number(recB.reportedTotal || 0));

    // 8. Heuristic Match Score Calculation
    // Re-normalize weights among present features only
    let activeWeightSum = 0;
    let weightedScoreSum = 0;

    if (phoneSimilarity !== null) {
      activeWeightSum += this.config.weights.phone;
      weightedScoreSum += phoneSimilarity * this.config.weights.phone;
    }

    if (customerNameSimilarity !== null) {
      activeWeightSum += this.config.weights.customerName;
      weightedScoreSum += customerNameSimilarity * this.config.weights.customerName;
    }

    if (addressSimilarity !== null) {
      activeWeightSum += this.config.weights.address;
      weightedScoreSum += addressSimilarity * this.config.weights.address;
    }

    // Items and time are always present
    activeWeightSum += this.config.weights.items;
    weightedScoreSum += itemComparison.overallItemSimilarity * this.config.weights.items;

    activeWeightSum += this.config.weights.timeProximity;
    weightedScoreSum += timeProximityScore * this.config.weights.timeProximity;

    const rawMatchScore = activeWeightSum > 0 ? weightedScoreSum / activeWeightSum : 0;
    const matchScore = Number(rawMatchScore.toFixed(4));

    // 9. Relationship Classification
    let relationshipType: CandidateRelationshipType = 'SEPARATE_ORDER_AMBIGUOUS';

    if (itemComparison.quantityDisagreementDetected) {
      // Critical product rule: Quantity mismatch triggers SUSPECTED_UPDATE or review
      relationshipType = 'SUSPECTED_UPDATE';
    } else if (matchScore >= this.config.highSimilarityThreshold) {
      relationshipType = 'POTENTIAL_DUPLICATE';
    } else {
      relationshipType = 'SEPARATE_ORDER_AMBIGUOUS';
    }

    const matchFeatures: MatchFeatures = {
      phoneSimilarity,
      customerNameSimilarity,
      addressSimilarity,
      itemSimilarity: itemComparison.overallItemSimilarity,
      timeDeltaMinutes,
      timeProximityScore,
      channelPair,
      hasQuantityMismatch: itemComparison.quantityDisagreementDetected,
      reportedTotalDifference: totalDiff,
      matchedItemCount: itemComparison.matchedPairs.length,
      unmatchedItemCount: itemComparison.unmatchedA.length + itemComparison.unmatchedB.length
    };

    return {
      sourceAId: recA.id,
      sourceBId: recB.id,
      matchScore,
      matchFeatures,
      algorithmVersion: this.config.algorithmVersion,
      relationshipType,
      conflicts
    };
  }

  private calculateStringJaccard(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    const tokens1 = str1.split(/\s+/).filter(Boolean);
    const tokens2 = str2.split(/\s+/).filter(Boolean);
    return this.calculateTokenJaccard(tokens1, tokens2);
  }

  private calculateTokenJaccard(tokens1: string[], tokens2: string[]): number {
    if (!tokens1.length && !tokens2.length) return 1.0;
    if (!tokens1.length || !tokens2.length) return 0.0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    let intersection = 0;
    for (const t of set1) {
      if (set2.has(t)) intersection++;
    }

    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? Number((intersection / union).toFixed(4)) : 0;
  }
}
