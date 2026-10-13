# Product Requirements Document (PRD)

## 1. Product summary

**Product name:** PakkaOrderAI (underlying product concept & engine: OrderTruth AI)\
**Domain:** AI for Business & Commerce\
**Primary initial market:** Independent restaurants and cloud kitchens\
**Product type:** Web-based order reconciliation and review system

PakkaOrderAI collects order records from multiple channels, normalizes
them into a consistent format, identifies records that may describe the
same real-world order, detects conflicts, and supports safe human
decisions. The system maintains a canonical order linked to the original
source records and a traceable audit history.

## 2. Problem statement

Businesses receive orders through messaging, calls, POS terminals,
delivery marketplaces, and manual workflows. Re-entering or
synchronizing these orders can create duplicate records and
contradictions in quantities, products, customizations, prices,
addresses, and status. Basic order aggregation does not necessarily
establish whether records are duplicates, legitimate updates, or
separate orders.

OrderTruth AI helps staff resolve these ambiguities before fulfillment,
without destroying original evidence or making unsafe automatic merges.

## 3. Target users

### Primary

-   Restaurant owner/manager
-   Order desk or front-counter employee
-   Kitchen/fulfillment supervisor

### Secondary

-   Small online sellers
-   Wholesalers and distributors (future domain expansion)

## 4. Main jobs to be done

-   Import or enter order records from different channels.
-   See likely duplicate records and why they were matched.
-   Identify exact fields that disagree.
-   Compare source records side by side.
-   Decide whether records are duplicate entries, an authorized update,
    or separate orders.
-   Preserve the chosen canonical order and source evidence.
-   Review who made a decision, when, and why.
-   Measure matching quality using labelled test data.

## 5. MVP scope

### In scope

1.  Login-ready architecture and tenant-scoped data model; full
    enterprise identity integration may be deferred.
2.  Dashboard with canonical orders, candidate review count, and open
    conflict count.
3.  Manual source-order creation.
4.  Paste informal order text and extract structured fields with Gemini.
5.  CSV import with column mapping or a documented supported template.
6.  Normalization of customer reference, address, items, quantities,
    variants, time, currency, and totals.
7.  Candidate generation using indexed rules.
8.  Explainable similarity scoring with a stored algorithm version.
9.  Field-level conflict detection, especially quantity, product,
    variant, address, customization, price, currency, and status.
10. Side-by-side review screen.
11. Human decisions: confirm duplicate, confirm update, confirm separate
    orders, or leave pending.
12. Canonical order and item records.
13. Source-to-canonical links.
14. Transactional resolution with concurrency protection.
15. Append-only application audit events.
16. Seed data and a repeatable demo dataset.
17. Unit and integration tests for core safety rules.

### Out of scope for initial MVP

-   Automatic live integration with all delivery marketplaces.
-   Direct phone-call recording or transcription.
-   Automatic sending of WhatsApp messages.
-   Automatic cancellation/refund/payment processing.
-   Fully autonomous merging of ambiguous records.
-   Machine-learning model training from scratch.
-   Multi-region distributed architecture.
-   Native mobile apps.
-   Claims of legal, financial, or food-safety certification.

## 6. Core user workflow

1.  Staff imports or creates a source order.
2.  The backend validates the payload and idempotency key.
3.  The original source payload is stored without alteration.
4.  The normalization/extraction layer creates structured fields and
    item lines.
5.  Candidate generation searches only within the same tenant/business.
6.  The matching service computes explainable features and score.
7.  Conflict detection compares item lines and order-level fields.
8.  A review candidate is created when rules indicate meaningful
    ambiguity.
9.  Staff reviews the original records, differences, source timestamps,
    and matching explanation.
10. Staff confirms one of the supported outcomes.
11. The backend validates permissions and expected versions, then
    executes the decision in a database transaction.
12. The canonical order, links, candidate status, conflict status, and
    audit events are updated atomically.
13. The UI refreshes and shows the outcome.

## 7. Decision definitions

### Confirm duplicate

Both source records describe the same order and do not represent an
additional purchase. Link both source records to one canonical order.
Never add their quantities.

### Confirm update

Both records describe the same order, but a valid change occurred. A
reviewer must explicitly approve the resulting field values and provide
a reason. Preserve both original source records.

### Confirm separate

The records represent distinct orders. Keep separate canonical orders
and record the decision.

### Leave pending

Evidence is insufficient. Do not merge, overwrite, or finalize the
disputed field.

## 8. Functional requirements

-   FR-01: Every source record has a stable internal ID and tenant ID.
-   FR-02: Repeated ingestion of the same provider event is idempotent.
-   FR-03: Source payloads are immutable through normal application
    workflows.
-   FR-04: All normalized values retain traceability to source fields
    where practical.
-   FR-05: Candidate pairs are stored once in canonical pair order.
-   FR-06: Scores include feature details and an algorithm version.
-   FR-07: Quantity disagreement is represented as an explicit conflict.
-   FR-08: Similarity score alone cannot trigger a material merge.
-   FR-09: Every resolution is permission-checked and transactional.
-   FR-10: Concurrent or stale decisions are rejected safely.
-   FR-11: Every material decision creates an audit event.
-   FR-12: Every query and mutation is tenant-scoped.
-   FR-13: The UI distinguishes unknown/missing values from confirmed
    matches.
-   FR-14: Failed extraction does not discard the source record.
-   FR-15: AI outputs are schema-validated before persistence.

## 9. Non-functional requirements

-   Security: secrets server-side, parameterized queries, least
    privilege, tenant isolation.
-   Reliability: transaction rollback on failed resolution; ingestion
    idempotency.
-   Explainability: display matching signals and field-level conflicts.
-   Maintainability: modular monolith, TypeScript, migrations, tests.
-   Privacy: minimize customer PII, restrict access, define retention
    and redaction.
-   Accessibility: keyboard navigation, clear labels, status not
    conveyed by color alone.
-   Observability: structured logs with correlation IDs; avoid sensitive
    payload logging.
-   Performance: use indexed candidate generation and pagination.
    Establish benchmarks using realistic data rather than promising
    untested latency.

## 10. Success metrics

Evaluate with a manually labelled dataset containing true duplicates,
legitimate updates, and separate-but-similar orders.

-   Duplicate detection precision and recall.
-   False-merge rate.
-   Quantity extraction accuracy.
-   Conflict detection precision/recall.
-   Percentage of cases with a clear evidence trail.
-   Median review time versus manual baseline.
-   API failure rate and transaction rollback correctness.

The most safety-critical metric is false-merge rate. Do not report
accuracy from unlabelled demo data.

## 11. MVP acceptance criteria

-   A sample order can be entered or imported and viewed.
-   Re-ingesting the same idempotency key does not create another source
    record.
-   Two similar records with quantities 2 and 3 produce a quantity
    conflict.
-   The candidate screen shows original values, source channels,
    timestamps, score features, and conflict details.
-   Confirm duplicate links both records without summing quantities.
-   Confirm update changes canonical quantity only after explicit
    approval and keeps source values intact.
-   Confirm separate keeps two canonical orders.
-   Pending leaves canonical state unchanged.
-   Stale-version and unauthorized requests are rejected.
-   Audit events are written for all resolution outcomes.
-   Tenant A cannot read or mutate tenant B data.
-   Automated tests cover all scenarios above.
