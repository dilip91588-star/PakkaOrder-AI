# PakkaOrderAI --- Implementation Decisions & Architecture Reconciliation

## 1. Executive Summary & Identity

- **Product Name (User Interface & User Facing):** **PakkaOrderAI**
- **Underlying Concept / Core Engine:** **OrderTruth AI** (the reconciliation, conflict detection, and canonical truth engine)
- **Brand Consistency Rule:** All user interface elements—page titles, navigation items, dialogs, badges, and user-facing copy—must consistently display **PakkaOrderAI**. The name OrderTruth AI is reserved for underlying architectural documentation or internal engine references. Do not randomly alternate names in the UI.

---

## 2. Environment & Tooling Audit

- **Operating System:** Windows (Shell: PowerShell)
- **Node.js Runtime:** `v24.13.1` (Verified)
- **NPM Version:** `11.10.1` (Verified)
- **Database Engine:** `MySQL Server 8.0.43 Community Server` (Verified on path `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`)
- **Git Status:** Workspace is currently uninitialized (`fatal: not a git repository`). Git repository initialization is scheduled for Phase 1.
- **Stitch MCP Status:**
  - Verified active and operational in this Antigravity session.
  - Tested tool connectivity via `list_projects` (succeeded with `{}`).
  - Available tools inspected: `create_project`, `get_project`, `delete_project`, `list_projects`, `list_screens`, `get_screen`, `generate_screen_from_text`, `edit_screens`, `generate_variants`, `upload_design_md`, `create_design_system`, `create_design_system_from_design_md`, `update_design_system`, `list_design_systems`, `apply_design_system`.
  - MCP configurations are left untouched in compliance with safety constraints.

---

## 3. Technology Stack Confirmations

- **Frontend:** React 18+ with TypeScript and Vite.
- **Styling:** Tailwind CSS tailored for a modern B2B operations console (neutral slate/zinc backgrounds, restrained accents, accessible high-contrast badges, keyboard focus rings, compact data grids).
- **Backend:** Node.js with Express and TypeScript, strictly structured as a modular monolith (separate routes, controllers, services, repositories, validators, and domain types).
- **Database:** MySQL 8+ (InnoDB engine) using `mysql2/promise` with parameterized queries and explicit transaction boundaries (`BEGIN`, `COMMIT`, `ROLLBACK`, `SELECT ... FOR UPDATE`).
- **Runtime Validation:** Zod schemas applied to all incoming API requests and Gemini model outputs.
- **AI Integration:** Server-side only via official Google Gen AI SDK (`@google/genai`). Model configurable via backend environment variable `GEMINI_MODEL` (e.g. `gemini-2.5-flash`), with strict runtime JSON schema validation.

---

## 4. Resolved Contradictions, Schema Fixes & Edge Cases

### 4.1. Active Order Link Constraint in MySQL 8
- **Problem Identified:** In standard SQL and MySQL InnoDB, `UNIQUE(tenant_id, source_order_id, unlinked_at)` fails because MySQL treats multiple `NULL` values as distinct, which would allow multiple active links (`unlinked_at IS NULL`) for the same source order.
- **Architectural Resolution:** In the `order_links` table migration, implement a stored or virtual generated column:
  ```sql
  `is_active` TINYINT GENERATED ALWAYS AS (IF(`unlinked_at` IS NULL, 1, NULL)) STORED,
  UNIQUE KEY `uq_active_source_order_link` (`tenant_id`, `source_order_id`, `is_active`)
  ```
  This guarantees that at most one active link (`is_active = 1`) can exist per `(tenant_id, source_order_id)`. When an order is unlinked, `is_active` becomes `NULL`, allowing historical unlinked records without collision.

### 4.2. Candidate Pair Normalization (`source_a_id < source_b_id`)
- **Problem Identified:** Ingestion order could attempt to insert `(tenant_id, 20, 10)` which violates `source_a_id < source_b_id` or creates duplicate candidate pairings.
- **Architectural Resolution:**
  - Database constraint: `CHECK (source_a_id < source_b_id)`.
  - Service layer requirement: When checking or creating duplicate candidates for two source orders `id1` and `id2`, the service must always assign:
    ```typescript
    const source_a_id = Math.min(id1, id2);
    const source_b_id = Math.max(id1, id2);
    ```
    This guarantees canonical pair ordering and prevents inverted duplicate pairs.

### 4.3. Conflict Field Path Addressing
- **Problem Identified:** `API_SPEC.md` demonstrated conflict field paths such as `items.PR-001.quantity`. However, informal messages and unmapped items lack a catalog SKU (`catalogProductId` is `null`).
- **Architectural Resolution:** Standardize field paths to support both indexed line items and SKU-mapped items:
  - Catalog-mapped: `items[sku:PR-001].quantity`
  - Unmapped line item: `items[line:0].quantity` or `items[id:502].quantity`
  - Order-level fields: `customer.phone`, `delivery.address`, `reportedTotal`, `currency`.

