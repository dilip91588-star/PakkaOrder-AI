export interface NormalizedPhone {
  raw: string;
  normalized: string | null;
  isValid: boolean;
  countryCode?: string;
  nationalNumber?: string;
}

export interface NormalizedItemRef {
  rawName: string;
  normalizedName: string;
  detectedVariant: string | null;
  detectedCustomizations: string[];
  unit: string;
}

export interface NormalizedAddress {
  raw: string;
  normalized: string | null;
  tokens: string[];
  area?: string;
  pincode?: string;
}

export class NormalizationService {
  /**
   * Normalizes phone numbers (focused on Indian standard E.164 +91, with international fallback).
   * Missing or invalid formats return normalized: null (unknown, not confirmed match).
   */
  static normalizePhone(rawPhone?: string | null): NormalizedPhone {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return { raw: rawPhone || '', normalized: null, isValid: false };
    }

    const trimmed = rawPhone.trim();
    if (!trimmed) {
      return { raw: trimmed, normalized: null, isValid: false };
    }

    // Strip out all characters except digits and leading +
    const digitsOnly = trimmed.replace(/[^\d+]/g, '');
    const cleanDigits = digitsOnly.replace(/^\+/, '');

    // Check for Indian standard: 10 digits, or 11 digits starting with 0, or 12 digits starting with 91
    if (cleanDigits.length === 10 && /^[6-9]\d{9}$/.test(cleanDigits)) {
      return {
        raw: trimmed,
        normalized: `+91${cleanDigits}`,
        isValid: true,
        countryCode: '+91',
        nationalNumber: cleanDigits
      };
    } else if (cleanDigits.length === 11 && cleanDigits.startsWith('0') && /^[6-9]/.test(cleanDigits.slice(1))) {
      const nat = cleanDigits.slice(1);
      return {
        raw: trimmed,
        normalized: `+91${nat}`,
        isValid: true,
        countryCode: '+91',
        nationalNumber: nat
      };
    } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91') && /^[6-9]/.test(cleanDigits.slice(2))) {
      const nat = cleanDigits.slice(2);
      return {
        raw: trimmed,
        normalized: `+91${nat}`,
        isValid: true,
        countryCode: '+91',
        nationalNumber: nat
      };
    } else if (cleanDigits.length >= 7 && cleanDigits.length <= 15) {
      // General international phone
      return {
        raw: trimmed,
        normalized: `+${cleanDigits}`,
        isValid: true,
        nationalNumber: cleanDigits
      };
    }

    return {
      raw: trimmed,
      normalized: null,
      isValid: false
    };
  }

  /**
   * Normalizes product name, isolating known variants and customizations.
   */
  static normalizeItemRef(rawName: string, rawUnit?: string): NormalizedItemRef {
    const raw = (rawName || '').trim();
    if (!raw) {
      return {
        rawName: '',
        normalizedName: '',
        detectedVariant: null,
        detectedCustomizations: [],
        unit: 'portion'
      };
    }

    let cleaned = raw.toLowerCase();

    // Detect customizations (notes in parenthesis or brackets) from original raw string
    const bracketMatches = raw.match(/\(([^)]+)\)|\[([^\]]+)\]/g);
    const detectedCustomizations: string[] = [];
    let detectedVariant: string | null = null;

    const variantKeywords = ['half', 'full', 'single', 'double', 'regular', 'large', 'small', 'medium', 'boneless', 'with bone', 'veg', 'non-veg', 'non veg', 'egg'];

    if (bracketMatches) {
      for (const m of bracketMatches) {
        const inner = m.replace(/[()[\]]/g, '').trim();
        const innerLower = inner.toLowerCase();
        if (variantKeywords.some(vk => innerLower.includes(vk))) {
          detectedVariant = innerLower;
        } else if (inner) {
          detectedCustomizations.push(inner);
        }
      }
      cleaned = cleaned.replace(/\(([^)]+)\)|\[([^\]]+)\]/g, ' ');
    }

    // Detect variants in remainder text if not already found
    if (!detectedVariant) {
      const variantPatterns = [
        /\b(half|full|single|double|regular|large|small|medium|boneless|with bone)\b/gi,
        /\b(veg|non[- ]?veg|egg)\b/gi
      ];
      for (const pat of variantPatterns) {
        const match = cleaned.match(pat);
        if (match) {
          detectedVariant = match.map(m => m.trim().toLowerCase()).join(' ');
          cleaned = cleaned.replace(pat, ' ');
          break;
        }
      }
    }

    // Clean punctuation and repeated spaces
    cleaned = cleaned
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Standardize unit
    const unit = this.normalizeUnit(rawUnit);

    return {
      rawName: raw,
      normalizedName: cleaned,
      detectedVariant,
      detectedCustomizations,
      unit
    };
  }

  /**
   * Normalizes unit string to standard taxonomy.
   */
  static normalizeUnit(rawUnit?: string | null): string {
    if (!rawUnit) return 'portion';
    const u = rawUnit.trim().toLowerCase();
    if (['pc', 'pcs', 'piece', 'pieces', 'item', 'items'].includes(u)) return 'item';
    if (['plate', 'plates', 'pl'].includes(u)) return 'plate';
    if (['bowl', 'bowls'].includes(u)) return 'bowl';
    if (['cup', 'cups'].includes(u)) return 'cup';
    if (['bottle', 'bottles', 'can', 'cans'].includes(u)) return 'bottle';
    if (['portion', 'portions', 'servings'].includes(u)) return 'portion';
    return u;
  }

  /**
   * Normalizes timestamp to Date object and ISO string.
   */
  static normalizeTimestamp(raw?: Date | string | number | null): { date: Date; iso: string } | null {
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return {
      date: d,
      iso: d.toISOString()
    };
  }

  /**
   * Normalizes currency string.
   */
  static normalizeCurrency(raw?: string | null): string {
    if (!raw) return 'INR';
    const c = raw.trim().toUpperCase();
    return c === 'RS' || c === 'RUPEE' || c === 'RUPEES' ? 'INR' : c;
  }

  /**
   * Normalizes Indian address string.
   */
  static normalizeAddress(rawAddress?: string | null): NormalizedAddress {
    if (!rawAddress || typeof rawAddress !== 'string') {
      return { raw: rawAddress || '', normalized: null, tokens: [] };
    }

    const raw = rawAddress.trim();
    if (!raw) {
      return { raw, normalized: null, tokens: [] };
    }

    // Extract 6-digit Indian PIN code if present
    const pinMatch = raw.match(/\b([1-9]\d{5})\b/);
    const pincode = pinMatch ? pinMatch[1] : undefined;

    let text = raw.toLowerCase();

    // Expand common abbreviations
    const replacements: [RegExp, string][] = [
      [/\brd\b\.?/g, 'road'],
      [/\bst\b\.?/g, 'street'],
      [/\bflr\b\.?|\bfl\b\.?/g, 'floor'],
      [/\bapt\b\.?|\bapts\b\.?/g, 'apartment'],
      [/\bopp\b\.?/g, 'opposite'],
      [/\bnr\b\.?/g, 'near'],
      [/\bbldg\b\.?/g, 'building'],
      [/\bblvd\b\.?/g, 'boulevard'],
      [/\bsec\b\.?/g, 'sector'],
      [/\bblr\b/g, 'bangalore'],
      [/\bbengaluru\b/g, 'bangalore']
    ];

    for (const [re, rep] of replacements) {
      text = text.replace(re, rep);
    }

    // Remove punctuation, collapse spaces
    const cleaned = text
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Stop words
    const stopWords = new Set(['near', 'opp', 'opposite', 'behind', 'beside', 'floor', 'flat', 'no', 'house']);
    const tokens = cleaned
      .split(' ')
      .filter(t => t.length > 1 && !stopWords.has(t));

    return {
      raw,
      normalized: cleaned,
      tokens,
      pincode
    };
  }
}
