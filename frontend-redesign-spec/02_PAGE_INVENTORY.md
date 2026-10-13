# 02 — Complete Page and Route Inventory

This inventory documents all current screens in the repository alongside justified proposed screens for the Google Stitch redesign.

---

## 1. Classification Summary

| Status Code | Definition | Count |
| :--- | :--- | :---: |
| **EXISTING_FUNCTIONAL** | Page exists, has a dedicated route, connects to backend API with live data and error handling. | 6 |
| **EXISTING_PARTIAL** | Page exists, handles UI actions, but relies partly on demo fallback stores or mock endpoints for auxiliary items. | 3 |
| **EXISTING_MOCK_ONLY** | Page exists purely as static mockup without reactive state. | 0 |
| **RECOMMENDED_NEW** | Screen is not in current routing but is essential for a complete commercial SaaS product. | 3 |

---

## 2. Detailed Inventory of Existing Pages

### PAGE 1: Operational Dashboard (Overview)
* **Route Path**: `/`
* **Source Component**: [DashboardPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/DashboardPage.tsx)
* **Implementation Status**: **EXISTING_FUNCTIONAL**
* **Purpose**: Provides restaurant managers with real-time operational health, channel ingestion volume, deduplication rate, and high-priority pending review counts.
* **Authorized Roles**: `OWNER`, `MANAGER`, `LEAD_OPS`
* **Current UI Components**:
  * Demo Sandbox Disclaimer Banner
  * 4 Primary KPI Summary Cards (Source Orders Received, Canonical Orders, Pending Reviews, Reconciliation Rate)
  * Channel Ingestion Breakdown Table (WhatsApp, Zomato, Swiggy, POS)
  * High-Priority Pending Review Queue Widget (Top 3 items with direct resolution deep-links)
  * Recent Operational Activity Ledger preview
* **Backend API Dependencies**:
  * `GET /api/v1/duplicate-candidates` (fetches candidate pool to compute counts and display top pending items)
  * `GET /health` (probes database and service uptime)
* **User Interactions**: Click through to Review Queue, click through to Orders list, dismiss/view demo disclaimer.
* **UI/UX Limitations in Current Implementation**:
  * Metric cards have small font contrast on dark background.
  * Channel breakdown is a simple inline text snippet rather than a visual progress bar or breakdown chart.
  * No date range selector (assumes current day/shift).
* **Stitch Redesign Recommendations**:
  * Shift to light surface cards with subtle `#E2E8F0` borders.
  * Add a shift/timeframe toggle (Today, Yesterday, Last 7 Days).
  * Prominent teal action button: *"Review 4 Pending Conflicts"*.

---

### PAGE 2: Unified Orders Inbox (Orders List)
* **Route Path**: `/orders`
* **Source Component**: [OrdersListPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/OrdersListPage.tsx)
* **Implementation Status**: **EXISTING_FUNCTIONAL**
* **Purpose**: Complete listing of all processed orders, supporting dual perspectives: **Canonical Unified Orders** (the master single source of truth) vs. **Source Orders** (raw ingested platform records).
* **Authorized Roles**: `OWNER`, `MANAGER`, `LEAD_OPS`, `COUNTER_STAFF`
* **Current UI Components**:
  * Dual View Mode Toggle (`CANONICAL` master vs. `SOURCE` platform feeds)
  * Search bar (Order ID, customer name, phone number, item names)
  * Channel filter pills (`ALL`, `WHATSAPP`, `ZOMATO`, `SWIGGY`, `POS`)
  * Data Table with expand/collapse item drawer
  * Status Badge, Channel Badge, and Raw JSON payload inspection modal
  * CSV Export button
* **Backend API Dependencies**:
  * `GET /api/v1/source-orders` (fetches source orders)
  * `GET /api/v1/source-orders/:id` (inspects individual payload)
