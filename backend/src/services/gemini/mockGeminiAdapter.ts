import {
  GeminiOrderExtraction,
  GeminiExtractionItem,
  GeminiUncertainty,
  GeminiCatalogMatch,
  GeminiMatchExplanation,
  CatalogCandidate
} from './schemas.js';
import {
  ORDER_EXTRACTION_PROMPT_VERSION,
  CATALOG_MATCH_PROMPT_VERSION,
  MATCH_EXPLANATION_PROMPT_VERSION
} from './prompts.js';

/**
 * Mock Gemini Adapter
 * Clearly identified fallback adapter for offline testing, local sandboxes,
 * and environments without a valid GEMINI_API_KEY.
 */
export class MockGeminiAdapter {
  readonly isMockAdapter = true;
  readonly adapterName = 'MOCK_DETERMINISTIC_ADAPTER';

  /**
   * Prompt A & D: Extract structured order from informal or multilingual text
   */
  async extractOrder(params: {
    messageText: string;
    channel: string;
    receivedAt?: string;
    customerPhone?: string;
    knownCustomerReference?: string;
    catalogCandidates?: CatalogCandidate[];
  }): Promise<{ extraction: GeminiOrderExtraction; promptVersion: string; modelName: string }> {
    const text = params.messageText.trim();
    const lower = text.toLowerCase();
    const uncertainties: GeminiUncertainty[] = [];
    const items: GeminiExtractionItem[] = [];
    const candidates = params.catalogCandidates || [];

    // Helper to find catalog candidate
    const findCatalog = (query: string): CatalogCandidate | undefined => {
      const q = query.toLowerCase();
      return candidates.find(c => 
        c.normalizedName.includes(q) || 
        c.name.toLowerCase().includes(q) || 
        c.productId.toLowerCase() === q
      );
    };

    // 1. Detect Phone
    let detectedPhone = params.customerPhone || null;
    const phoneMatch = text.match(/(\+91[\s-]?)?[6-9]\d{9}/);
    if (phoneMatch) {
      detectedPhone = phoneMatch[0].replace(/[\s-]/g, '');
    }

    // 2. Detect Address
    let detectedAddress: string | null = null;
    if (lower.includes('prestige') || lower.includes('indiranagar') || lower.includes('flat') || lower.includes('road') || lower.includes('ओझोन') || lower.includes('सेक्टर')) {
      const addressMatch = text.match(/(?:prestige|flat|house|sector|block|indiranagar|koramangala|ओझोन)[^.]+?(?:bangalore|bengaluru|\bme\b|\bpar\b|$)/i);
      if (addressMatch) {
        detectedAddress = addressMatch[0].replace(/\b(me|par)\b/gi, '').trim();
      } else {
        detectedAddress = 'Prestige Ozone Flat 402, Indiranagar, Bangalore';
      }
    } else {
      uncertainties.push({
        fieldPath: 'delivery.address',
        reason: 'No clear delivery street address detected in informal text.'
      });
    }

    // 3. Language Detection
    let detectedLanguage = 'English';
    if (/[\u0900-\u097F]/.test(text)) {
      if (text.includes('आणि') || text.includes('दोन') || text.includes('पाठवा') || text.includes('करा')) {
        detectedLanguage = 'Marathi';
      } else {
        detectedLanguage = 'Hindi';
      }
    } else if (lower.includes('bhaiya') || lower.includes('kardo') || lower.includes('chahiye') || lower.includes('nahi') || lower.includes('jaldi')) {
      detectedLanguage = 'Hinglish / Romanized Hindi';
    }

    // 4. Check for Paneer Roll / Paneer Tikka Roll
    const hasPaneer = lower.includes('paneer') || text.includes('पनीर');
    if (hasPaneer) {
      const paneerCandidate = findCatalog('paneer');
      let qty: number | null = null;
      let isAmbiguousQty = false;

      // Check numbers in English, Hindi/Marathi devanagari or words
      const devanagariMatch = text.match(/(?:^|\s|[^\u0900-\u097Fa-zA-Z0-9])([१-९]|दोन|तीन|चार|दो|एक)\s*(?:पनीर|प्लेट|रोल)/);
      if (devanagariMatch) {
        const val = devanagariMatch[1];
        if (val === '१' || val === 'एक') qty = 1;
        else if (val === '२' || val === 'दो' || val === 'दोन') qty = 2;
        else if (val === '३' || val === 'तीन') qty = 3;
        else if (val === '४' || val === 'चार') qty = 4;
        else if (!isNaN(Number(val))) qty = Number(val);
      }

      if (qty === null) {
        const qtyMatch = lower.match(/(\d+)\s*(?:plate|roll|portion)?\s*paneer/i) || 
                         lower.match(/paneer\s*(?:roll)?\s*(\d+)/i) ||
                         lower.match(/(?:ek|do|teen|char)\s*(?:roll)?\s*paneer/i);
        if (qtyMatch) {
          const num = qtyMatch[1];
          if (num === 'do') qty = 2;
          else if (num === 'teen') qty = 3;
          else if (num === 'char') qty = 4;
          else if (num === 'ek') qty = 1;
          else if (!isNaN(Number(num))) qty = Number(num);
        }
      }

      // Check ambiguous quantity (e.g. "thoda paneer roll" or "paneer roll bhej do" without count)
      if (lower.includes('thoda') || lower.includes('kuch') || (qty === null && !lower.match(/\d+\s*nahi\s*\d+/))) {
        if (lower.includes('thoda') || lower.includes('kuch')) {
          qty = null;
          isAmbiguousQty = true;
          uncertainties.push({
            fieldPath: `items[${items.length}].quantity`,
            reason: "Ambiguous quantity: Qualitative word ('thoda'/'kuch') cannot be converted to a discrete numerical quantity."
          });
        } else if (qty === null) {
          isAmbiguousQty = true;
          uncertainties.push({
            fieldPath: `items[${items.length}].quantity`,
            reason: 'Missing quantity: No numerical count specified in customer message.'
          });
        }
      }

      // Check for explicit modification/correction in message (e.g. "2 nahi 3 kardo")
      const correctionMatch = lower.match(/(\d+)\s*nahi\s*(\d+)/i);
      if (correctionMatch) {
        qty = Number(correctionMatch[2]);
        uncertainties.push({
          fieldPath: `items[${items.length}].quantity`,
          reason: `Detected explicit update request ('${correctionMatch[1]} nahi ${correctionMatch[2]}'). Applied target quantity ${qty}.`
        });
      }

      const unitPrice = paneerCandidate?.basePrice ?? 240;
      items.push({
        rawName: `${qty ?? '?'} Paneer Tikka Roll`,
        catalogProductId: paneerCandidate?.productId ?? 'SKU-PAN-01',
        normalizedName: paneerCandidate?.normalizedName ?? 'paneer tikka roll',
        quantity: qty,
        unit: paneerCandidate?.unit ?? 'roll',
        variant: paneerCandidate?.variant ?? null,
        customization: (lower.includes('chutney') || text.includes('चटणी')) ? 'Extra green chutney' : null,
        unitPrice,
        lineTotal: qty !== null ? qty * unitPrice : null,
        confidence: isAmbiguousQty ? 0.75 : 0.98
      });
    }

    // 5. Check for Butter Chicken
    const hasChicken = lower.includes('butter chicken') || lower.includes('chicken') || text.includes('चिकन');
    if (hasChicken) {
      const chickenCandidate = findCatalog('butter chicken') || findCatalog('chicken');
      let qty: number | null = 1;
      const qtyMatch = lower.match(/(\d+)\s*(?:half|full|plate)?\s*butter chicken/i) || lower.match(/(\d+)\s*chicken/i);
      if (qtyMatch && !isNaN(Number(qtyMatch[1]))) {
        qty = Number(qtyMatch[1]);
      }

      const itemIdx = items.length;
      const isPortionSpecified = lower.includes('half') || lower.includes('full') || lower.includes('boneless');
      const unitPrice = chickenCandidate?.basePrice ?? 380;

      items.push({
        rawName: `${qty} Butter Chicken`,
        catalogProductId: chickenCandidate?.productId ?? 'SKU-MC-04',
        normalizedName: chickenCandidate?.normalizedName ?? 'butter chicken boneless',
        quantity: qty,
        unit: chickenCandidate?.unit ?? 'portion',
        variant: isPortionSpecified ? (lower.includes('half') ? 'Half' : 'Full') : null,
        customization: null,
        unitPrice,
        lineTotal: qty * unitPrice,
        confidence: isPortionSpecified ? 0.96 : 0.88
      });

      if (!isPortionSpecified) {
        uncertainties.push({
          fieldPath: `items[${itemIdx}].catalogProductId`,
          reason: 'Portion Ambiguity: Message specifies "butter chicken" without indicating Half or Full portion. Mapped to default catalog SKU.'
        });
      }
    }

    // 6. Check for Dal Makhani
    const hasDal = lower.includes('dal') || lower.includes('makhani') || text.includes('डाळ') || text.includes('दाल');
    if (hasDal) {
      const dalCandidate = findCatalog('dal');
      let qty = 1;
      const devanagariMatch = text.match(/(?:^|\s|[^\u0900-\u097Fa-zA-Z0-9])([१-९]|एक|दोन|दो)\s*(?:दाल|डाळ|प्लेट)/);
      if (devanagariMatch) {
        qty = devanagariMatch[1] === '१' || devanagariMatch[1] === 'एक' ? 1 : Number(devanagariMatch[1]) || 1;
      }
      const unitPrice = dalCandidate?.basePrice ?? 260;
      items.push({
        rawName: `${qty} Dal Makhani`,
        catalogProductId: dalCandidate?.productId ?? 'SKU-DAL-01',
        normalizedName: dalCandidate?.normalizedName ?? 'dal makhani',
        quantity: qty,
        unit: dalCandidate?.unit ?? 'portion',
        variant: null,
        customization: null,
        unitPrice,
        lineTotal: qty * unitPrice,
        confidence: 0.95
      });
    }

    // 7. Check for Garlic Naan
    const hasNaan = lower.includes('naan') || lower.includes('roti') || text.includes('नान');
    if (hasNaan) {
      const naanCandidate = findCatalog('naan') || findCatalog('roti');
      const unitPrice = naanCandidate?.basePrice ?? 50;
      items.push({
        rawName: '2 Garlic Naan',
        catalogProductId: naanCandidate?.productId ?? 'SKU-ROTI-01',
        normalizedName: naanCandidate?.normalizedName ?? 'garlic naan',
        quantity: 2,
        unit: naanCandidate?.unit ?? 'piece',
        variant: null,
        customization: null,
        unitPrice,
        lineTotal: 2 * unitPrice,
        confidence: 0.94
      });
    }

    // 8. Fallback for unrecognized item
    if (items.length === 0) {
      items.push({
        rawName: text.slice(0, 40),
        catalogProductId: null,
        normalizedName: text.slice(0, 40).trim().toLowerCase(),
        quantity: 1,
        unit: 'portion',
        variant: null,
        customization: null,
        unitPrice: null,
        lineTotal: null,
        confidence: 0.60
      });
      uncertainties.push({
        fieldPath: 'items[0].catalogProductId',
        reason: 'Unmatched item: Raw text could not be mapped to any active catalog product SKU.'
      });
    }

    const calculatedTotal = items.reduce((acc, i) => acc + (i.lineTotal || 0), 0);

    return {
      extraction: {
        detectedLanguage,
        customer: {
          name: params.knownCustomerReference || (params.customerPhone?.includes('98765') ? 'Priya Sharma' : null),
          phone: detectedPhone
        },
        delivery: {
          address: detectedAddress,
          instructions: lower.includes('jaldi') ? 'Urgent delivery requested' : null
        },
        items,
        currency: 'INR',
        reportedTotal: calculatedTotal > 0 ? calculatedTotal : null,
        uncertainties,
        extractionConfidence: uncertainties.length === 0 ? 0.98 : 0.85
      },
      promptVersion: ORDER_EXTRACTION_PROMPT_VERSION,
      modelName: 'mock-deterministic-adapter-v1'
    };
  }

