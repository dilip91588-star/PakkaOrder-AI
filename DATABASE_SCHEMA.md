# OrderTruth AI --- Database Schema

## 1. Conventions

-   MySQL 8+ with InnoDB.
-   Use `BIGINT UNSIGNED` internal IDs.
-   Store timestamps in UTC; use `DATETIME(3)` consistently.
-   Use `DECIMAL` for quantities and monetary values, not floating-point
    types.
-   Every business-owned record is tenant-scoped.
-   Keep raw source payloads separate from normalized fields.
-   Use versioned SQL migrations. This document describes logical
    schema; review and test each migration before deployment.
-   Add foreign keys and supporting indexes to match the final schema.
-   Avoid assuming a nullable unique key enforces one active
    relationship; MySQL allows multiple `NULL` values in a unique index.

## 2. Entities

### `tenants`

Business/workspace. Fields: `id`, `name`, `timezone`, `currency`,
`created_at`.

### `users`

Fields: `id`, `tenant_id`, `name`, `email`, `role`, `status`,
timestamps. A user belongs to a tenant; add proper authentication before
production.

### `products`

Tenant's canonical catalog. Fields: `id`, `tenant_id`, `sku`, `name`,
`normalized_name`, `variant`, `unit`, `active`, timestamps. Unique SKU
within a tenant when present.

### `source_orders`

Fields: - `id`, `tenant_id` - `channel` - `external_order_id`
(nullable) - `idempotency_key` - `source_created_at`, `received_at` -
customer references and normalized contact/address fields - `currency`,
`reported_total` - `original_payload` JSON - `normalized_payload` JSON -
`extraction_status`, `record_status` - timestamps

Constraints/indexes: - Unique `(tenant_id, idempotency_key)` - Candidate
search indexes for tenant + phone + received time - Index
`(tenant_id, channel, external_order_id)` - Preserve original payload
through ordinary app workflows.

### `source_order_items`

Fields: `id`, `source_order_id`, optional source line reference,
raw/normalized item names, optional `product_id`,
`quantity DECIMAL(10,3)`, `unit`, `unit_price`, `line_total`,
`currency`, `variant` JSON, `customization` JSON, extraction confidence,
timestamps.

### `canonical_orders`

Fields: `id`, `tenant_id`, `order_ref`, optional customer reference,
order status, currency, accepted total, `version`, timestamps. Unique
`(tenant_id, order_ref)`.

### `canonical_order_items`

Fields: `id`, `canonical_order_id`, optional `product_id`, item name,
quantity, unit, unit price, line total, variant/customization JSON,
timestamps.

### `order_links`

Connects source records to canonical orders. Fields: `id`, `tenant_id`,
`source_order_id`, `canonical_order_id`, `link_type`, `linked_by`,
`linked_at`, `unlinked_at`.

A source record must have at most one active canonical link. Enforce
this with a generated active-source column and unique index, or a
separate active-link table. Do not rely on a unique key
`(source_order_id, unlinked_at)` because MySQL permits multiple NULL
values.

### `duplicate_candidates`

Fields: - `id`, `tenant_id` - `source_a_id`, `source_b_id` (store in
ascending ID order) - `match_score DECIMAL(5,4)` - `match_features`
JSON - `algorithm_version` - `relationship_type` - `review_status` -
`reviewed_by`, `reviewed_at` - timestamps

Constraints: - `source_a_id < source_b_id` - score between 0 and 1 -
unique `(tenant_id, source_a_id, source_b_id)` - index
`(tenant_id, review_status, created_at)`

Keep historical algorithm versions so results can be reproduced.

### `order_conflicts`

Fields: - `id`, `tenant_id`, `candidate_id` - `conflict_type`,
`field_path` - `value_a` JSON, `value_b` JSON - severity, resolution
status/type/notes - `resolved_by`, `resolved_at` - `created_at`

A candidate may have multiple conflicts. Store each material field
disagreement separately.

### `audit_events`

Fields: `id`, `tenant_id`, `actor_type`, optional actor user ID,
`entity_type`, `entity_id`, `action`, `before_state` JSON, `after_state`
JSON, reason, correlation ID, timestamp.

Use an append-only application pattern. Restrict database privileges to
prevent normal application code from updating/deleting audit records.

### Optional `order_revisions`

Use if full canonical order snapshots are needed. Fields: `id`,
`canonical_order_id`, `version`, `snapshot` JSON, `changed_by`,
`reason`, `created_at`. Unique `(canonical_order_id, version)`.

## 3. Relationship overview

-   Tenant has many users, products, source orders, canonical orders,
    candidates, conflicts, and audit events.
-   Source order has many source order items.
-   Canonical order has many canonical order items.
-   Source order has at most one active canonical link.
-   Duplicate candidate relates two source orders.
-   Candidate has many field-level conflicts.
-   Audit event records actions against a source order, candidate,
    conflict, or canonical order.

## 4. Resolution invariants

1.  Same tenant for all records in a candidate.
2.  Source records remain preserved.
3.  No active source link points to more than one canonical order.
4.  A confirmed duplicate never causes quantities to be summed.
5.  A confirmed update requires explicit approved values and a reason.
6.  A confirmed-separate decision does not merge canonical orders.
7.  Resolution and audit writes are atomic.
8.  A stale candidate or canonical version cannot be silently
    overwritten.
9.  Candidate pair ordering is stable.
10. A failed AI extraction remains recoverable through manual review.

## 5. Migration plan

Create migrations in this order: 1. tenants and users 2. products 3.
source_orders and source_order_items 4. canonical_orders and
canonical_order_items 5. order_links 6. duplicate_candidates 7.
order_conflicts 8. audit_events 9. indexes, generated columns, and
constraints 10. seed/demo data

Run migrations against a fresh test database and an upgrade database
before merging schema changes.