* **User Interactions**: Switch view modes, filter by channel, type live search query, expand row to preview order items, open raw JSON modal, export CSV.
* **UI/UX Limitations in Current Implementation**:
  * Dual toggle is subtle and can confuse operators between canonical orders and raw source orders.
  * Payload modal displays raw unformatted JSON in a basic pre block.
* **Stitch Redesign Recommendations**:
  * Segmented pill control: `Canonical Master Orders (136)` vs `Raw Source Ingestion (148)`.
  * Visual diff indicator showing if a canonical order was created from multiple merged channels.
  * Clean drawer view for order item line items with dietary badges (Veg/Non-Veg).

---

### PAGE 3: Order Details & Provenance
* **Route Path**: `/orders/:id`
* **Source Component**: [OrderDetailPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/OrderDetailPage.tsx)
* **Implementation Status**: **EXISTING_FUNCTIONAL**
* **Purpose**: Inspect complete provenance of an individual order, showing linked source platform records, customer delivery info, itemized pricing, and idempotency keys.
* **Authorized Roles**: `OWNER`, `MANAGER`, `LEAD_OPS`, `COUNTER_STAFF`
* **Current UI Components**:
  * Breadcrumb & Back navigation button
  * Order Summary Header with Canonical/Source status badges
  * Customer & Delivery Information Card (Name, Masked Phone, Delivery Address)
  * Multi-Channel Linkage Panel (Shows which platform IDs contributed to this canonical record)
  * Itemized Line Items Table (Name, SKU, Qty, Unit Price, Total, Customization notes)
  * Financial Summary Card (Subtotal, Tax, Final Amount)
  * Idempotency & Raw JSON Snippet Drawer
* **Backend API Dependencies**:
  * `GET /api/v1/source-orders/:id`
* **User Interactions**: Back button, expand/collapse raw payload details, copy order ID to clipboard.
* **UI/UX Limitations in Current Implementation**:
  * Visual linkage between the canonical master order and its source origins is text-only.
  * Lacks a visual timeline of when the order was received, matched, and dispatched.
* **Stitch Redesign Recommendations**:
  * Visual channel breadcrumb tree: `[WhatsApp #WA-901] ──► [Canonical Master #CAN-1042] ◄── [POS #POS-331]`.
  * Dedicated "Kitchen Verification" stamp showing whether staff verified all customer modifications.

---

### PAGE 4: Conflict Review Queue
* **Route Path**: `/review`
* **Source Component**: [ReviewQueuePage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/ReviewQueuePage.tsx)
* **Implementation Status**: **EXISTING_FUNCTIONAL**
* **Purpose**: Primary operational triage workbench where pending duplicate candidate pairs and conflicting order revisions are listed for human review.
* **Authorized Roles**: `OWNER`, `MANAGER`, `LEAD_OPS`
* **Current UI Components**:
  * Queue Tab Filter (`ALL`, `CRITICAL`, `WARNING`, `RESOLVED`)
  * Multi-faceted Filters: Conflict Type (`QUANTITY_MISMATCH`, `MODIFIER_VARIANCE`, etc.), Channel, Date
  * Candidate Pair Table: Shows Pair ID, Severity Badge, Heuristic Similarity Score Pill, Source A vs. Source B overview, Conflict Description, SLA Timer
  * Quick-Action Column with direct link to side-by-side resolution screen
  * Export Queue CSV button
* **Backend API Dependencies**:
  * `GET /api/v1/duplicate-candidates`
* **User Interactions**: Switch tabs, filter by severity, filter by channel, type live text search, click row to open resolution workspace.
* **UI/UX Limitations in Current Implementation**:
  * High-density table can feel overwhelming under rush-hour volume.
  * SLA urgency is shown as static text rather than an urgent visual countdown.
* **Stitch Redesign Recommendations**:
  * Prominent urgency badges: Red alert banner for `CRITICAL (Quantity Mismatch - Delivery Risk)`.
  * Card-based or grouped table design highlighting the exact conflicting fields (e.g. `Qty 2 vs 3`).
  * SLA indicator with color change: Green (>15m), Amber (5-15m), Red (<5m).

---