  /**
   * Prompt B: Match informal item reference against catalog candidates
   */
  async matchCatalogProduct(params: {
    itemReference: string;
    catalogCandidates: CatalogCandidate[];
  }): Promise<{ match: GeminiCatalogMatch; promptVersion: string; modelName: string }> {
    const ref = params.itemReference.toLowerCase().trim();
    const candidates = params.catalogCandidates;

    // Direct match
    const exact = candidates.find(c => c.name.toLowerCase() === ref || c.normalizedName === ref || c.productId.toLowerCase() === ref);
    if (exact) {
      return {
        match: {
          status: 'MATCHED',
          productId: exact.productId,
          candidates: [{ productId: exact.productId, reason: `Exact name match with catalog SKU ${exact.productId}` }],
          uncertainty: null
        },
        promptVersion: CATALOG_MATCH_PROMPT_VERSION,
        modelName: 'mock-deterministic-adapter-v1'
      };
    }

    // Partial/Ambiguous matches
    const partials = candidates.filter(c => c.normalizedName.includes(ref) || ref.includes(c.normalizedName));
    if (partials.length === 1) {
      return {
        match: {
          status: 'MATCHED',
          productId: partials[0].productId,
          candidates: [{ productId: partials[0].productId, reason: `Matched closest catalog item: ${partials[0].name}` }],
          uncertainty: null
        },
        promptVersion: CATALOG_MATCH_PROMPT_VERSION,
        modelName: 'mock-deterministic-adapter-v1'
      };
    } else if (partials.length > 1) {
      return {
        match: {
          status: 'AMBIGUOUS',
          productId: null,
          candidates: partials.slice(0, 3).map(p => ({
            productId: p.productId,
            reason: `Plausible variant match: ${p.name} (${p.variant || 'Standard'})`
          })),
          uncertainty: 'Customer did not specify size or variant; multiple catalog candidates matched.'
        },
        promptVersion: CATALOG_MATCH_PROMPT_VERSION,
        modelName: 'mock-deterministic-adapter-v1'
      };
    }

    return {
      match: {
        status: 'NO_MATCH',
        productId: null,
        candidates: [],
        uncertainty: `Item reference "${params.itemReference}" could not be mapped to any supplied catalog SKU.`
      },
      promptVersion: CATALOG_MATCH_PROMPT_VERSION,
      modelName: 'mock-deterministic-adapter-v1'
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
    const conflicts = (params.conflicts || []).map(cf => ({
      fieldPath: cf.fieldPath,
      valueA: cf.valueA,
      valueB: cf.valueB,
      explanation: cf.fieldPath.includes('quantity')
        ? 'The quantities differ between source records and require manual operator verification.'
        : `Field ${cf.fieldPath} has conflicting values across records.`
    }));

    const supportingEvidence: string[] = [
      `Normalized phone and address match across both channels (${params.sourceAMetadata?.channel} and ${params.sourceBMetadata?.channel})`,
      'Temporal proximity indicates the records arrived within the same ordering window',
      `Match score computed at ${(params.score * 100).toFixed(1)}/100 by deterministic algorithm ${params.algorithmVersion}`
    ];

    const hasQuantityConflict = conflicts.some(c => c.fieldPath.includes('quantity'));

    return {
      explanation: {
        summary: hasQuantityConflict
          ? 'The records appear to refer to the same customer order, but contain a material quantity contradiction.'
          : 'The records demonstrate strong correlation and likely represent identical orders across channels.',
        supportingEvidence,
        conflicts,
        recommendedReview: hasQuantityConflict
          ? 'Confirm whether the customer intended an order amendment or placed separate distinct orders before kitchen preparation.'
          : 'Verify customer contact details and confirm duplicate status.',
        mergeDecision: 'HUMAN_REVIEW_REQUIRED'
      },
      promptVersion: MATCH_EXPLANATION_PROMPT_VERSION,
      modelName: 'mock-deterministic-adapter-v1'
    };
  }
}
