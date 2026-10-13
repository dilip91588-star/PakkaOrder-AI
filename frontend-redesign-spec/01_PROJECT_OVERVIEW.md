# 01 — Project Overview: PakkaOrder AI (OrderTruth AI)

## 1. Product Summary & Identity

* **Product Name**: PakkaOrder AI
* **Concept Engine**: OrderTruth AI
* **Tagline**: *Many Channels. One Pakka Order.*
* **Domain**: AI for Business, Restaurant Tech & Omnichannel Commerce
* **Product Archetype**: B2B SaaS Reconciliation & Conflict Resolution Platform for Multi-Channel Food & Beverage Operations

PakkaOrder AI solves one of the most critical operational problems in modern food service: orders arriving simultaneously through WhatsApp conversations, phone calls, delivery aggregators (Zomato, Swiggy), and in-store Point-of-Sale (POS) systems. When customers modify dishes over chat or place duplicate orders across platforms, kitchen and counter staff suffer inventory shrinkage, duplicate food preparation, and delivery errors.

Unlike generic order management systems, **PakkaOrder AI is built on a non-negotiable safety invariant: never automatically merge orders or overwrite a quantity simply because records look similar.** It acts as an intelligent reconciliation layer that matches orders across channels, calculates explainable similarity signals, flags material conflicts (especially quantity differences), and presents structured options for human review.

---

## 2. Target Users & Operating Personas

1. **Restaurant Owner / Multi-Outlet Operator**:
   * *Goals*: Eliminate food wastage from duplicate preparation, prevent revenue leakage from unbilled modifications, and maintain audit transparency across outlets.
   * *Key Needs*: High-level reconciliation metrics, channel breakdown, discrepancy financial impacts, and immutable audit logs.
2. **Operations Manager / Lead Cashier**:
   * *Goals*: Rapidly clear the reconciliation queue, resolve quantity conflicts between chat messages and aggregator feeds, and ensure canonical master orders reflect the customer's true intent.
   * *Key Needs*: Side-by-side order comparison, clear diffs of conflicting fields, 1-click resolution actions with mandatory reasons, and SLA countdowns.
3. **Counter / Dispatch Staff**:
   * *Goals*: Ingest ad-hoc WhatsApp phone orders, verify informal multilingual voice/text messages, and track order progress.
   * *Key Needs*: Rapid text-to-order extraction workbench with inline catalog matching and confidence flags.
4. **Kitchen Display Staff (Future / Recommended Expansion)**:
   * *Goals*: Prepare only verified, confirmed master orders, free from phantom duplicates or unconfirmed modifications.
   * *Key Needs*: High-contrast ticket display highlighting verified preparation notes and real-time status.

---

## 3. Current Architecture & Stack Summary

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (Vite + React 19)            │
│  - React Router DOM v7 (9 operational route paths)                     │
│  - Tailwind CSS + Lucide React                                         │
│  - Resilience: apiClient with live HTTP + fallback in-memory state     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    API & BACKEND SERVICES (Node.js + Express)          │
│  - Controllers: sourceOrderController, duplicateCandidateController    │
│  - Services: matchingEngine, resolutionService, geminiService          │
│  - Adapters: WhatsApp Graph API Webhook (HMAC-SHA256 signature check)   │
│  - AI SDK: @google/genai (server-side only, strict Zod schemas)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Parameterized SQL
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (MySQL 8.0 Engine)                  │
│  - 10 Versioned SQL Migrations applied                                 │
│  - Multi-tenant indexing & single active canonical link generated col  │
│  - HMAC-signed tamper-evident audit ledger                             │
└────────────────────────────────────────────────────────────────────────┘
```

* **Frontend**: React 19, TypeScript (strict), Vite 8.3, Tailwind CSS 3.4, Lucide React icons, React Router DOM v7.
* **Backend**: Node.js 22+, Express 4.21, TypeScript (ESM modules), Zod schema validation, `@google/genai` official SDK.
* **Database**: MySQL 8.0+ running on port 3306 (`pakka_order_ai`), managed via versioned migration runner (`001` through `010`).

---

## 4. Current State: What is Implemented vs. What is Redesign Scope

### A. Fully Implemented & Working in the Engine
1. **Core Matching Engine**: Heuristic deterministic scoring (0–100%) based on phone normalization, normalized addresses, timestamp proximity windows, and item catalog overlap.
2. **Conflict Detection & Guardrails**: Material quantity mismatches trigger `CRITICAL` severity conflicts and can never be auto-merged.
3. **Atomic Resolution Workflows**: 
   * `CONFIRM_DUPLICATE`: Links source records without summing quantities.
   * `CONFIRM_UPDATE`: Requires explicit operator reason and updates approved fields.
   * `CONFIRM_SEPARATE`: Marks candidate records as independent orders.
   * `KEEP_PENDING`: Maintains current state for further review.
4. **Multilingual Gemini AI Order Extraction**: Server-side extraction of informal Hindi/English/Hinglish chat orders into structured JSON with SKU mapping.
5. **WhatsApp Channel Ingestion**: Webhook verification challenge and inbound message ingestion with HMAC-SHA256 payload authentication.
6. **Immutable Audit Trail**: Append-only log with HMAC digital signatures and user/system actor attribution.

### B. Current Frontend Shortcomings (Why Redesign is Needed)
1. **Visual Tone**: Currently uses an ad-hoc dark slate theme (`#0b0f19`) that feels developer-focused rather than a clean, trustworthy B2B SaaS tool.
2. **Lack of a Public Presence**: No landing page or public website exists; users land directly inside the internal operator console.
3. **Density & Hierarchy**: The Review Queue and Conflict Resolution screens have dense data layouts without enough whitespace or clear visual priority for restaurant managers working quickly.
4. **Navigation**: Uses a basic desktop sidebar; lacks role-specific navigation, breadcrumbs, top-level status filters, and dedicated tablet/mobile adaptations.

---

## 5. Goals of the Google Stitch Redesign

1. **Light-Theme Professional Aesthetic**: Shift to a modern, crisp SaaS palette (Primary background `#F8FAFC`, Surface `#FFFFFF`, Brand Teal `#0F766E`) inspired by Linear and Stripe.
2. **Production-Ready Public Landing Page**: Create an authentic landing page communicating the core value proposition: *Many Channels. One Pakka Order.*
3. **Role-Tailored Operational Views**: Maintain full visibility for Owners, Ops Managers, Cashiers, and Kitchen display staff.
4. **Preserve 100% of Existing Contracts**: Guarantee that all routes, API endpoints, data types, and transactional resolution rules remain completely intact during UI replacement.