### PAGE 5: Side-by-Side Conflict Resolution Workspace
* **Route Path**: `/review/:id`
* **Source Component**: [ConflictResolutionPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/ConflictResolutionPage.tsx)
* **Implementation Status**: **EXISTING_FUNCTIONAL**
* **Purpose**: Core decision screen. Allows an authorized operator to compare two conflicting order records side-by-side, view Gemini-generated matching explanations, and safely choose a resolution action.
* **Authorized Roles**: `OWNER`, `MANAGER`, `LEAD_OPS`
* **Current UI Components**:
  * Header with Candidate Pair ID, Severity, Score Pill, and SLA Countdown
  * AI Match Explanation Box (Powered by Gemini explanation contract)
  * Side-by-Side Comparison Columns:
    * **Left Column (Source A)**: Channel, Reference ID, Timestamp, Customer Info, Items Table
    * **Right Column (Source B)**: Channel, Reference ID, Timestamp, Customer Info, Items Table
  * Field-level Contradiction Highlighting (Red border on mismatched quantities/modifiers)
  * 4 Primary Action Buttons:
    1. `Confirm Duplicate`: Links records without summing quantities (Rule #7)
    2. `Confirm Update`: Prompts for operator approval and selected final quantity
    3. `Confirm Separate`: Marks records as independent non-conflicting orders
    4. `Keep Pending`: Defers decision
  * Mandatory Operator Reason Modal with confirmation step
* **Backend API Dependencies**:
  * `GET /api/v1/duplicate-candidates/:id`
  * `GET /api/v1/duplicate-candidates/:id/explain`
  * `POST /api/v1/duplicate-candidates/:id/resolve`
* **User Interactions**: Compare side-by-side attributes, select canonical quantity in update mode, open confirmation modal, input mandatory operator rationale, submit atomic resolution.
* **UI/UX Limitations in Current Implementation**:
  * Side-by-side layout requires horizontal scrolling on screens under 1280px.
  * Diff styling relies heavily on saturated red borders.
* **Stitch Redesign Recommendations**:
  * Clean split-pane comparison view with a central "Diff Spine" indicating exact variances.
  * High-contrast "Safe Action Bar" fixed at the bottom with clear explanatory microcopy for each button.

---

### PAGE 6: Order Ingestion & AI Extraction Workbench
* **Route Path**: `/imports`
* **Source Component**: [ImportOrdersPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/ImportOrdersPage.tsx)
* **Implementation Status**: **EXISTING_FUNCTIONAL**
* **Purpose**: Ingest orders into the reconciliation engine through 3 distinct methods: Conversational AI Text Extraction, Multi-Channel CSV Batch Upload, and Manual POS Counter Entry.
* **Authorized Roles**: `OWNER`, `MANAGER`, `LEAD_OPS`, `COUNTER_STAFF`
* **Current UI Components**:
  * 3 Mode Tabs:
    1. `Conversational AI (WhatsApp/Audio text)`: Textarea for informal Hinglish/English text, Channel selector, "Extract with Gemini" button, Editable structured preview table with uncertainty badges and commit button.
    2. `Batch CSV Upload`: Drag-and-drop zone, sample CSV loader, preview table with per-row validation statuses, batch commit button.
    3. `Manual Order Entry`: Quick POS cashier order creation form with dynamic item add/remove rows.
* **Backend API Dependencies**:
  * `POST /api/v1/source-orders/extract` (calls server-side Gemini order extraction)
  * `POST /api/v1/source-orders/import-csv` (batch ingests CSV rows)
  * `POST /api/v1/source-orders` (creates manual source order)
* **User Interactions**: Paste WhatsApp chat text, trigger AI extraction, edit extracted items, toggle uncertainty flags, drag CSV file, submit manual order.
* **UI/UX Limitations in Current Implementation**:
  * All 3 complex workflows are crowded on a single page with tab switching.
  * Extracted preview table has small editing inputs.
* **Stitch Redesign Recommendations**:
  * Modern split layout for AI extraction: Left side = Raw Customer Message / Audio Transcript; Right side = Live Parsed Order Card with confidence indicators (`98% Match`).
  * CSV upload wizard with step-by-step progress: Upload → Schema Map → Validate → Ingest.

---

### PAGE 7: Product & SKU Catalog
* **Route Path**: `/catalog`
* **Source Component**: [ProductCatalogPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/ProductCatalogPage.tsx)
* **Implementation Status**: **EXISTING_PARTIAL** (Catalog viewing is functional; alias addition uses in-memory API fallback store)
* **Purpose**: Maintain the restaurant's canonical menu items, base prices, dietary flags, and platform-specific name aliases (e.g. mapping WhatsApp "paneer roll" to POS SKU `SKU-PAN-01`).
* **Authorized Roles**: `OWNER`, `MANAGER`
* **Current UI Components**:
  * Search input & Category filter (`ALL`, `ROLLS`, `CURRIES`, `BREADS`, `BEVERAGES`)
  * Product grid/table showing SKU, Name, Category, Dietary Badge, Base Price, and mapped channels
  * Item Details Drawer showing platform alias mappings (Zomato name, Swiggy name, WhatsApp aliases)
  * Add Alias input field
* **Backend API Dependencies**:
  * Uses frontend client catalog storage seeded from database `products` table.
* **User Interactions**: Search catalog, filter categories, click item to open alias management drawer, add new colloquial alias.
* **Stitch Redesign Recommendations**:
  * Visual cards for menu items with dietary icons (Green dot for Veg, Red dot for Non-Veg).
  * Collapsible platform price comparison pills (`POS: ₹240`, `Zomato: ₹260`, `Swiggy: ₹255`).

---

### PAGE 8: Tamper-Evident Audit History
* **Route Path**: `/audit`
* **Source Component**: [AuditHistoryPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/AuditHistoryPage.tsx)
* **Implementation Status**: **EXISTING_PARTIAL** (UI displays cryptographic HMAC status and diffs; relies on backend fallback store for audit listing)
* **Purpose**: Complete immutable audit trail of every material action (resolutions, overrides, merges, batch imports) with cryptographic HMAC-SHA256 checksums and actor accountability.
* **Authorized Roles**: `OWNER`, `MANAGER`
* **Current UI Components**:
  * Cryptographic Security Header (Tamper-evident status badge, Merkle root verification modal button)
  * Action Filter Tabs (`ALL`, `OVERRIDES`, `DUPLICATES`, `AUTO`, `CONFLICTS`)
  * Search bar (Audit ID, Target Order, Operator Name, Reason)
  * Audit Timeline / Table: Timestamp (UTC & Local), Action Badge, Target Record, Actor (User vs. System), Reason, Cryptographic Checksum
  * Expandable State Diff Viewer (Before vs. After JSON delta)
* **Backend API Dependencies**:
  * Frontend API client audit store matching backend `audit_events` schema.
* **User Interactions**: Filter by action type, search audit records, expand row to inspect state mutations, open Merkle proof verification dialog.
* **Stitch Redesign Recommendations**:
  * Clean timeline layout with vertical connectors.
  * Visual diff blocks (Red strikethrough for deleted state, Green for added state) rather than raw JSON snippets.

---

### PAGE 9: Settings & Integration Console
* **Route Path**: `/settings`
* **Source Component**: [SettingsPage.tsx](file:///c:/PakkaOrderAI/frontend/src/pages/SettingsPage.tsx)
* **Implementation Status**: **EXISTING_PARTIAL** (WhatsApp live status check is functional; threshold sliders update local config)
* **Purpose**: Configure restaurant profile, reconciliation thresholds, and inspect channel integration statuses (WhatsApp Cloud API, Petpooja POS, Zomato, Swiggy).
* **Authorized Roles**: `OWNER`
* **Current UI Components**:
  * Restaurant Profile Form (Legal Name, Display Name, GSTIN, Timezone, Currency)
  * Reconciliation Engine Guardrails:
    * Auto-merge Threshold Slider (0–100%)
    * Strict Quantity Mismatch Zero-Merge Lock (Hardcoded to ON)
    * Time Proximity Window Slider (seconds)
  * Channel Integration Status Cards:
    * WhatsApp Cloud API (Live webhook status, phone number ID, verify token)
    * POS Terminal (Petpooja terminal ID, sync interval)
    * Delivery Aggregators (Zomato merchant ID, Swiggy outlet ID)
  * Save Settings button
* **Backend API Dependencies**:
  * `GET /api/v1/channels/whatsapp/status`
* **User Interactions**: Adjust threshold sliders, inspect webhook verification status, submit settings form.
* **Stitch Redesign Recommendations**:
  * Grouped settings tabs: General Profile, Reconciliation Rules, Channels & Webhooks, Staff Roles.
  * Visual status badges for integrations: Green dot for `Active Webhook`, Amber dot for `Sandbox Mode`.

---

## 3. Justified Proposed / Recommended Pages

### RECOMMENDED PAGE 10: Public Website & Landing Page
* **Route Path**: `/landing` or public root `/`
* **Implementation Status**: **RECOMMENDED_NEW**
* **Purpose**: Commercial public-facing landing page explaining the core problem of multi-channel restaurant order chaos and presenting PakkaOrder AI's solution.
* **Target Audience**: Prospective restaurant owners, franchisees, cloud kitchen operators.
* **Key Sections Needed**:
  1. Top Navigation Bar (Logo, Features, How It Works, Problem, Interactive Demo CTA, Login button)
  2. Hero Section: Headline *"Many Channels. One Pakka Order."*, Subhead, Dual CTA (*"Explore Live Demo"* / *"Connect Your Outlets"*), Product screenshot preview.
  3. The Multi-Channel Problem: Visual comparison of order chaos across WhatsApp, Zomato, Swiggy, POS causing duplicate food preparation.
  4. Core Feature Grid: Heuristic Matching, Quantity Guardrails, Multilingual Gemini AI Extraction, Immutable HMAC Audit Trail.
  5. Interactive Conflict Resolution Walkthrough: Visual simulation showing a customer WhatsApp audio/chat modification matched against a Zomato ticket.
  6. Value Metrics: Zero Duplicate Prep, 100% Bill Accuracy, Instant Reconciled Master Orders.
  7. Footer: Product links, compliance disclaimers, documentation links.

---

### RECOMMENDED PAGE 11: Kitchen Display System (KDS / Live Master Orders)
* **Route Path**: `/kds`
* **Implementation Status**: **RECOMMENDED_NEW**
* **Purpose**: Dedicated high-contrast, distraction-free screen for kitchen and assembly staff showing **only verified, canonical master orders** with clear preparation notes and cooking statuses.
* **Target Audience**: Kitchen Staff, Station Chefs, Packing & Dispatch Operators.
* **Key Components**:
  * Ticket Cards categorized into columns: `New Verified` → `Preparing` → `Ready for Dispatch`.
  * Prominent Order Number & Elapsed Timer.
  * Clear dietary labels (Veg / Non-Veg / Jain).
  * Verified customer customization callout (e.g. *"Extra green chutney - WhatsApp verified"*).
  * 1-Click Status Advance button (`Mark Prepared`).

---

### RECOMMENDED PAGE 12: Authentication & Outlet Switcher Modal
* **Route Path**: `/login` (with outlet selection)
* **Implementation Status**: **RECOMMENDED_NEW**
* **Purpose**: Clean, professional authentication gateway supporting role-based logins and multi-outlet switching (e.g., switching between Indiranagar and Koramangala branches).
* **Target Audience**: All staff personas.
* **Key Components**:
  * Email / Employee ID & Password form.
  * Outlet selector dropdown.
  * Quick Demo Role Login buttons (`Login as Lead Ops`, `Login as Restaurant Owner`, `Login as Counter Staff`) for immediate evaluation.
