import { NormalizationService } from './normalizationService.js';
import type { ConflictType, ConflictSeverity } from '../types/index.js';

export interface SourceItemComparisonInput {
  id?: number | string;
  productId?: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  variant?: string | null;
  customizations?: string[];
}

export interface ItemMatchPair {
  itemA: SourceItemComparisonInput;
  itemB: SourceItemComparisonInput;
  nameMatchScore: number;
  quantityA: number;
  quantityB: number;
  quantityMatches: boolean;
  unitPriceA: number;
  unitPriceB: number;
  priceMatches: boolean;
  variantA: string | null;
  variantB: string | null;
  variantMatches: boolean;
  customizationsA: string[];
  customizationsB: string[];
}

export interface DetectedConflict {
  conflictType: ConflictType;
  fieldPath: string;
  valueA: Record<string, unknown> | unknown;
  valueB: Record<string, unknown> | unknown;
  severity: ConflictSeverity;
  reason: string;
}

export interface ItemComparisonResult {
  matchedPairs: ItemMatchPair[];
  unmatchedA: SourceItemComparisonInput[];
  unmatchedB: SourceItemComparisonInput[];
  overallItemSimilarity: number;
  quantityDisagreementDetected: boolean;
  conflicts: DetectedConflict[];
}

export class ItemComparisonService {
  /**
   * Compares two lists of items order-agnostically, handles repeated lines,
   * matches by catalog ID or normalized name similarity, and flags field-level conflicts.
   */
  static compareItems(
    itemsA: SourceItemComparisonInput[],
    itemsB: SourceItemComparisonInput[]
  ): ItemComparisonResult {
    const conflicts: DetectedConflict[] = [];

    if (!itemsA.length && !itemsB.length) {
      return {
        matchedPairs: [],
        unmatchedA: [],
        unmatchedB: [],
        overallItemSimilarity: 1.0,
        quantityDisagreementDetected: false,
        conflicts: []
      };
    }

    if (!itemsA.length || !itemsB.length) {
      const nonEmpties = itemsA.length ? itemsA : itemsB;
      const side = itemsA.length ? 'A' : 'B';
      for (const item of nonEmpties) {
        conflicts.push({
          conflictType: 'ITEM_MISMATCH',
          fieldPath: `items[${item.name}]`,
          valueA: side === 'A' ? { name: item.name, quantity: item.quantity } : null,
          valueB: side === 'B' ? { name: item.name, quantity: item.quantity } : null,
          severity: 'CRITICAL',
          reason: `Item "${item.name}" only exists in order ${side}.`
        });
      }
      return {
        matchedPairs: [],
        unmatchedA: itemsA,
        unmatchedB: itemsB,
        overallItemSimilarity: 0.0,
        quantityDisagreementDetected: false,
        conflicts
      };
    }

    // Prepare normalized representations
    const normA = itemsA.map((item, idx) => ({
      idx,
      raw: item,
      norm: NormalizationService.normalizeItemRef(item.name, item.unit)
    }));

    const normB = itemsB.map((item, idx) => ({
      idx,
      raw: item,
      norm: NormalizationService.normalizeItemRef(item.name, item.unit)
    }));

    const matchedPairs: ItemMatchPair[] = [];
    const usedB = new Set<number>();
    const usedA = new Set<number>();

    // Pass 1: Match by explicit productId if both have it
    for (const a of normA) {
      if (!a.raw.productId) continue;
      for (const b of normB) {
        if (usedB.has(b.idx)) continue;
        if (b.raw.productId === a.raw.productId) {
          usedA.add(a.idx);
          usedB.add(b.idx);
          matchedPairs.push(this.evaluatePair(a.raw, b.raw, 1.0));
          break;
        }
      }
    }

    // Pass 2: Match by normalized name exact match
    for (const a of normA) {
      if (usedA.has(a.idx)) continue;
      for (const b of normB) {
        if (usedB.has(b.idx)) continue;
        if (a.norm.normalizedName && a.norm.normalizedName === b.norm.normalizedName) {
          usedA.add(a.idx);
          usedB.add(b.idx);
          matchedPairs.push(this.evaluatePair(a.raw, b.raw, 1.0));
          break;
        }
      }
    }

    // Pass 3: Match by token overlap / fuzzy substring if not matched
    for (const a of normA) {
      if (usedA.has(a.idx)) continue;
      let bestMatch: (typeof normB)[0] | null = null;
      let bestScore = 0;

      for (const b of normB) {
        if (usedB.has(b.idx)) continue;
        const score = this.calculateStringSimilarity(a.norm.normalizedName, b.norm.normalizedName);
        if (score > bestScore && score >= 0.70) {
          bestScore = score;
          bestMatch = b;
        }
      }

      if (bestMatch && bestScore >= 0.70) {
        usedA.add(a.idx);
        usedB.add(bestMatch.idx);
        matchedPairs.push(this.evaluatePair(a.raw, bestMatch.raw, bestScore));
      }
    }

    const unmatchedA = itemsA.filter((_, idx) => !usedA.has(idx));
    const unmatchedB = itemsB.filter((_, idx) => !usedB.has(idx));

    // Flag unmatched items as conflicts
    for (const item of unmatchedA) {
      conflicts.push({
        conflictType: 'ITEM_MISMATCH',
        fieldPath: `items[${item.name}]`,
        valueA: { name: item.name, quantity: item.quantity, price: item.unitPrice },
        valueB: null,
        severity: 'CRITICAL',
        reason: `Item "${item.name}" was ordered in Record A but is absent in Record B.`
      });
    }

    for (const item of unmatchedB) {
      conflicts.push({
        conflictType: 'ITEM_MISMATCH',
        fieldPath: `items[${item.name}]`,
        valueA: null,
        valueB: { name: item.name, quantity: item.quantity, price: item.unitPrice },
        severity: 'CRITICAL',
        reason: `Item "${item.name}" was ordered in Record B but is absent in Record A.`
      });
    }

    // Check matched pairs for material conflicts
    let quantityDisagreementDetected = false;

    for (const pair of matchedPairs) {
      // 1. Quantity Mismatch: MATERIAL CONFLICT (Rule #6 & Product Rule)
      if (!pair.quantityMatches) {
        quantityDisagreementDetected = true;
        conflicts.push({
          conflictType: 'QUANTITY_MISMATCH',
          fieldPath: `items[${pair.itemA.name}].quantity`,
          valueA: { quantity: pair.quantityA, unitPrice: pair.unitPriceA, name: pair.itemA.name },
          valueB: { quantity: pair.quantityB, unitPrice: pair.unitPriceB, name: pair.itemB.name },
          severity: 'CRITICAL',
          reason: `Quantity conflict: Order A specifies ${pair.quantityA}x vs Order B specifies ${pair.quantityB}x for "${pair.itemA.name}". Requires operator review.`
        });
      }

      // 2. Variant Mismatch
      if (!pair.variantMatches && (pair.variantA || pair.variantB)) {
        conflicts.push({
          conflictType: 'ITEM_MISMATCH',
          fieldPath: `items[${pair.itemA.name}].variant`,
          valueA: { variant: pair.variantA, name: pair.itemA.name },
          valueB: { variant: pair.variantB, name: pair.itemB.name },
          severity: 'WARNING',
          reason: `Variant discrepancy: "${pair.variantA || 'standard'}" vs "${pair.variantB || 'standard'}" for "${pair.itemA.name}".`
        });
      }

      // 3. Price Mismatch
      if (!pair.priceMatches && Math.abs(pair.unitPriceA - pair.unitPriceB) > 1.0) {
        conflicts.push({
          conflictType: 'PRICE_MISMATCH',
          fieldPath: `items[${pair.itemA.name}].unitPrice`,
          valueA: { unitPrice: pair.unitPriceA },
          valueB: { unitPrice: pair.unitPriceB },
          severity: 'INFO',
          reason: `Unit price variance: ₹${pair.unitPriceA} in Record A vs ₹${pair.unitPriceB} in Record B.`
        });
      }
    }

    // Calculate overall item similarity
    // Score reflects item catalog/name overlap, keeping quantity separate
    const totalLines = Math.max(itemsA.length, itemsB.length);
    const matchedScoreSum = matchedPairs.reduce((acc, p) => acc + p.nameMatchScore, 0);
    const overallItemSimilarity = totalLines > 0 ? Number((matchedScoreSum / totalLines).toFixed(4)) : 1.0;

    return {
      matchedPairs,
      unmatchedA,
      unmatchedB,
      overallItemSimilarity,
      quantityDisagreementDetected,
      conflicts
    };
  }

