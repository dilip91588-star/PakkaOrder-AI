# OrderTruth AI --- Implementation Phases for Google Antigravity

## Working agreement

Implement one phase at a time. At the end of each phase, run the listed
checks, summarize results, and stop for review. Do not continue
automatically into the next phase unless the user explicitly asks or the
workflow is clearly configured for sequential execution.

Before starting, read `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`,
`DATABASE_SCHEMA.md`, `API_SPEC.md`, `DESIGN.md`, and `TEST_PLAN.md`.

## Phase 0 --- Repository inspection and plan

**Goal:** Understand the current repository before making changes.

Tasks: - Inspect existing files and installed dependencies. - Identify
existing code that should be preserved. - Confirm Node.js/npm versions
and MySQL availability. - Produce a short implementation plan and list
assumptions. - Do not overwrite files blindly.

Acceptance: - Existing structure documented. - No code changes unless
needed for safe setup and approved.

## Phase 1 --- Project scaffold

**Goal:** Create runnable frontend and backend skeletons.

Tasks: - Create React + TypeScript + Vite frontend. - Create Node.js +
Express + TypeScript backend. - Add scripts for dev, build, lint, and
test. - Add `.gitignore`, `.env.example`, and root README updates. - Add
`/health` endpoint. - Configure CORS for local development only. - Add
consistent error middleware and request IDs.

Acceptance: - Frontend starts. - Backend starts. - Health endpoint
responds. - Production build/typecheck passes. - Secrets are not
committed.

## Phase 2 --- UI shell and design system

**Goal:** Build navigation and polished placeholder screens without fake
live integrations.

Tasks: - Implement AppShell, sidebar, header, dashboard cards, review
queue, order list, imports, audit page placeholders. - Use demo fixtures
clearly labelled as demo data. - Implement responsive layout, accessible
labels, loading/empty/error states. - Do not wire fabricated backend
behavior.

Acceptance: - Navigation works. - UI matches `DESIGN.md`. - No console
errors or inaccessible primary controls.

## Phase 3 --- MySQL schema and migrations

**Goal:** Create database foundation.

Tasks: - Create migration scripts for tenants/users/products/source
orders/source items/canonical orders/canonical items/order
links/candidates/conflicts/audit events. - Add foreign keys, tenant
indexes, idempotency constraints, active-link enforcement, and candidate
pair uniqueness. - Add seed data for one demo restaurant and sample
catalog. - Add migration and seed scripts. - Keep credentials in backend
`.env`.

Acceptance: - Fresh database migration succeeds. - Seed script is
repeatable or safely idempotent. - Constraints are tested. - No
production data is required.

## Phase 4 --- Source-order APIs and imports

**Goal:** Create and inspect source records.

Tasks: - Implement manual order creation and listing/detail endpoints. -
Add request validation. - Preserve original payload and store normalized
items. - Implement idempotency for source ingestion. - Add CSV import
with size/row limits and per-row results. - Build frontend import and
order detail workflows.

Acceptance: - Create/list/get operations work. - Repeated idempotency
key does not duplicate a record. - Invalid records produce clear
errors. - Original source data remains unchanged.

## Phase 5 --- Normalization and deterministic matching

**Goal:** Find likely candidate pairs and explain the score.

Tasks: - Normalize phones, item references, timestamps, currency,
addresses, variants, and units carefully. - Implement indexed candidate
generation with separate query paths. - Implement feature calculation
and versioned scoring. - Handle missing data as unknown. - Add hard
rules and conflict detection. - Store duplicate candidates and
field-level conflicts. - Add test fixtures for duplicates, updates, and
separate orders.

Acceptance: - Same items in different order still match appropriately. -
Quantity differences create explicit conflicts. - Similar-but-separate
orders are not auto-merged. - Feature details and algorithm version are
persisted. - Precision/recall evaluation can run against labelled
fixtures.

## Phase 6 --- Candidate review and safe resolution

**Goal:** Implement the core product workflow.

Tasks: - Build candidate list and side-by-side detail screen. - Display
source IDs, channels, timestamps, matching features, conflicts, and
raw/normalized values. - Implement confirm duplicate, confirm update,
confirm separate, and keep pending. - Add reason and explicit approved
changes for updates. - Use transactions, row locks/optimistic versions,
idempotency, and audit events. - Add stale-state and unauthorized-action
handling.

Acceptance: - Confirm duplicate links records without adding
quantities. - Confirm update changes only approved canonical fields and
preserves source records. - Confirm separate keeps orders independent. -
Pending does not alter canonical state. - Concurrent/stale resolution is
rejected safely. - Audit history is written atomically.

## Phase 7 --- Gemini order extraction

**Goal:** Interpret informal text safely.

Tasks: - Add server-side Gemini client using official SDK. - Read API
key from environment only. - Implement prompt versions and
schema-constrained output. - Validate outputs at runtime. - Handle
timeout, rate limit, invalid output, and provider outage. - Add
extraction preview/edit flow. - Keep uncertain values unconfirmed.

Acceptance: - Pasted sample messages yield validated structured
records. - Invalid AI output cannot mutate canonical orders. - API key
never appears in frontend bundle or logs. - Failure preserves original
input and permits manual correction.

## Phase 8 --- Dashboard and audit integration

**Goal:** Show truthful operational metrics.

Tasks: - Connect cards and review table to actual API data. - Add
filters, pagination, status indicators, and audit timeline. - Ensure
metrics distinguish source records from canonical orders. - Label demo
data when using fixtures.

Acceptance: - Dashboard values come from the backend. -
Empty/error/loading states work. - Filters and pagination are tested.

## Phase 9 --- Security, testing, and hardening

**Goal:** Validate the main failure modes.

Tasks: - Tenant isolation tests. - Authentication/authorization tests. -
Input-size, CSV, and schema validation. - SQL injection checks through
parameterized query review. - Rate limits for AI endpoints. - PII
redaction in logs. - Transaction rollback and concurrency tests. -
Accessibility review. - Dependency and build checks.

Acceptance: - All critical tests pass. - No cross-tenant access. - No
automatic merge on material conflict. - Failure cases are documented.

## Phase 10 --- Real channel integrations (optional)

**Goal:** Add actual external channel ingestion only when credentials
and permissions are available.

Tasks: - Implement one provider at a time. - Use provider event IDs for
idempotency where available. - Verify webhook signatures and
permissions. - Store provider metadata and source payload. - Test
retries, out-of-order events, and provider-specific updates. - Do not
claim support for unimplemented providers.

Acceptance: - Integration works in a real test environment. - Duplicate
webhook delivery is idempotent. - Provider failures are recoverable. -
Credentials are managed securely.

## Phase 11 --- Evaluation and demo readiness

**Goal:** Prepare an honest, repeatable demonstration.

Tasks: - Create a labelled dataset with duplicates, quantity changes,
separate orders, missing fields, and conflicting addresses. - Calculate
precision, recall, false-merge rate, and extraction accuracy. - Prepare
an end-to-end demo flow. - Document limitations and future work. -
Capture actual test results, not invented performance claims.

Acceptance: - Demo can be reset and repeated. - Metrics include dataset
size and evaluation method. - False merges and known limitations are
disclosed.

## How to ask Antigravity to start

Use this instruction:

"Read AGENTS.md, README.md, PRD.md, ARCHITECTURE.md, DATABASE_SCHEMA.md,
API_SPEC.md, DESIGN.md, PROMPTS.md, and TEST_PLAN.md. Inspect the
repository first. Execute Phase 1 only from PHASES.md. Do not implement
later phases. Preserve existing work, run the phase checks, and report
changed files, actual test results, limitations, and the next phase."
