export interface MatchingConfig {
  algorithmVersion: string;
  timeWindowMinutes: number;
  candidateMinScore: number;
  highSimilarityThreshold: number;
  weights: {
    phone: number;
    customerName: number;
    address: number;
    items: number;
    timeProximity: number;
  };
  policy: {
    autoMergeEnabled: false; // Non-negotiable rule #5: Never auto-merge records solely on high score
    quantityMismatchRequiresReview: true; // Non-negotiable rule #6
    neverSumDuplicateQuantities: true; // Non-negotiable rule #7
    treatMissingAsUnknown: true;
  };
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  algorithmVersion: 'v1.0-deterministic-heuristic',
  timeWindowMinutes: 240, // 4 hours window
  candidateMinScore: 0.40,
  highSimilarityThreshold: 0.85,
  weights: {
    phone: 0.35,
    customerName: 0.15,
    address: 0.20,
    items: 0.20,
    timeProximity: 0.10
  },
  policy: {
    autoMergeEnabled: false,
    quantityMismatchRequiresReview: true,
    neverSumDuplicateQuantities: true,
    treatMissingAsUnknown: true
  }
};
