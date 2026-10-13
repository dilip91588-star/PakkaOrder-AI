export type Channel = 'WHATSAPP' | 'POS' | 'ZOMATO' | 'SWIGGY' | 'MANUAL';

export type ExtractionStatus = 'PENDING' | 'SUCCESS' | 'NEEDS_REVIEW' | 'FAILED';

export type SourceRecordStatus = 
  | 'UNPROCESSED' 
  | 'CANDIDATE_SEARCHED' 
  | 'LINKED_CANONICAL' 
  | 'CONFIRMED_SEPARATE' 
  | 'REJECTED';

export type CanonicalStatus = 
  | 'CONFIRMED' 
  | 'HELD_FOR_REVIEW' 
  | 'DISPATCHED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type LinkType = 
  | 'INITIAL_CANONICAL' 
  | 'RESOLVED_DUPLICATE' 
  | 'CONFIRMED_UPDATE' 
  | 'MANUAL_LINK';

export type CandidateRelationshipType = 
  | 'POTENTIAL_DUPLICATE' 
  | 'SUSPECTED_UPDATE' 
  | 'SEPARATE_ORDER_AMBIGUOUS';

export type ReviewStatus = 
  | 'PENDING' 
  | 'IN_REVIEW' 
  | 'RESOLVED_UPDATE' 
  | 'RESOLVED_DUPLICATE' 
  | 'RESOLVED_SEPARATE';

export type ConflictType = 
  | 'QUANTITY_MISMATCH' 
  | 'PRICE_MISMATCH' 
  | 'ITEM_MISMATCH' 
  | 'ADDRESS_VARIANCE' 
  | 'STATUS_CONTRADICTION' 
  | 'TEMPORAL_ANOMALY';

export type ConflictSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type ConflictResolutionStatus = 
  | 'UNRESOLVED' 
  | 'RESOLVED_OVERRIDE_A' 
  | 'RESOLVED_OVERRIDE_B' 
  | 'RESOLVED_CUSTOM' 
  | 'DISMISSED';

export type ActorType = 'USER' | 'SYSTEM' | 'API_KEY';

export type EntityType = 
  | 'SOURCE_ORDER' 
  | 'CANONICAL_ORDER' 
  | 'DUPLICATE_CANDIDATE' 
  | 'ORDER_CONFLICT' 
  | 'ORDER_LINK' 
  | 'SETTINGS';

export type AuditAction = 
  | 'INGEST_CREATED' 
  | 'CANDIDATE_DETECTED' 
  | 'CONFLICT_FLAGGED' 
  | 'OPERATOR_OVERRIDE_CONFIRMED' 
  | 'DUPLICATE_MERGE' 
  | 'CONFIRMED_SEPARATE' 
  | 'SETTINGS_UPDATED';

export interface TenantRow {
  id: number;
  tenant_code: string;
  name: string;
  timezone: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRow {
  id: number;
  tenant_id: number;
  sku: string;
  name: string;
  normalized_name: string;
  variant: string | null;
  unit: string;
  base_price: string;
  dietary: 'VEG' | 'NON_VEG';
  active: number;
  created_at: Date;
  updated_at: Date;
}

export interface SourceOrderRow {
  id: number;
  tenant_id: number;
  channel: Channel;
  external_order_id: string | null;
  idempotency_key: string;
  source_created_at: Date;
  received_at: Date;
  customer_name: string | null;
  customer_phone: string | null;
  normalized_phone: string | null;
  delivery_address: string | null;
  normalized_address: string | null;
  currency: string;
  reported_total: string;
  original_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown> | null;
  extraction_status: ExtractionStatus;
  record_status: SourceRecordStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CanonicalOrderRow {
  id: number;
  tenant_id: number;
  order_ref: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  status: CanonicalStatus;
  currency: string;
  subtotal: string;
  tax: string;
  accepted_total: string;
  reconciliation_rule_applied: string | null;
  correlation_hash: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderLinkRow {
  id: number;
  tenant_id: number;
  source_order_id: number;
  canonical_order_id: number;
  link_type: LinkType;
  linked_by: string;
  linked_at: Date;
  unlinked_at: Date | null;
  unlinked_reason: string | null;
  is_active: number | null;
}

export interface DuplicateCandidateRow {
  id: number;
  tenant_id: number;
  source_a_id: number;
  source_b_id: number;
  match_score: string;
  match_features: Record<string, unknown>;
  algorithm_version: string;
  relationship_type: CandidateRelationshipType;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  resolution_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderConflictRow {
  id: number;
  tenant_id: number;
  candidate_id: number;
  conflict_type: ConflictType;
  field_path: string;
  value_a: Record<string, unknown> | unknown;
  value_b: Record<string, unknown> | unknown;
  severity: ConflictSeverity;
  resolution_status: ConflictResolutionStatus;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Date;
}

export interface AuditEventRow {
  id: number;
  tenant_id: number;
  actor_type: ActorType;
  actor_user_id: number | null;
  actor_name: string;
  actor_role: string;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  justification: string;
  correlation_id: string;
  signature: string;
  timestamp: Date;
}
