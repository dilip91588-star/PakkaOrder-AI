# OrderTruth AI --- System Architecture

## 1. Architectural style

Use a **modular monolith** with separate frontend and backend
applications. The system does not need microservices, a message broker,
or a vector database for the initial product.

## 2. Technology stack

-   Frontend: React + TypeScript + Vite
-   Styling: Tailwind CSS or a consistent accessible CSS/component
    system
-   Backend: Node.js + Express + TypeScript
-   Database: MySQL 8+
-   AI: Google Gemini through the official Google Gen AI SDK on the
    server
-   Validation: Zod or equivalent runtime schema validation
-   Testing: Vitest, Supertest, and MySQL integration tests
-   File import: CSV parser with size and row limits

Pin dependency versions and use lockfiles. Select a Gemini model
available to the project's configured API key at implementation time; do
not hard-code an assumed model availability across environments.

## 3. Logical components

### Frontend

-   Dashboard
-   Order list and detail
-   Import/manual-entry flow
-   Candidate review queue
-   Side-by-side comparison
-   Conflict resolution form
-   Audit timeline
-   Settings and product catalog

### Backend layers

-   Routes: HTTP endpoints and middleware
-   Controllers: request/response orchestration
-   Services: business workflows
-   Domain/matching: normalization, candidate generation, scoring,
    conflicts, resolution policy
-   Repositories: parameterized SQL and transaction boundaries
-   AI adapter: Gemini extraction and product-name interpretation
-   Validation: request and model-output schemas
-   Audit service: append-only events
-   Auth/tenant middleware: identity, permissions, business isolation

## 4. Ingestion data flow

1.  Receive manual input, pasted text, or CSV row.
2.  Authenticate and resolve tenant.
3.  Validate size, content type, required fields, and idempotency key.
4.  Store the raw source record and source metadata.
5.  If the input is unstructured, call the AI adapter with a strict
    schema.
6.  Validate the AI output with runtime validation and domain rules.
7.  Store normalized fields and item lines separately from raw evidence.
8.  Run candidate generation against indexed records in the same tenant.
9.  Score candidates and identify conflicts.
10. Create/update candidate and conflict rows.
11. Return processing status to the UI.

AI failure must not erase the source record. Mark extraction as failed
or needing review and allow correction.

## 5. Matching data flow

Candidate generation should be inexpensive and recall-oriented. Use
multiple indexed paths: - Exact external order/reference ID. -
Normalized phone plus a configurable time window. - Address plus
overlapping product IDs. - Other high-signal business-specific keys.

Do not rely on a single OR-heavy query if it prevents index use. Use
separate query paths and deduplicate candidate IDs.

For each candidate: 1. Normalize and compare customer, address, items,
variants, customizations, price, currency, and time. 2. Compute
interpretable features. 3. Calculate a provisional score using a
versioned scoring configuration. 4. Run hard rules and contradiction
checks. 5. Store score, features, algorithm version, and candidate
relationship. 6. Create field-level conflicts. 7. Queue material or
uncertain conflicts for review.

A high score is not a probability unless calibrated against labelled
data. A quantity mismatch should not automatically lower duplicate
similarity so much that legitimate order updates are missed; it should
be an explicit conflict feature.

## 6. Resolution transaction

All resolution decisions run within a database transaction: 1. Validate
actor, tenant, permissions, decision, and request idempotency. 2. Lock
candidate and canonical order rows, or use optimistic version checks. 3.
Verify candidate is still actionable. 4. Verify source records and
active links are consistent. 5. Apply only the changes explicitly
approved by the user. 6. Link source records or keep them separate. 7.
Update candidate/conflict statuses. 8. Increment canonical version if
canonical state changes. 9. Append audit events. 10. Commit; on any
error, roll back.

Use `SELECT ... FOR UPDATE` where appropriate and check affected row
counts. Do not make network calls to Gemini inside a database
transaction.

## 7. Canonical order semantics

-   Source order = immutable evidence from a channel.
-   Canonical order = current accepted business representation of one
    real-world order.
-   Duplicate candidate = hypothesis about a relationship between source
    records.
-   Conflict = a field-level disagreement needing resolution.
-   Order link = relationship between source record and canonical order.
-   Audit event = historical record of an action.

Never add quantities across suspected duplicates. Never infer that the
newest record is authoritative without a reliable update/version signal
or an explicit human decision.

## 8. Security and privacy

-   Gemini API key is server-side only.
-   Use `.env` locally and secret management in deployment.
-   Enforce tenant filters in repositories and authorization middleware.
-   Parameterize SQL; validate all inputs.
-   Redact customer phone numbers and addresses in ordinary logs.
-   Limit upload size, CSV rows, request size, and AI input length.
-   Restrict audit-history access.
-   Define data retention/deletion policies.
-   Do not send more customer information to Gemini than needed.
-   Treat customer messages and imported files as untrusted data, not as
    instructions for the AI system.
-   Prevent prompt injection by separating system instructions from
    untrusted message content and validating output.
-   Use HTTPS in deployed environments.

## 9. Failure handling

-   AI unavailable: preserve source record, mark extraction failed,
    allow manual correction.
-   Malformed model response: reject output, retry only under a bounded
    policy, then request review.
-   Database failure: roll back transaction and return a safe error.
-   Duplicate webhook/import: return the existing source record where
    idempotency permits.
-   Concurrent resolution: reject stale action and reload current case.
-   Candidate changes after review opens: compare expected
    version/status before applying action.

## 10. Deployment shape

For MVP: - One frontend deployment. - One Node.js API service. - One
MySQL database. - One Gemini API integration from the backend.

Use a separate worker only if later evidence shows ingestion or model
calls need asynchronous processing.
