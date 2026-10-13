import { GeminiClient } from './geminiClient.js';
import { MockGeminiAdapter } from './mockGeminiAdapter.js';
import { productRepository } from '../../repositories/productRepository.js';
import {
  GeminiOrderExtraction,
  GeminiCatalogMatch,
  GeminiMatchExplanation,
  CatalogCandidate
} from './schemas.js';

export interface ExtractionExecutionResult {
  extraction: GeminiOrderExtraction;
  promptVersion: string;
  modelName: string;
  providerMode: 'LIVE_GEMINI' | 'MOCK_ADAPTER';
  isLiveGemini: boolean;
}

export class GeminiService {
  private client: GeminiClient;
  private mockAdapter: MockGeminiAdapter;
  private forceMockMode: boolean = false;

  constructor() {
    this.client = new GeminiClient();
    this.mockAdapter = new MockGeminiAdapter();
  }

  /**
   * Set mock mode explicitly for testing
   */
  setForceMockMode(enabled: boolean): void {
    this.forceMockMode = enabled;
  }

  /**
   * Check whether live Gemini is active
   */
  isLiveGeminiActive(): boolean {
    if (this.forceMockMode) return false;
    if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_LIVE_AI_TESTS) {
      return false;
    }
    return this.client.isConfigured();
  }

  /**
   * Get active adapter (Live Gemini client or Mock adapter)
   */
  private getActiveAdapter(): {
    adapter: GeminiClient | MockGeminiAdapter;
    mode: 'LIVE_GEMINI' | 'MOCK_ADAPTER';
  } {
    if (this.isLiveGeminiActive()) {
      return { adapter: this.client, mode: 'LIVE_GEMINI' };
    }
    return { adapter: this.mockAdapter, mode: 'MOCK_ADAPTER' };
  }

  /**
   * Extract structured order from untrusted informal text (Prompt A & D)
   * Enforces catalog verification, quantity validation, and safety invariants.
   */
  async extractOrder(params: {
    tenantId: number;
    messageText: string;
    channel: string;
    customerPhone?: string;
    knownCustomerName?: string;
  }): Promise<ExtractionExecutionResult> {
    // 1. Fetch active catalog candidates for this tenant to assist matching
    let catalogCandidates: CatalogCandidate[] = [];
    try {
      const activeProducts = await productRepository.findActiveByTenant(params.tenantId);
      catalogCandidates = activeProducts.map(p => ({
        productId: p.sku,
        name: p.name,
        normalizedName: p.normalizedName,
        variant: p.variant,
        unit: p.unit,
        basePrice: p.basePrice
      }));
    } catch (_err) {
      // If DB is offline or not migrated in testing, continue with empty catalog
      catalogCandidates = [];
    }

    // 2. Execute extraction using the active adapter (never in a DB transaction)
    const { adapter, mode } = this.getActiveAdapter();
    const result = await adapter.extractOrder({
      messageText: params.messageText,
      channel: params.channel,
      customerPhone: params.customerPhone,
      knownCustomerReference: params.knownCustomerName,
      catalogCandidates
    });

    const extraction = result.extraction;
    const knownSkus = new Set(catalogCandidates.map(c => c.productId.toUpperCase()));

    // 3. Post-validate and enforce safety rules on AI extraction output
    for (let i = 0; i < extraction.items.length; i++) {
      const item = extraction.items[i];

      // Rule: Reject unknown product IDs not in tenant's catalog
      if (item.catalogProductId) {
        const skuUpper = item.catalogProductId.toUpperCase();
        if (catalogCandidates.length > 0 && !knownSkus.has(skuUpper)) {
          const rejectedId = item.catalogProductId;
          item.catalogProductId = null;
          extraction.uncertainties.push({
            fieldPath: `items[${i}].catalogProductId`,
            reason: `Unknown product ID '${rejectedId}' rejected. It does not exist in the tenant's product catalog.`
          });
        }
      }

      // Rule: Reject invalid or out-of-bounds quantities
      if (item.quantity !== null && item.quantity !== undefined) {
        if (isNaN(item.quantity) || item.quantity <= 0 || item.quantity > 999) {
          const invalidQty = item.quantity;
          item.quantity = null;
          item.lineTotal = null;
          extraction.uncertainties.push({
            fieldPath: `items[${i}].quantity`,
            reason: `Invalid quantity (${invalidQty}) rejected. Quantity must be a positive integer between 1 and 999.`
          });
        }
      } else {
        // Missing or null quantity requires explicit uncertainty flag
        const alreadyFlagged = extraction.uncertainties.some(u => u.fieldPath === `items[${i}].quantity`);
        if (!alreadyFlagged) {
          extraction.uncertainties.push({
            fieldPath: `items[${i}].quantity`,
            reason: 'Missing quantity: Customer order did not specify a valid item count.'
          });
        }
      }
    }

    return {
      extraction,
      promptVersion: result.promptVersion,
      modelName: result.modelName,
      providerMode: mode,
      isLiveGemini: mode === 'LIVE_GEMINI'
    };
  }

  /**
   * Prompt B: Match an informal item reference against the tenant catalog
   */
  async matchCatalogProduct(
    tenantId: number,
    itemReference: string
  ): Promise<{ match: GeminiCatalogMatch; promptVersion: string; modelName: string; providerMode: string }> {
    const activeProducts = await productRepository.findActiveByTenant(tenantId);
    const catalogCandidates: CatalogCandidate[] = activeProducts.map(p => ({
      productId: p.sku,
      name: p.name,
      normalizedName: p.normalizedName,
      variant: p.variant,
      unit: p.unit,
      basePrice: p.basePrice
    }));

    const { adapter, mode } = this.getActiveAdapter();
    const result = await adapter.matchCatalogProduct({
      itemReference,
      catalogCandidates
    });

    // Safety check: ensure matched product ID actually belongs to this tenant
    const knownSkus = new Set(catalogCandidates.map(c => c.productId));
    if (result.match.productId && !knownSkus.has(result.match.productId)) {
      result.match.status = 'AMBIGUOUS';
      result.match.productId = null;
      result.match.uncertainty = 'Candidate product ID does not exist in tenant catalog.';
    }

    return {
      match: result.match,
      promptVersion: result.promptVersion,
      modelName: result.modelName,
      providerMode: mode
    };
  }

  /**
   * Prompt C: Explain precomputed matching evidence
   */
  async explainMatchingEvidence(params: {
    candidateId: number;
    score: number;
    algorithmVersion: string;
    features: Record<string, unknown>;
    conflicts: Array<{ fieldPath: string; valueA: unknown; valueB: unknown }>;
    sourceAMetadata: Record<string, unknown>;
    sourceBMetadata: Record<string, unknown>;
  }): Promise<{ explanation: GeminiMatchExplanation; promptVersion: string; modelName: string; providerMode: string }> {
    const { adapter, mode } = this.getActiveAdapter();
    const result = await adapter.explainMatchingEvidence(params);

    // Safety invariant: reject automated merge decision
    if (result.explanation.mergeDecision !== 'HUMAN_REVIEW_REQUIRED') {
      throw new Error('AI explanation must not decide merges: mergeDecision must be HUMAN_REVIEW_REQUIRED.');
    }

    return {
      explanation: result.explanation,
      promptVersion: result.promptVersion,
      modelName: result.modelName,
      providerMode: mode
    };
  }
}

export const geminiService = new GeminiService();
