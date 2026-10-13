# Instructions for Google Antigravity

You are building **OrderTruth AI**, an order reconciliation application.
Treat this repository's Markdown documents as the product specification.
Read this file and the relevant documents before editing code.

## Non-negotiable rules

1.  Follow `PRD.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`,
    `API_SPEC.md`, `DESIGN.md`, and the active phase in `PHASES.md`.
2.  Implement only the active phase. Do not silently jump ahead or
    create a large amount of speculative functionality.
3.  Keep frontend and backend separate, typed, and maintainable.
4.  Preserve the original source order record. Corrections must not
    rewrite source evidence.
5.  Never automatically merge records solely because a score is high.
6.  A quantity mismatch is a material conflict. It must trigger review
    unless an explicit, validated, provider-specific update event proves
    it is a legitimate revision.
7.  Never sum quantities from duplicate records.
8.  AI output is untrusted input. Validate it against a runtime schema
    and business rules before using it.
9.  Gemini must be called from the backend only. Never expose API keys
    in frontend code, client bundles, logs, or committed files.
10. Use parameterized SQL queries. Validate all incoming API payloads.
    Enforce tenant/business boundaries in every query.
11. Use transactions for resolution workflows. Check affected row
    counts, use row locks or optimistic version checks, and roll back on
    failure.
12. Record material system and user actions in audit history. Do not
    provide ordinary application paths that update or delete audit
    records.
13. Do not claim that WhatsApp, POS, or delivery integrations work until
    they have been implemented and tested with authorized credentials.
14. Do not fabricate match accuracy, savings, integrations, customer
    data, or business outcomes.
15. Avoid unnecessary dependencies, microservices, and infrastructure.
    Prefer a working, understandable modular monolith.
16. Keep `.env` out of Git. Provide `.env.example` with placeholder
    values only.
17. Do not overwrite user work without inspecting it first. If a file
    already exists, review and extend it rather than replacing it
    blindly.
18. Do not mark a phase complete until the acceptance criteria pass.

## Engineering practices

-   Use TypeScript strict mode where practical.
-   Keep business logic out of Express route handlers.
-   Separate route/controller, service, repository/data-access,
    validation, and domain types.
-   Use explicit error handling and consistent API error responses.
-   Use database migrations or versioned SQL scripts; do not rely on
    undocumented manual database changes.
-   Keep matching scores explainable by storing feature values and
    algorithm version.
-   Use UTC for stored timestamps and render them in the user's local
    timezone.
-   Do not log full phone numbers, addresses, or raw customer messages
    unless explicitly needed and access-controlled.
-   Add tests for quantity conflicts, separate-but-similar orders,
    idempotent ingestion, tenant isolation, concurrency, and rollback.
-   If a requirement is ambiguous, state the assumption and choose the
    safest reversible behavior.

## Required response at the end of each phase

Report: 1. Files created/changed. 2. Functionality completed. 3.
Commands/tests executed and their actual results. 4. Known limitations
or failures. 5. Exact next phase to start.

Never claim a test passed if it was not run.
