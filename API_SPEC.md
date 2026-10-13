# OrderTruth AI --- API Specification

## 1. API conventions

-   Base path: `/api/v1`
-   JSON request and response bodies.
-   Authentication middleware must resolve `tenantId` from the
    authenticated session/token; never trust a tenant ID supplied by the
    client.
-   Validate request bodies and path/query parameters.
-   Use consistent errors:
    `{ "error": { "code": "CONFLICT_STALE_VERSION", "message": "This review changed. Reload the case.", "requestId": "..." } }`
-   Paginate list endpoints.
-   Use request idempotency keys for ingestion and resolution mutations.
-   Do not expose raw provider payloads to users without appropriate
    permissions.

## 2. Endpoints

### POST `/source-orders`

Create/import a source record.

Example:

``` json
{
  "channel": "MANUAL",
  "idempotencyKey": "demo-import-row-001",
  "sourceCreatedAt": "2026-10-12T12:02:00Z",
  "customer": {
    "phone": "+919876548210",
    "name": "Demo Customer"
  },
  "address": "Flat 402, Building A",
  "items": [
    {
      "name": "Paneer Roll",
      "quantity": 2,
      "unit": "unit"
    }
  ],
  "currency": "INR"
}
```

Response: `201 Created` with `sourceOrderId`, extraction status, and
whether candidate matching was queued/completed. Repeated idempotency
key should return the existing source record safely rather than insert
another.

### POST `/source-orders/extract`

Accept pasted order text for AI extraction. Validate text length and
size. Store the original input. The response should return structured
extraction fields and confidence/uncertainty markers. Do not commit
uncertain extraction as confirmed canonical state.

### POST `/source-orders/import-csv`

Accept CSV file upload using documented size/row limits and supported
columns. Validate each row, report per-row failures, and make imports
idempotent where possible.

### GET `/source-orders`

List source records with pagination and filters such as channel, status,
and time range.

### GET `/source-orders/:id`

Return source metadata and items for the authenticated tenant. Redact
PII based on role.

### POST `/source-orders/:id/match`

Generate candidate comparisons for a source record. Return candidate IDs
and summaries. Matching must not automatically resolve material
conflicts.

### GET `/duplicate-candidates`

List candidates with filters: - `reviewStatus` - `conflictType` -
`minScore` - `channel` - `page`, `pageSize` Return score, relationship
type, open conflict count, received timestamps, and source summaries.

### GET `/duplicate-candidates/:id`

Return side-by-side source records, field comparisons, candidate
features, score, algorithm version, conflicts, linked canonical
order(s), status, and expected versions.

### POST `/duplicate-candidates/:id/resolve`

Request:

``` json
{
  "decision": "CONFIRMED_UPDATE",
  "canonicalOrderId": 1042,
  "approvedChanges": [
    {
      "fieldPath": "items.PR-001.quantity",
      "value": 3
    }
  ],
  "reason": "Customer confirmed quantity change",
  "expectedCandidateStatus": "PENDING",
  "expectedCanonicalVersion": 4,
  "idempotencyKey": "resolution-case-87-attempt-1"
}
```

Supported decisions: - `CONFIRMED_DUPLICATE` - `CONFIRMED_UPDATE` -
`CONFIRMED_SEPARATE` - `KEEP_PENDING`

Validation rules: - User must have resolution permission. - Candidate
must still be actionable. - Both sources must belong to the tenant. -
Canonical order must belong to the same tenant. - Approved field paths
must be allowlisted and type-checked. - `CONFIRMED_UPDATE` requires
explicit approved changes and a reason. - Quantity conflict cannot be
resolved by a score or newest timestamp alone. - Check expected
versions; return `409 Conflict` on stale state. - Update candidate,
canonical state, links, conflicts, and audit events atomically.

### GET `/canonical-orders`

List canonical orders with pagination and filters.

### GET `/canonical-orders/:id`

Return canonical order, items, linked source records, unresolved
conflicts, version, and recent audit timeline.

### GET `/audit-events`

Authorized, paginated audit history. Filter by entity, action, actor,
and date range. Do not allow audit edits through this API.

## 3. Status codes

-   `200`: successful read or idempotent replay
-   `201`: record created
-   `400`: invalid request
-   `401`: unauthenticated
-   `403`: unauthorized
-   `404`: resource not found in the current tenant
-   `409`: stale version, duplicate resolution, or state conflict
-   `413`: upload/body too large
-   `422`: semantically invalid input or invalid model output
-   `429`: rate limited
-   `500`: unexpected internal error
-   `502`/`503`: upstream AI provider unavailable or temporarily failing

## 4. Security requirements

-   Use parameterized SQL.
-   Never allow client-supplied tenant IDs to determine data scope.
-   Apply upload limits and CSV parsing safeguards.
-   Validate enum values, numeric bounds, strings, and approved field
    paths.
-   Redact sensitive fields in logs.
-   Do not return stack traces or secrets.
-   Rate-limit AI extraction endpoints.
-   Use CSRF protection if using cookie-based authentication.
