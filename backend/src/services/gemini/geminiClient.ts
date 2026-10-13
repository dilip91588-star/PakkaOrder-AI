import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import {
  GeminiOrderExtraction,
  geminiOrderExtractionSchema,
  GeminiCatalogMatch,
  geminiCatalogMatchSchema,
  GeminiMatchExplanation,
  geminiMatchExplanationSchema,
  CatalogCandidate
} from './schemas.js';
import {
  ORDER_EXTRACTION_SYSTEM_INSTRUCTION,
  buildOrderExtractionUserPrompt,
  CATALOG_MATCH_SYSTEM_INSTRUCTION,
  MATCH_EXPLANATION_SYSTEM_INSTRUCTION,
  ORDER_EXTRACTION_PROMPT_VERSION,
  CATALOG_MATCH_PROMPT_VERSION,
  MATCH_EXPLANATION_PROMPT_VERSION
} from './prompts.js';

export class GeminiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export interface GeminiClientOptions {
  apiKey?: string;
  modelName?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class GeminiClient {
  private readonly apiKey: string | undefined;
  private readonly modelName: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private ai: GoogleGenAI | null = null;

  constructor(options?: GeminiClientOptions) {
    this.apiKey = options?.apiKey !== undefined ? options.apiKey : env.GEMINI_API_KEY;
    this.modelName = options?.modelName || env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
    this.timeoutMs = options?.timeoutMs ?? (env as any).GEMINI_TIMEOUT_MS ?? 30000;
    this.maxRetries = options?.maxRetries ?? 2;

    if (this.apiKey && this.apiKey.trim() && !this.apiKey.includes('your_gemini_api_key_here')) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  isConfigured(): boolean {
    return this.ai !== null;
  }

  getModelName(): string {
    return this.modelName;
  }

  /**
   * Safe execution with timeout and bounded retries
   */
  private async executeWithRetryAndTimeout(
    operation: () => Promise<string>,
    contextName: string
  ): Promise<string> {
    if (!this.ai) {
      throw new GeminiError(
        'GEMINI_NOT_CONFIGURED',
        'Google Gemini API key is not configured in backend environment variables.',
        503
      );
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        // Enforce timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new GeminiError(
              'GEMINI_TIMEOUT',
              `Gemini request timed out after ${this.timeoutMs}ms during ${contextName}.`,
              504
            ));
          }, this.timeoutMs);
          if (timer.unref) timer.unref();
        });

        const rawText = await Promise.race([operation(), timeoutPromise]);
        return rawText;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
        const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('rate limit');
        const isUnavailable = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('overloaded');

        if ((isRateLimit || isUnavailable) && attempt <= this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500;
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }

        if (err instanceof GeminiError) {
          throw err;
        }

        if (isRateLimit) {
          throw new GeminiError('GEMINI_RATE_LIMIT', 'Gemini API rate limit exceeded.', 429, err);
        }
        if (isUnavailable) {
          throw new GeminiError('GEMINI_UNAVAILABLE', 'Gemini service is currently unavailable or overloaded.', 503, err);
        }

        throw new GeminiError('GEMINI_EXECUTION_FAILED', `Gemini API execution error: ${errMsg}`, 502, err);
      }
    }

    throw new GeminiError(
      'GEMINI_RETRY_EXHAUSTED',
      `Gemini request failed after ${this.maxRetries + 1} attempts.`,
      502,
      lastError
    );
  }

  /**
   * Clean JSON response from Gemini (strip markdown fences if present)
   */
  private cleanJsonResponse(rawText: string): unknown {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned.trim());
    } catch (parseErr: any) {
      throw new GeminiError(
        'GEMINI_MALFORMED_OUTPUT',
        `Failed to parse model output as JSON: ${parseErr.message}`,
        422,
        parseErr
      );
    }
  }

  /**
   * Prompt A & D: Extract order from informal / multilingual text
   */
  async extractOrder(params: {
    messageText: string;
    channel: string;
    receivedAt?: string;
    customerPhone?: string;
    knownCustomerReference?: string;
    catalogCandidates?: CatalogCandidate[];
  }): Promise<{ extraction: GeminiOrderExtraction; promptVersion: string; modelName: string }> {
    if (!params.messageText || params.messageText.trim().length === 0) {
      throw new GeminiError('INVALID_INPUT', 'Message text cannot be empty.', 400);
    }
    if (params.messageText.length > 10000) {
      throw new GeminiError('INPUT_TOO_LARGE', 'Message text exceeds 10,000 characters limit.', 413);
    }

    const userPrompt = buildOrderExtractionUserPrompt(params);

    const rawResponse = await this.executeWithRetryAndTimeout(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        config: {
          systemInstruction: ORDER_EXTRACTION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      });
      return response.text || '';
    }, 'order extraction');

    const parsedJson = this.cleanJsonResponse(rawResponse);
    const validated = geminiOrderExtractionSchema.safeParse(parsedJson);

    if (!validated.success) {
      throw new GeminiError(
        'GEMINI_SCHEMA_ERROR',
        `Model output violated order extraction runtime schema: ${validated.error.message}`,
        422,
        validated.error
      );
    }

    return {
      extraction: validated.data,
      promptVersion: ORDER_EXTRACTION_PROMPT_VERSION,
      modelName: this.modelName
    };
  }

  /**
   * Prompt B: Match an informal product reference to business catalog
   */
  async matchCatalogProduct(params: {
    itemReference: string;
    catalogCandidates: CatalogCandidate[];
  }): Promise<{ match: GeminiCatalogMatch; promptVersion: string; modelName: string }> {
    const userPrompt = JSON.stringify({
      itemReference: params.itemReference,
      catalogCandidates: params.catalogCandidates
    });

    const rawResponse = await this.executeWithRetryAndTimeout(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: CATALOG_MATCH_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      });
      return response.text || '';
    }, 'catalog matching');

    const parsedJson = this.cleanJsonResponse(rawResponse);
    const validated = geminiCatalogMatchSchema.safeParse(parsedJson);

    if (!validated.success) {
      throw new GeminiError(
        'GEMINI_SCHEMA_ERROR',
        `Model output violated catalog match schema: ${validated.error.message}`,
        422,
        validated.error
      );
    }

    return {
      match: validated.data,
      promptVersion: CATALOG_MATCH_PROMPT_VERSION,
      modelName: this.modelName
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
  }): Promise<{ explanation: GeminiMatchExplanation; promptVersion: string; modelName: string }> {
    const userPrompt = JSON.stringify({
      candidateId: params.candidateId,
      matchScore: params.score,
      algorithmVersion: params.algorithmVersion,
      computedFeatures: params.features,
      flaggedConflicts: params.conflicts,
      sourceA: params.sourceAMetadata,
      sourceB: params.sourceBMetadata
    });

    const rawResponse = await this.executeWithRetryAndTimeout(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: MATCH_EXPLANATION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      });
      return response.text || '';
    }, 'match explanation');

    const parsedJson = this.cleanJsonResponse(rawResponse);
    const validated = geminiMatchExplanationSchema.safeParse(parsedJson);

    if (!validated.success) {
      throw new GeminiError(
        'GEMINI_SCHEMA_ERROR',
        `Model output violated match explanation schema: ${validated.error.message}`,
        422,
        validated.error
      );
    }

    // Safety rule: strictly enforce HUMAN_REVIEW_REQUIRED
    if (validated.data.mergeDecision !== 'HUMAN_REVIEW_REQUIRED') {
      throw new GeminiError(
        'GEMINI_SAFETY_VIOLATION',
        'Model attempted to output an automated merge decision other than HUMAN_REVIEW_REQUIRED.',
        422
      );
    }

    return {
      explanation: validated.data,
      promptVersion: MATCH_EXPLANATION_PROMPT_VERSION,
      modelName: this.modelName
    };
  }
}
