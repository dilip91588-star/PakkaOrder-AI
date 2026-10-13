import { z } from 'zod';

/**
 * Catalog item candidate provided to Gemini for catalog-assisted matching
 */
export const catalogCandidateSchema = z.object({
  productId: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  variant: z.string().nullable().optional(),
  unit: z.string().default('portion'),
  basePrice: z.number().nonnegative().optional()
});

export type CatalogCandidate = z.infer<typeof catalogCandidateSchema>;

/**
 * Extracted order line item from Gemini (Prompt A & D)
 */
export const geminiExtractionItemSchema = z.object({
  rawName: z.string().min(1, 'Raw item name cannot be empty'),
  catalogProductId: z.string().nullable().optional().default(null),
  normalizedName: z.string().min(1, 'Normalized name cannot be empty'),
  quantity: z.number().nullable().optional().default(null),
  unit: z.string().default('portion'),
  variant: z.string().nullable().optional().default(null),
  customization: z.string().nullable().optional().default(null),
  unitPrice: z.number().nonnegative().nullable().optional().default(null),
  lineTotal: z.number().nonnegative().nullable().optional().default(null),
  confidence: z.number().min(0).max(1).default(0.9)
});

export type GeminiExtractionItem = z.infer<typeof geminiExtractionItemSchema>;

/**
 * Field-level uncertainty indicator (PROMPTS.md Section 2)
 */
export const geminiUncertaintySchema = z.union([
  z.object({
    fieldPath: z.string().default('general'),
    reason: z.string().min(1, 'reason is required')
  }),
  z.string().transform(s => ({ fieldPath: 'general', reason: s }))
]);

export type GeminiUncertainty = z.infer<typeof geminiUncertaintySchema>;

/**
 * Complete Order Extraction Output schema (Prompt A & D)
 */
export const geminiOrderExtractionSchema = z.object({
  customer: z.object({
    name: z.string().nullable().optional().default(null),
    phone: z.string().nullable().optional().default(null)
  }).default({ name: null, phone: null }),
  delivery: z.object({
    address: z.string().nullable().optional().default(null),
    instructions: z.string().nullable().optional().default(null)
  }).default({ address: null, instructions: null }),
  items: z.array(geminiExtractionItemSchema).default([]),
  currency: z.string().nullable().optional().default('INR'),
  reportedTotal: z.number().nonnegative().nullable().optional().default(null),
  uncertainties: z.array(geminiUncertaintySchema).default([]),
  detectedLanguage: z.string().default('English'),
  extractionConfidence: z.number().min(0).max(1).default(0.85)
});

export type GeminiOrderExtraction = z.infer<typeof geminiOrderExtractionSchema>;

/**
 * Catalog Matching Output schema (Prompt B)
 */
export const geminiCatalogMatchCandidateSchema = z.object({
  productId: z.string(),
  reason: z.string()
});

export const geminiCatalogMatchSchema = z.object({
  status: z.enum(['MATCHED', 'AMBIGUOUS', 'NO_MATCH']),
  productId: z.string().nullable().optional().default(null),
  candidates: z.array(geminiCatalogMatchCandidateSchema).default([]),
  uncertainty: z.string().nullable().optional().default(null)
});

export type GeminiCatalogMatch = z.infer<typeof geminiCatalogMatchSchema>;

/**
 * Match Explanation Output schema (Prompt C)
 */
export const geminiConflictExplanationSchema = z.object({
  fieldPath: z.string(),
  valueA: z.unknown(),
  valueB: z.unknown(),
  explanation: z.string()
});

export const geminiMatchExplanationSchema = z.object({
  summary: z.string(),
  supportingEvidence: z.array(z.string()).default([]),
  conflicts: z.array(geminiConflictExplanationSchema).default([]),
  recommendedReview: z.string(),
  mergeDecision: z.literal('HUMAN_REVIEW_REQUIRED')
});

export type GeminiMatchExplanation = z.infer<typeof geminiMatchExplanationSchema>;