  private static evaluatePair(
    itemA: SourceItemComparisonInput,
    itemB: SourceItemComparisonInput,
    nameMatchScore: number
  ): ItemMatchPair {
    const normA = NormalizationService.normalizeItemRef(itemA.name, itemA.unit);
    const normB = NormalizationService.normalizeItemRef(itemB.name, itemB.unit);

    const variantA = itemA.variant || normA.detectedVariant;
    const variantB = itemB.variant || normB.detectedVariant;
    const variantMatches = (!variantA && !variantB) || (variantA?.toLowerCase() === variantB?.toLowerCase());

    const quantityMatches = Number(itemA.quantity) === Number(itemB.quantity);
    const priceMatches = Math.abs(Number(itemA.unitPrice || 0) - Number(itemB.unitPrice || 0)) < 0.01;

    const customizationsA = itemA.customizations || normA.detectedCustomizations;
    const customizationsB = itemB.customizations || normB.detectedCustomizations;

    return {
      itemA,
      itemB,
      nameMatchScore,
      quantityA: itemA.quantity,
      quantityB: itemB.quantity,
      quantityMatches,
      unitPriceA: itemA.unitPrice,
      unitPriceB: itemB.unitPrice,
      priceMatches,
      variantA,
      variantB,
      variantMatches,
      customizationsA,
      customizationsB
    };
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1.0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;

    // Token Jaccard
    const tokens1 = new Set(s1.split(' ').filter(Boolean));
    const tokens2 = new Set(s2.split(' ').filter(Boolean));

    let intersection = 0;
    for (const t of tokens1) {
      if (tokens2.has(t)) intersection++;
    }

    const union = new Set([...tokens1, ...tokens2]).size;
    return union > 0 ? intersection / union : 0;
  }
}
