# PakkaOrderAI

**AI-assisted multi-channel order reconciliation and conflict resolution (Concept Engine: OrderTruth AI).**

PakkaOrderAI helps businesses reconcile order records arriving through
WhatsApp, phone-call transcripts, POS systems, delivery platforms, and
manual entry. Powered by the OrderTruth AI engine, it identifies likely duplicate records, highlights
field-level contradictions, and helps staff decide whether records
represent a duplicate entry, an authorized order modification, or
separate orders.

## Core principle

**Never automatically merge two orders or overwrite a quantity merely
because their records look similar.** The system must preserve source
evidence, explain its matching signals, and require human approval for
material conflicts.

## Documentation map

-   [`IMPLEMENTATION_DECISIONS.md`](IMPLEMENTATION_DECISIONS.md) --- Architectural decisions, schema resolutions, and folder structure.
-   [`PRD.md`](PRD.md) --- Product requirements, users, scope, success
    metrics, and acceptance criteria.
-   [`ARCHITECTURE.md`](ARCHITECTURE.md) --- System components, data
    flow, security, and design decisions.
-   [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) --- MySQL entities,
    relationships, constraints, and migration guidance.
-   [`API_SPEC.md`](API_SPEC.md) --- REST endpoints, request/response
    contracts, and error handling.
-   [`DESIGN.md`](DESIGN.md) --- UI principles, page structure, states,
    and interaction details.
-   [`PROMPTS.md`](PROMPTS.md) --- Prompts and structured-output
    contracts for Google Gemini.
-   [`PHASES.md`](PHASES.md) --- Sequential implementation plan for
    Google Antigravity.
-   [`AGENTS.md`](AGENTS.md) --- Persistent instructions for the coding
    agent.
-   [`TEST_PLAN.md`](TEST_PLAN.md) --- Test scenarios, evaluation
    metrics, and demo checklist.

## Intended stack

-   Frontend: React, TypeScript, Vite
-   UI: Tailwind CSS and a consistent accessible component system
    (implementation choice may be finalized during Phase 1)
-   Backend: Node.js, Express, TypeScript
-   Database: MySQL 8+
-   AI: Google Gemini API via the official Google Gen AI SDK on the
    backend only
-   Validation: Zod or an equivalent runtime schema validator
-   Testing: Vitest for frontend/unit tests; Supertest for API tests;
    database integration tests
-   Version control: Git

Do not add extra infrastructure (queues, vector databases,
microservices, Kubernetes) unless a later requirement demonstrates a
real need.

## Development workflow

1.  Read `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, and `PHASES.md`
    before coding.
2.  Implement only the current phase in `PHASES.md`.
3.  Keep the application runnable at the end of every phase.
4.  Run checks and tests before advancing.
5.  Do not invent integrations or claim a channel is connected until it
    is actually implemented and tested.

## Local development & Environment Setup

### 1. Configure Backend Environment
Copy `backend/.env.example` to `backend/.env` and provide your local credentials:
```bash
cp backend/.env.example backend/.env
```
Configure:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (MySQL 8+)
- `GEMINI_API_KEY` (Google Gen AI API key)
- `GEMINI_MODEL=gemini-3.1-flash-lite-preview`

*Security Rule*: `.env` files are ignored by Git. Never commit real passwords or API keys.

### 2. Run Database Migrations & Seeds
From the `backend` directory:
```bash
npm run db:migrate   # Applies 10 versioned MySQL migrations
npm run db:seed      # Seeds demo tenants, users, and catalog
```

### 3. Run Integration Verification Suite
Validate end-to-end MySQL connectivity and live Gemini API communication:
```bash
npx tsx scripts/verifyIntegration.ts
```

### 4. Running Regression Tests & Build
```bash
cd backend && npm test && npm run typecheck
cd ../frontend && npm run build
```

## MVP channel support

The first MVP supports: - Manual order entry - Pasted WhatsApp-style
text - CSV import for POS/delivery-platform exports - Sample data for
repeatable demos

Direct WhatsApp Business Platform, POS, delivery marketplace, and phone
transcription integrations are later-phase work and require valid
credentials, permissions, provider access, and separate testing.
