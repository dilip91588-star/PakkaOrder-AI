export type Channel = 'WHATSAPP' | 'POS' | 'ZOMATO' | 'SWIGGY' | 'MANUAL';

export type ReconciliationStatus = 
  | 'CANONICAL_CLEAN'
  | 'MERGED_CANONICAL'
  | 'CONFLICT_REVIEW'
  | 'MANUAL_LINKED'
  | 'UNLINKED_SOURCE';

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string[];
  dietary?: 'VEG' | 'NON_VEG';
}

export interface SourceOrder {
  id: string;
  referenceId: string;
  channel: Channel;
  tenantId: string;
  customerName: string;
  customerPhone: string; // PII masked in UI
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  receivedAt: string;
  status: ReconciliationStatus;
  canonicalOrderId?: string;
  notes?: string;
  rawPayloadSnippet?: string;
}

export interface CanonicalOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  sourceOrderIds: string[];
  channels: Channel[];
  createdAt: string;
  updatedAt: string;
  reconciliationRuleApplied?: string;
  correlationHash: string;
  status: 'DISPATCHED' | 'HELD_FOR_REVIEW' | 'CONFIRMED' | 'DELIVERED';
}

export type ConflictSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type ConflictType = 
  | 'QUANTITY_MISMATCH'
  | 'MODIFIER_VARIANCE'
  | 'PRICE_DISCREPANCY'
  | 'DUPLICATE_TIMESTAMP'
  | 'ADDRESS_AMBIGUITY';

export interface DuplicateCandidate {
  id: string;
  candidatePairId: string; // e.g. CAN-8841
  tenantId: string;
  sourceA: SourceOrder;
  sourceB: SourceOrder;
  heuristicScore: number; // 0-100 (never probabilistic)
  scoreAlgorithmVersion: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  conflictDescription: string;
  slaExpiresAt: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED_UPDATE' | 'RESOLVED_DUPLICATE' | 'RESOLVED_SEPARATE' | 'ESCALATED';
  assignedOperator?: string;
  scoreBreakdown: {
    phoneMatch: number;
    addressMatch: number;
    timestampProximity: number;
    catalogOverlap: number;
  };
}

export interface CatalogItem {
  sku: string;
  name: string;
  category: string;
  dietary: 'VEG' | 'NON_VEG';
  basePrice: number;
  variants: string[];
  active: boolean;
  mappings: {
    zomatoName?: string;
    zomatoPrice?: number;
    swiggyName?: string;
    swiggyPrice?: number;
    posCode?: string;
    posPrice?: number;
    aliases: string[];
  };
}

export interface AuditRecord {
  id: string; // AUD-XXXX
  timestamp: string;
  action: 'OPERATOR_OVERRIDE_CONFIRMED' | 'DUPLICATE_MERGE' | 'AUTO_RECONCILED' | 'CONFIRMED_SEPARATE' | 'QUANTITY_CONFLICT_FLAGGED' | 'IMPORT_COMMITTED';
  targetRecord: string;
  actor: {
    name: string;
    role: string;
    ip?: string;
    isSystem: boolean;
  };
  justification: string;
  priorStateSnippet: Record<string, unknown>;
  mutatedStateSnippet: Record<string, unknown>;
  signature: string;
}

export interface BusinessSettings {
  tenantId: string;
  legalName: string;
  displayName: string;
  timezone: string;
  currency: string;
  gstin: string;
  phone: string;
  integrations: {
    whatsapp: { status: 'SANDBOX_ACTIVE' | 'CONNECTED' | 'INACTIVE'; phone: string; webhookVerified: boolean };
    petpooja: { status: 'CONNECTED' | 'DISCONNECTED'; terminalId: string; syncIntervalSec: number };
    zomato: { status: 'CONNECTED' | 'DISCONNECTED'; merchantId: string };
    swiggy: { status: 'PENDING_SETUP' | 'CONNECTED'; outletId?: string };
    manualCsv: { status: 'ALWAYS_ACTIVE' };
  };
  reconciliationRules: {
    autoMergeThreshold: number; // e.g. 95
    strictQuantityMismatchZeroMerge: boolean; // locked to true
    temporalWindowSeconds: number; // e.g. 60
    geoRadiusMeters: number; // e.g. 100
  };
}
