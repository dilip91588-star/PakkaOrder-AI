import { geminiService } from './gemini/geminiService.js';
import { GeminiOrderExtraction, GeminiExtractionItem } from './gemini/schemas.js';

export interface ExtractedOrderItem {
  rawName: string;
  catalogProductId?: string | null;
  normalizedName: string;
  quantity: number | null;
  unit: string;
  unitPrice?: number | null;
  lineTotal?: number | null;
  confidence: number;
  customization?: string | null;
  variant?: string | null;
}

export interface ExtractionResult {
  detectedLanguage: string;
  customer: {
    name: string | null;
    phone: string | null;
  };
  delivery: {
    address: string | null;
    instructions: string | null;
  };
  items: ExtractedOrderItem[];
  currency: string;
  reportedTotal: number | null;
  uncertainties: {
    fieldPath: string;
    reason: string;
  }[];
  extractionConfidence: number;
  promptVersion: string;
  modelName: string;
  providerMode: 'LIVE_GEMINI' | 'MOCK_ADAPTER';
  isLiveGemini: boolean;
}

export class ExtractionService {
  /**
   * Extract structured order fields from informal text (English, Hindi, Marathi, Hinglish).
   * Safe, bounded, and preserves uncertainties without deciding duplicate merges.
   */
  async extractFromText(
    messageText: string,
    channel: string,
    customerPhone: string,
    knownCustomerName?: string,
    tenantId: number = 1
  ): Promise<ExtractionResult> {
    const trimmed = messageText.trim();
    if (!trimmed || trimmed.length < 3) {
      throw new Error('Message text is too short for meaningful extraction (minimum 3 characters required).');
    }

    if (trimmed.length > 10000) {
      throw new Error('Message text exceeds maximum allowed length of 10,000 characters.');
    }

    // Call Gemini integration service (uses official Google Gen AI SDK when GEMINI_API_KEY is available)
    const execResult = await geminiService.extractOrder({
      tenantId,
      messageText: trimmed,
      channel,
      customerPhone,
      knownCustomerName
    });

    const extraction: GeminiOrderExtraction = execResult.extraction;

    return {
      detectedLanguage: extraction.detectedLanguage,
      customer: {
        name: extraction.customer?.name ?? (knownCustomerName || null),
        phone: extraction.customer?.phone ?? customerPhone
      },
      delivery: {
        address: extraction.delivery?.address ?? null,
        instructions: extraction.delivery?.instructions ?? null
      },
      items: extraction.items.map((i: GeminiExtractionItem) => ({
        rawName: i.rawName,
        catalogProductId: i.catalogProductId ?? null,
        normalizedName: i.normalizedName,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice ?? null,
        lineTotal: i.lineTotal ?? (i.quantity && i.unitPrice ? i.quantity * i.unitPrice : null),
        confidence: i.confidence,
        customization: i.customization ?? null,
        variant: i.variant ?? null
      })),
      currency: extraction.currency || 'INR',
      reportedTotal: extraction.reportedTotal,
      uncertainties: extraction.uncertainties,
      extractionConfidence: extraction.extractionConfidence,
      promptVersion: execResult.promptVersion,
      modelName: execResult.modelName,
      providerMode: execResult.providerMode,
      isLiveGemini: execResult.isLiveGemini
    };
  }
}

export const extractionService = new ExtractionService();