### 4.4. Ingestion Idempotency for Manual and Unstructured Sources
- **Problem Identified:** In manual entry or informal text pasting, clients might omit an idempotency key.
- **Architectural Resolution:**
  - If a client supplies `idempotencyKey`, it is validated and used.
  - If absent in manual/paste ingestion, the backend computes a deterministic hash:
    `SHA256(tenant_id + ":" + channel + ":" + sourceCreatedAt + ":" + customerPhone + ":" + payloadHash)`.
  - Re-submitting the exact same event returns the existing `source_order` record with `200 OK` rather than duplicating the record.

### 4.5. Zero Auto-Merge on Material Conflicts
- **Non-Negotiable Rule:** Even if similarity score is 0.99 or 1.0, any quantity, item, or address contradiction MUST be flagged as an active `order_conflict` and set candidate `review_status = 'PENDING'`. Automatic merge is strictly forbidden.

### 4.6. Append-Only Audit Trail
- Normal application connection pools will have DML permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on operational tables, but code-level repository abstraction will omit `UPDATE` and `DELETE` methods for `audit_events`. In production, MySQL user grants can revoke `UPDATE` and `DELETE` on the `audit_events` table.

---

## 5. Standardized Folder Structure

```
PakkaOrderAI/
├── frontend/                   # React + TypeScript + Vite + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Reusable UI primitives (AppShell, Tables, Badges, Dialogs)
│   │   ├── features/           # Domain-specific pages and workflows
│   │   │   ├── dashboard/      # Operations overview & metric cards
│   │   │   ├── review-queue/   # Candidate list & side-by-side comparison screen
│   │   │   ├── orders/         # Canonical and source order lists & details
│   │   │   ├── imports/        # Manual entry, text paste (Gemini extraction), CSV import
│   │   │   ├── catalog/        # Product catalog management
│   │   │   └── audit/          # Traceable append-only audit timeline
│   │   ├── services/           # Typed API clients
│   │   ├── types/              # Frontend TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                    # Node.js + Express + TypeScript Modular Monolith
│   ├── src/
│   │   ├── config/             # Environment, DB pool, Gemini client init
│   │   ├── controllers/        # Request parsing and HTTP responses
│   │   ├── routes/             # Express routing (/api/v1/...)
│   │   ├── middleware/         # Tenant isolation, auth, validation, rate limits, error handler
│   │   ├── services/           # Business logic:
│   │   │   ├── matching/       # Candidate generation, feature scoring, conflict detection
│   │   │   ├── resolution/     # Transactional resolution (duplicate, update, separate)
│   │   │   ├── extraction/     # Gemini AI prompt orchestration & validation
│   │   │   └── audit/          # Append-only audit logger
│   │   ├── repositories/       # Parameterized SQL database access layer
│   │   ├── db/
│   │   │   ├── migrations/     # Sequential SQL migrations (001_... to 010_...)
│   │   │   ├── seeds/          # Demo restaurant & menu seed fixtures
│   │   │   └── index.ts        # Database connection pool manager
│   │   ├── validators/         # Zod schemas for APIs and AI output contracts
│   │   ├── types/              # Domain entities, enums, DTOs
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docs/                       # Project specifications (retained and referenced)
│   ├── AGENTS.md
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── DESIGN.md
│   ├── PROMPTS.md
│   ├── PHASES.md
│   ├── TEST_PLAN.md
│   └── IMPLEMENTATION_DECISIONS.md
├── .gitignore
└── package.json                # Root workspace orchestration scripts
```

---

## 6. Security & Tenant Boundary Rules

1. **Tenant Isolation:** Every single database query against business entities must include `tenant_id = ?`. Client-supplied tenant IDs in request bodies are ignored; `tenant_id` is derived solely from the authenticated session context.
2. **Server-Side AI Secrets:** `GEMINI_API_KEY` is strictly confined to `backend/.env`. It is never exported, logged, or bundled into client code.
3. **Transaction Safety:** Resolution operations must lock rows or perform atomic version checks:
   ```sql
   UPDATE canonical_orders
   SET version = version + 1, ...
   WHERE id = ? AND tenant_id = ? AND version = ?
   ```
   If affected rows count is 0, the transaction rolls back and returns `409 Conflict (CONFLICT_STALE_VERSION)`.
4. **Data Redaction:** Phone numbers and street addresses in server logs must be masked. Raw external payloads are accessible only to authorized roles.

---

## 7. Immediate Next Phase

- **Current Status:** Phase 0 complete. Workspace audited, dependencies verified, contradictions resolved, Stitch MCP confirmed, and decisions documented.
- **Exact Next Phase:** **Phase 1 --- Project Scaffold** (Initialize Git, create `frontend/` with React+Vite+TypeScript+Tailwind, create `backend/` with Node+Express+TypeScript, configure scripts, add `/health`, CORS, and error handling).
