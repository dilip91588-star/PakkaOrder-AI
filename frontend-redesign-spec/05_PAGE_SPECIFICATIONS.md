# 05 — Page-by-Page Detailed UI & Functional Specifications

This document provides exhaustive, implementation-ready specifications for every screen in the redesigned PakkaOrder AI application for Google Stitch.

---

## Screen 1: Public Marketing Landing Page (`/landing`)

### A. Page Objective
Introduce restaurant owners, franchise operators, and cloud kitchen managers to PakkaOrder AI. Communicate the core value proposition (*Many Channels. One Pakka Order.*), visualize how cross-channel duplicate food waste is stopped, and provide a direct path into the live interactive demonstration.

### B. Layout Structure
* **Top Navigation Bar**: Fixed header with brand mark, navigation anchors (*Problem*, *How It Works*, *Features*, *Integrations*), and a right-aligned CTA (*"Open Operator Console"*).
* **Hero Section**: Centered high-impact headline, subhead, dual call-to-action buttons, and an interactive mockup preview showing an incoming WhatsApp modification matched against a Zomato ticket.
* **The Multi-Channel Problem Section**: 3-card comparison showing real-world confusion between chat orders, POS receipts, and delivery apps.
* **How It Works (3-Step Diagram)**:
  1. *Ingest*: Multi-channel webhooks & chat ingestion.
  2. *Reconcile*: Heuristic matching & Gemini AI signal explanation.
  3. *Verify*: One-click operator approval with strict quantity guardrails.
* **Interactive Conflict Walkthrough**: Interactive demo widget simulating a customer ordering 2 rolls on Zomato then texting *"bhaiya make it 3 rolls"* on WhatsApp.
* **Product Features Grid**: 4 feature blocks (Strict Quantity Protection, Multilingual Hinglish AI, Tamper-Evident Audit, Kitchen Order Accuracy).
* **Footer**: Clean corporate footer with copyright, privacy disclaimers, documentation links, and tech stack details.

### C. Components
`PublicNavbar`, `HeroSection`, `InteractiveOrderPreviewCard`, `FeatureCardGrid`, `ConflictSimulationWidget`, `Footer`.

### D. Displayed Information
* Headline: *"Many Channels. One Pakka Order."*
* Subhead: *"Stop kitchen duplicate prep and revenue leakage. Reconcile WhatsApp, Zomato, Swiggy, and POS orders with AI-assisted verification."*
* Sample Order Comparison Cards: Source A (Zomato #ZOM-8841: 2x Paneer Roll) vs. Source B (WhatsApp #WA-901: 3x Paneer Roll).

### E. User Interactions
* Click *"Launch Live Prototype"*: Navigates to `/` (Operational Dashboard).
* Click *"Simulate Conflict Resolution"*: Toggles sample duplicate states inside the interactive demo widget.
* Click nav links: Smooth-scroll to corresponding page sections.

### F. Functional Dependencies
Pure frontend presentation; deep-links directly into the authenticated console.

### G. UI States
* Default loaded marketing view. Fast initial paint, responsive images, clean vector Lucide icons.

### H. Responsive Behavior
* **Desktop (>1024px)**: Full side-by-side hero card with dual CTA.
* **Tablet (768px–1023px)**: Stacks hero preview underneath headline; 2-column feature grid.
* **Mobile (<768px)**: Collapsed mobile navigation drawer; single-column card stack; sticky *"Try Live Demo"* bottom button.

### I. Stitch Design Instructions
Generate a clean, light-themed marketing landing page with a `#FFFFFF` and `#F8FAFC` background. Use deep teal (`#0F766E`) for primary CTA buttons. In the hero preview card, show a crisp split card depicting a green WhatsApp chat bubble on the left and a red Zomato delivery slip on the right, with an illuminated teal arrow converging into a single master order card labeled *"CANONICAL ORDER #CAN-1042 — VERIFIED QUANTITY: 3"*.

---

## Screen 2: Operational Dashboard (`/`)

### A. Page Objective
Provide the restaurant manager or owner with an immediate high-level summary of the day's operations: how many raw orders were received, how many master canonical orders were produced, how many conflicts require human review, and overall deduplication efficiency.

### B. Layout Structure
* **Top Header**: Page title (*"Operations Dashboard"*), shift date pill (*"Today's Shift: 11:00 AM – Current"*), and quick action button (*"Review 4 Conflicts"*).
* **Top Banner**: Informative badge identifying the active outlet (*"Spice Garden - Indiranagar (TEN-001)"*).
* **KPI Metric Grid**: 4 cards across top row.
* **Middle Section (Split 2:1)**:
  * **Left (2 cols)**: High-Priority Review Queue Widget (Top pending duplicate pairs requiring immediate action).
  * **Right (1 col)**: Channel Ingestion Breakdown card (Percentage & volume from WhatsApp, Zomato, Swiggy, POS).
* **Bottom Section**: Recent Reconciliation Activity Feed (Last 5 automated and human actions).

### C. Components
`AppSidebar`, `TopNavbar`, `PageHeader`, `MetricCard`, `ConflictAlert`, `CandidateMiniCard`, `ChannelDistributionList`, `RecentActivityTimeline`.

### D. Displayed Information
1. **Metric 1**: *Source Orders Ingested* — `148` (`+14% vs yesterday`).
2. **Metric 2**: *Canonical Master Orders* — `136` (`12 duplicate orders prevented`).
3. **Metric 3**: *Pending Review Queue* — `4` (`2 Critical Quantity Mismatches`).
4. **Metric 4**: *Reconciliation Success Rate* — `91.8%` (`Zero automatic quantity overrides`).
5. **Channel Breakdown**: WhatsApp: `42 (28.4%)`, Zomato: `68 (45.9%)`, Swiggy: `38 (25.7%)`.

### E. User Interactions
* Click *"Review Conflicts"* button: Navigates to `/review`.
* Click any candidate card in the widget: Navigates directly to `/review/:id` for resolution.
* Click channel row: Filters orders list by that channel.

### F. Functional Dependencies
* `GET /api/v1/duplicate-candidates` (computes pending counts and active items)
* `GET /health` (verifies backend and database connectivity)

### G. UI States
* **Loading**: 4 pulsing skeleton cards and table placeholder.
* **Empty**: Celebratory empty state (*"All caught up! Zero pending order conflicts."*).
* **Error**: `ErrorBanner` with inline retry button.

### H. Responsive Behavior
* **Desktop**: 4-column KPI grid, 2-column split below.
* **Tablet**: 2x2 KPI grid, stacked middle panels.
* **Mobile**: Single-column vertical stack with touch-friendly tap targets.

### I. Stitch Design Instructions
Create a light, spacious dashboard canvas (`#F8FAFC`). Use white cards (`#FFFFFF`) with subtle `#E2E8F0` borders and `12px` border radius. The pending review counter should feature an amber warning pill (`bg-[#FEF3C7] text-[#D97706]`). In the candidate widget, emphasize the conflicting quantity with bold red monospace text (`Qty 2 vs 3`).

---

## Screen 3: Unified Orders Inbox (`/orders`)

### A. Page Objective
Allow counter and dispatch staff to view, filter, and inspect every order processed by the system. Operators can toggle between the **Canonical Master Orders** (the reconciled single source of truth dispatched to kitchen/customers) and the raw **Source Orders** (platform-specific incoming payloads).

### B. Layout Structure
* **Header**: Title (*"Orders Inbox"*), CSV Export button, and Dual View Toggle (*"Canonical Master Orders"* vs. *"Raw Platform Feeds"*).
* **Filter Bar**: Omni-search input (`⌘K`), Channel filter dropdown (`All`, `WhatsApp`, `Zomato`, `Swiggy`, `POS`), Status filter dropdown, and Date Range pill.
* **Main Data Table**: Expandable rows with high-contrast status and channel badges.
* **Expandable Row Drawer**: Displays order item line items, prices, dietary badges, and customer notes.
* **Raw Payload Modal**: Popover showing formatted JSON payload for technical audit.

### C. Components
`AppSidebar`, `TopNavbar`, `PageHeader`, `SegmentedViewToggle`, `SearchInput`, `FilterDropdown`, `OrderTable`, `OrderStatusBadge`, `ChannelBadge`, `ItemDetailDrawer`, `RawPayloadModal`, `Pagination`.

### D. Displayed Information
* Columns (Canonical View):
  * `Order Number` (e.g. `CAN-ORD-1042`)
  * `Intake Channels` (e.g. `[WhatsApp] + [POS]` badges)
  * `Customer Name & Phone` (`Aditya Nair • +91 98112 ****55`)
  * `Items Preview` (`2 items • Paneer Roll, Masala Chaas`)
  * `Total Amount` (`₹441.00`)
  * `Status` (`CANONICAL_CLEAN` or `MERGED_CANONICAL`)
  * `Time Elapsed` (`12m ago`)
  * `Actions` (`View Details` link, `Inspect Payload` code button)

### E. User Interactions
* Click row: Toggles item detail drawer.
* Click *"View Details"*: Navigates to `/orders/:id`.
* Click *"Inspect Payload"*: Opens raw JSON modal with 1-click copy.
* Type in search bar: Debounced live filtering across order numbers, customer names, and phone numbers.
* Click *"Export CSV"*: Generates browser download of current filtered dataset.

### F. Functional Dependencies
* `GET /api/v1/source-orders`
* `GET /api/v1/source-orders/:id`

### G. UI States
* **Loading**: 5-row table skeleton.
* **Empty**: Search empty state (*"No orders match your filter criteria"*).
* **Error**: Red alert banner with retry trigger.

### H. Responsive Behavior
* **Desktop**: Full 8-column data table.
* **Tablet**: Collapses items preview and time into secondary text; 5-column table.
* **Mobile**: Transforms into clean vertical card list with tap-to-expand details.

### I. Stitch Design Instructions
Design an ultra-clean SaaS data table inspired by Stripe. Table headers should be light gray (`#F8FAFC`) with uppercase 12px text (`#64748B`). Active rows on hover should shift to `#F8FAFC`. Use monospace font for order numbers (`CAN-ORD-1042`). Canonical merged orders should display stacked channel pills indicating multi-source origin.

---

## Screen 4: Order Detail & Provenance (`/orders/:id`)

### A. Page Objective
Provide a forensic view of a single order, displaying its entire journey from platform intake to master reconciliation, linked source records, customer delivery data, itemized pricing, and raw payload snippets.

### B. Layout Structure
* **Header**: Back link (*"← Back to Orders"*), Order ID heading, Status Badge, and Print Receipt button.
* **Top Grid (2 Columns)**:
  * **Left Column (Order Summary)**:
    * Customer & Delivery Card (Customer Name, Masked Phone, Delivery Address, Coordinates).
    * Financial Summary Card (Subtotal, GST Tax, Delivery Fee, Final Total).
  * **Right Column (Provenance & Linking)**:
    * Channel Origin Card (Platform logos, external IDs, intake timestamp).
    * Linked Source Orders Panel (Shows how many external platform feeds merged into this canonical record).
* **Bottom Panel**: Full Line Items Table with customization breakdown (e.g. *"Extra green chutney - No onions"*).
* **Security Drawer**: Idempotency key, HMAC correlation hash, and raw JSON snippet.

### C. Components
`PageHeader`, `Breadcrumbs`, `OrderStatusBadge`, `ChannelBadge`, `CustomerInfoCard`, `LineItemsTable`, `FinancialSummaryCard`, `ProvenanceTimeline`, `RawPayloadAccordion`.

### D. Displayed Information
* Customer details, exact address, platform reference IDs (e.g. `ZOM-8841`, `WA-901`), item SKUs, dietary flags, timestamp with time zone (`Asia/Kolkata`), correlation hash.

### E. User Interactions
* Click Back button: Returns to `/orders`.
* Click copy icon on IDs: Copies Order ID or external ID to clipboard with toast confirmation.
* Click *"Inspect Raw Payload"*: Expands syntax-highlighted JSON block.

### F. Functional Dependencies
* `GET /api/v1/source-orders/:id`

### G. UI States
* Loading skeleton, Error state if order ID is missing or not found.

### H. Responsive Behavior
* Stacks summary cards into a single column on tablet and mobile.

### I. Stitch Design Instructions
Generate a clean detail view with clear visual cards. Use a 2-column layout on desktop. Line items should have a clean tabular layout with Veg/Non-Veg indicators (green/red dot badges). Highlight the correlation hash inside a monospace code pill with a clipboard copy icon.

---

## Screen 5: Conflict Review Queue (`/review`)

### A. Page Objective
The central operational inbox for duplicate detection. Managers review suspected duplicate candidate pairs generated by the heuristic engine, prioritize urgent quantity conflicts, and navigate into side-by-side resolution.

### B. Layout Structure
* **Header**: Title (*"Conflict Review Queue"*), active pending counter pill (*"4 Pending"*), and CSV Export button.
* **Alert Strip**: Red highlight banner if critical quantity conflicts exist: *"2 Critical Quantity Conflicts require operator confirmation before kitchen prep."*
* **Filter Bar**:
  * Severity Tabs: `All (4)`, `Critical (2)`, `Warning (2)`, `Resolved History`.
  * Conflict Type Filter: `Quantity Mismatch`, `Modifier Variance`, `Duplicate Timestamps`.
  * Channel Filter: `WhatsApp`, `Zomato`, `Swiggy`, `POS`.
* **Queue Data Table**:
  * Candidate Pair ID (e.g. `CAN-8841`)
  * Severity Badge (`CRITICAL` vs `WARNING`)
  * Similarity Score Pill (`94% High Match`)
  * Source A Summary (Channel badge, customer name, total)
  * Source B Summary (Channel badge, customer name, total)
  * Conflict Summary (Exact discrepancy callout: *"Customer WhatsApp requested 3 Rolls vs Zomato 2 Rolls"*)
  * SLA Urgency Indicator (Time left before dispatch deadline)
  * Action button (*"Review & Resolve →"*)

### C. Components
`PageHeader`, `ConflictAlert`, `SeverityTabBar`, `ScorePill`, `ChannelBadge`, `ReviewQueueTable`, `SlaCountdownBadge`, `EmptyState`.

### D. Displayed Information
* Candidate Pair ID, Severity level, heuristic score breakdown, Source A and Source B summary, textual conflict description, SLA expiry time.

### E. User Interactions
* Click tab: Filters queue by severity.
* Filter by conflict type / channel.
* Click *"Review & Resolve"* or click row: Navigates to `/review/:id`.
* Export CSV: Downloads current queue report.

### F. Functional Dependencies
* `GET /api/v1/duplicate-candidates`

### G. UI States
* **Loading**: Pulsing table skeleton.
* **Empty**: Clean state with checkmark: *"All conflict queues are clear. Orders are reconciled."*
* **Error**: Standard error banner.

### H. Responsive Behavior
* Table shifts to structured candidate cards on tablet and mobile, keeping Source A and Source B vertically stacked.

### I. Stitch Design Instructions
Emphasize urgency without visual chaos. The `CRITICAL` severity badge must use light red (`bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]`). The heuristic score pill should be prominent in green or amber. Provide a clear primary teal button (`#0F766E`) reading *"Review & Resolve →"* on every active row.

---

## Screen 6: Side-by-Side Conflict Resolution Workspace (`/review/:id`)

### A. Page Objective
The core decision-making screen of PakkaOrder AI. Restaurant managers compare two conflicting order records side-by-side, inspect Gemini AI matching signals, select approved canonical quantities, and execute an atomic resolution action accompanied by a mandatory operator reason.

### B. Layout Structure
* **Top Header**: Back link (*"← Back to Review Queue"*), Candidate Pair ID (`CAN-8841`), Severity Badge, Heuristic Match Pill (`94%`), and SLA Timer.
* **AI Signal Panel**: Gemini AI explanation box outlining why the records matched and highlighting specific field variances.
* **Side-by-Side Comparison Workspace (Dual Column)**:
  * **Left Column (Source A - e.g. Zomato)**: Channel badge, platform ID, intake timestamp, customer name, phone, address, and line items table.
  * **Right Column (Source B - e.g. WhatsApp)**: Channel badge, platform ID, intake timestamp, customer name, phone, address, and line items table.
* **Central Conflict Spine**: Red visual callout connecting the conflicting items (e.g. `2x Paneer Tikka Roll` on Left vs. `3x Paneer Tikka Roll` on Right).
* **Canonical Quantity Selection (In Update Flows)**: Radio group or number stepper allowing the operator to select the final approved master quantity (`2` vs `3`).
* **Fixed Bottom Action Bar**:
  * Button 1 (Emerald): `Confirm Duplicate` *(Link without summing quantities - Rule #7)*
  * Button 2 (Blue): `Confirm Update` *(Approve customer change to 3 rolls)*
  * Button 3 (Slate): `Confirm Separate` *(Treat as two distinct orders)*
  * Button 4 (Ghost): `Keep Pending` *(Defer resolution)*
* **Mandatory Reason Modal (`VerificationModal`)**: Modal requiring operator rationale before writing to the database and HMAC audit trail.

### C. Components
`PageHeader`, `Breadcrumbs`, `SeverityBadge`, `ScorePill`, `AIInsightPanel`, `ConflictComparison`, `ChannelBadge`, `LineItemsTable`, `DiffSpine`, `ApprovalControls`, `VerificationModal`.

### D. Displayed Information
* Candidate Pair ID, detailed item breakdown for both sources, highlighted quantity variance, Gemini explanation text, SLA countdown, operator name.

### E. User Interactions
* Hover over conflicting fields to highlight corresponding source items.
* Select approved canonical quantity in update flows.
* Click any of the 4 resolution buttons: Opens `VerificationModal`.
* Select preset rationale chip (e.g. *"Customer confirmed via phone call"*) or type custom reason.
* Click *"Confirm & Record Resolution"*: Submits atomic resolution transaction to backend.

### F. Functional Dependencies
* `GET /api/v1/duplicate-candidates/:id`
* `GET /api/v1/duplicate-candidates/:id/explain` (Gemini matching explanation)
* `POST /api/v1/duplicate-candidates/:id/resolve` (Executes resolution transaction)

### G. UI States
* **Loading**: Dual-column skeleton comparison.
* **Resolution Submitting**: Spinner on modal submit button.
* **Success**: Green banner with link back to review queue: *"Resolution recorded with HMAC audit signature."*
* **Error**: Error banner displaying backend transaction rollback details.

### H. Responsive Behavior
* On screens under 1200px, switches from side-by-side columns to a tabbed toggle: `[View Zomato Order (Source A)]` | `[View WhatsApp Order (Source B)]`, with a sticky comparison summary card in between.

### I. Stitch Design Instructions
Generate a split-pane comparison layout. Left panel has a subtle red-tinted border if it contains outdated data; Right panel has a subtle blue-tinted border for the latest incoming change. The conflicting quantity row must be highlighted with a light red background (`#FEF2F2`) and an alert icon. The bottom action bar must be sticky and high-contrast, with clear explanatory microcopy underneath each button.

---

## Screen 7: Order Ingestion & AI Extraction Workbench (`/imports`)

### A. Page Objective
Provide a unified intake hub for importing orders into the engine through 3 distinct methods:
1. **Conversational AI Extraction**: Interprets informal customer WhatsApp messages or voice transcripts (multilingual English, Hindi, Hinglish).
2. **Multi-Channel CSV Batch Upload**: Bulk ingestion of aggregator settlement files with row-by-row validation.
3. **Manual Counter Entry**: Fast POS cashier intake form.

### B. Layout Structure
* **Header**: Title (*"Order Ingestion & AI Workbench"*), intake summary stats.
* **Intake Mode Tabs**: `Conversational AI (WhatsApp / Chat)` | `Batch CSV Upload` | `Manual POS Entry`.
* **Tab 1 — Conversational AI Layout (Split 1:1)**:
  * **Left Side**: Raw Message Input Box (textarea with sample button), Channel selector, Phone number input, *"Extract with Gemini"* action button.
  * **Right Side**: Live Parsed Order Preview card:
    * Extracted Customer Name, Phone, Delivery Address.
    * Line Items Table with editable quantity, SKU, and unit price inputs.
    * Uncertainty Badges (e.g. `⚠️ SKU Uncertain: 82% confidence`).
    * Human Confirmation Checkbox: *"I have verified this extracted order against the customer's intent."*
    * Primary Commit Button: *"Commit Verified Order into Engine"*.
* **Tab 2 — CSV Upload Layout**: Drag-and-drop file zone, *"Load Sample CSV"* button, preview table showing per-row validation status (`Valid`, `Warning`, `Fatal Error`), and *"Ingest Valid Rows"* button.
* **Tab 3 — Manual POS Layout**: Simple, fast line-item cashier form with item autocomplete, quantity steppers, and customer details.

### C. Components
`PageHeader`, `SegmentedViewToggle`, `MessageInputBox`, `AIInsightPanel`, `ExtractedItemRow`, `ConfidenceBadge`, `CsvDropzone`, `ValidationReportTable`, `ManualOrderForm`.

### D. Displayed Information
* Raw text input, extracted entities, SKU match confidence, uncertainty flags, CSV file name, row validation count (e.g. `3 Valid, 1 Error`), sample text chips.

### E. User Interactions
* Click *"Load Sample Chat"*: Populates textarea with typical Hinglish customer text (*"bhaiya 2 paneer roll aur 1 butter chicken bhej do..."*).
* Click *"Extract with Gemini"*: Calls backend AI service, displays animated extraction state.
* Edit extracted fields: Directly modifies item name, quantity, or address in the preview card.
* Toggle human confirmation checkbox.
* Click *"Commit Verified Order"*: Ingests record into `source_orders` table.

### F. Functional Dependencies
* `POST /api/v1/source-orders/extract` (server-side Gemini extraction)
* `POST /api/v1/source-orders/import-csv`
* `POST /api/v1/source-orders`

### G. UI States
* **AI Parsing**: Animated pulsing card with message: *"Gemini 3.1 Flash analyzing items, quantities, and addresses..."*
* **Commit Success**: Success toast showing generated Source Order ID (`SRC-XXXX`).
* **Error**: Red callout displaying extraction failure or CSV format errors.

### H. Responsive Behavior
* Stacks the raw message box and parsed preview card vertically on tablet and mobile.

### I. Stitch Design Instructions
Create a modern AI workbench screen. The left input box should resemble a sleek WhatsApp chat pane with a light gray border. The right preview card should feature a crisp white card with a subtle teal accent border (`#0F766E`) and a spark icon badge reading *"Gemini AI Structured Extraction"*. Extracted items with lower confidence should display an amber warning badge (`#D97706`).

---

## Screen 8: Product & SKU Catalog (`/catalog`)

### A. Page Objective
Manage the restaurant's canonical catalog of dishes, base prices, dietary attributes (Veg/Non-Veg), and platform-specific colloquial aliases (so the AI knows that *"paneer wrap"*, *"paneer kathi"*, and *"cottage cheese roll"* all map to SKU `SKU-PAN-01`).

### B. Layout Structure
* **Header**: Title (*"Product & SKU Catalog"*), total active items badge (`148 Active SKUs`), category filter pills (`All`, `Rolls`, `Curries`, `Breads`, `Beverages`).
* **Search & Action Bar**: Search bar (name, SKU, alias), Add Product button.
* **Catalog Grid / Table**:
  * SKU code (monospace)
  * Dish Name & Dietary Icon (Green square for Veg, Red triangle for Non-Veg)
  * Category badge
  * Base Price (`₹240.00`)
  * Platform Price Matrix (`POS: ₹240`, `Zomato: ₹260`, `Swiggy: ₹255`)
  * Active Aliases Count (e.g. `4 Aliases`)
  * Action button (*"Manage Aliases"*)
* **Slide-over Alias Drawer**:
  * Dish summary header.
  * Colloquial Alias Chips (with remove `×` icons).
  * Add New Alias input field with *"Add"* button.

### C. Components
`PageHeader`, `CategoryFilterPills`, `SearchInput`, `CatalogTable`, `DietaryBadge`, `PlatformPricePill`, `AliasDrawer`, `EmptyState`.

### D. Displayed Information
* SKU, dish name, category, base price, platform prices, list of colloquial aliases.

### E. User Interactions
* Search dishes, filter by category, click *"Manage Aliases"* to open drawer, type new colloquial alias and press enter, delete alias.

### F. Functional Dependencies
* Uses frontend catalog store matching backend `products` table.

### G. UI States
* Loading skeleton, empty state for zero search results, success toast on alias addition.

### H. Responsive Behavior
* Converts table to card grid on mobile with tap-to-open drawer.

### I. Stitch Design Instructions
Clean, accessible restaurant menu management view. The dietary indicator should be authentic to Indian restaurant standards: a clean green border with green dot for Veg, and red border with red dot for Non-Veg. Platform prices should appear inside subtle pill badges.

---

## Screen 9: Tamper-Evident Audit History (`/audit`)

### A. Page Objective
Provide an immutable, cryptographically verifiable ledger of every material system and user action. Ensures complete transparency for restaurant owners regarding who approved modifications, resolved duplicates, or altered orders.

### B. Layout Structure
* **Header**: Title (*"Audit History & Cryptographic Ledger"*), Cryptographic Verification Status Badge (*"HMAC-SHA256 Ledger: Tamper-Evident"*), and Verify Merkle Proof button.
* **Filter Bar**: Action filter tabs (`All`, `Operator Overrides`, `Duplicate Merges`, `Auto-Reconciled`, `Quantity Conflicts`), search bar, date range picker.
* **Audit Timeline / Ledger Table**:
  * Audit Record ID (`AUD-88219`)
  * Timestamp (Local Indian Standard Time & UTC hover)
  * Action Type Badge
  * Target Record Link (`CAN-ORD-1042`)
  * Actor Details (Avatar, Name, Role: `Pranav M. (Lead Ops)` vs. `System Engine`)
  * Operator Rationale / Justification
  * Cryptographic Checksum (Truncated HMAC hash with copy icon)
  * Expand Row button (inspect state mutation before/after diff)
* **Expandable State Mutation Diff**: Visual diff showing prior state vs. mutated state.

### C. Components
`PageHeader`, `SecurityBadge`, `ActionFilterTabs`, `SearchInput`, `AuditTable`, `ActorBadge`, `StateDiffViewer`, `MerkleProofModal`.

### D. Displayed Information
* Audit ID, timestamp, action type, target record, operator name/role, justification text, HMAC-SHA256 signature, state before/after diffs.

### E. User Interactions
* Filter actions, search by operator name or order ID, expand row to inspect state mutations, click HMAC hash to copy full signature, click *"Verify Merkle Proof"* to view verification dialog.

### F. Functional Dependencies
* Matches backend `audit_events` repository and schema.

### G. UI States
* Loading skeleton, Empty filter state, Merkle proof verified modal state.

### H. Responsive Behavior
* Table shifts to vertical timeline layout on mobile with collapsible diff drawers.

### I. Stitch Design Instructions
Design an executive-grade audit interface inspired by GitHub audit logs or Stripe events. Use monospace font for audit IDs and cryptographic signatures. Expanded diff rows should use standard diff coloring: light red background (`#FEF2F2`) for previous values and light green (`#F0FDF4`) for approved mutated values.

---

## Screen 10: Settings & Integration Console (`/settings`)

### A. Page Objective
Configure outlet profile details, fine-tune reconciliation engine parameters (similarity thresholds, temporal proximity windows), and monitor live health of external channel webhooks (WhatsApp Cloud API, Petpooja POS, Zomato, Swiggy).

### B. Layout Structure
* **Header**: Title (*"Console Settings"*), Outlet Selector, and Save Settings button.
* **Settings Navigation Tabs**: `Outlet Profile` | `Reconciliation Rules` | `Channels & Webhooks` | `Team & Roles`.
* **Tab 1 — Outlet Profile**: Forms for Legal Name, Display Name, Timezone (`Asia/Kolkata`), Currency (`INR`), GSTIN, Store Phone.
* **Tab 2 — Reconciliation Engine Rules**:
  * Auto-Merge Confidence Threshold Slider (`0%–100%`, default `95%`).
  * Strict Quantity Guardrail: Locked toggle permanently ON (*"Strict Zero Automatic Merge on Quantity Mismatch — Enforced by Rule #6"*).
  * Temporal Matching Window Slider (`60 seconds – 600 seconds`).
* **Tab 3 — Channel Integrations & Webhooks**:
  * **WhatsApp Business Platform**: Live status indicator (`Connected` / `Sandbox Active`), Webhook Callback URL, Verify Token, Phone Number ID.
  * **Petpooja POS Terminal**: Status badge, Terminal ID, Sync interval.
  * **Zomato Merchant Feed**: Merchant ID, integration status.
  * **Swiggy Merchant Feed**: Outlet ID, integration status.

### C. Components
`PageHeader`, `SettingsTabs`, `ProfileForm`, `RuleSliderControl`, `LockedRuleCard`, `ChannelStatusCard`, `SaveNotificationToast`.

### D. Displayed Information
* Outlet details, threshold numbers, temporal seconds, integration statuses, webhook verification codes.

### E. User Interactions
* Adjust slider controls, toggle options, click *"Save Settings"* to persist configuration, inspect WhatsApp webhook handshake status.

### F. Functional Dependencies
* `GET /api/v1/channels/whatsapp/status`

### G. UI States
* Loading skeleton, saving spinner, success toast (*"Settings updated successfully."*).

### H. Responsive Behavior
* 2-column settings grid collapses to single column on mobile.

### I. Stitch Design Instructions
Clean, accessible settings page. The locked quantity guardrail card should be highlighted in light blue (`#F0FDF4`) with a padlock icon and clear badge reading *"Enterprise Safety Rule Locked"*. Channel cards should feature platform logos and green pulsing status dots indicating active webhook connectivity.

---

## Screen 11: Kitchen Display System (KDS / Live Master Orders) (`/kds`)

### A. Page Objective
Dedicated, high-contrast, distraction-free screen designed for kitchen chefs and assembly line staff. **Displays only verified, canonical master orders** with real-time preparation timers, dietary indicators, and verified customer modifications.

### B. Layout Structure
* **Top Header**: KDS title (*"Live Kitchen Queue"*), active order count (`6 Active Tickets`), elapsed shift timer, sound alert toggle.
* **Kanban Column Board (3 Columns)**:
  1. **Column 1 — New Verified Tickets**: Orders just approved and verified by counter staff.
  2. **Column 2 — In Preparation (Cooking)**: Orders currently being cooked.
  3. **Column 3 — Ready for Packing / Dispatch**: Orders ready for rider handover.
* **Ticket Card Details**:
  * Order Number (`CAN-ORD-1042`) in large 24px bold text.
  * Intake channel indicator (`WhatsApp Verified`).
  * Elapsed timer (`7 mins ago`).
  * Itemized dishes with quantity multiplier (`3x Paneer Tikka Roll`).
  * Dietary icons (Veg / Non-Veg).
  * Customer special instruction banner (e.g. *"Extra green chutney - No onions"*).
  * Large touch-friendly advance button (`"Start Cooking →"` or `"Mark Ready →"`).

### C. Components
`KdsHeader`, `KdsColumn`, `KitchenOrderTicket`, `DietaryBadge`, `ElapsedTimer`, `AdvanceStatusButton`.

### D. Displayed Information
* Order number, elapsed minutes, dish names, quantities, dietary attributes, verified instructions.

### E. User Interactions
* Tap advance button: Moves ticket to next stage (`New` → `Preparing` → `Ready`).
* Tap ticket: Opens detailed modal if full recipe or customer notes are needed.

### F. Functional Dependencies
* Consumes reconciled `canonical_orders` filtered by active preparation status.

### G. UI States
* Empty column state (*"No tickets waiting in queue"*). Urgent timer highlight (turns amber after 10 mins, red after 15 mins).

### H. Responsive Behavior
* Designed primarily for tablet/touch monitors in landscape orientation (16:9). Scrolls horizontally if columns overflow.

### I. Stitch Design Instructions
Design a high-contrast kitchen ticket interface. Ticket background should be crisp white with large, readable black typography (`#0F766E` headings). Confirmed customer customizations should appear inside a highlighted yellow box (`#FEF3C7`) so kitchen staff never miss special dietary requests.

---

## Screen 12: Authentication & Outlet Switcher (`/login`)

### A. Page Objective
Clean, secure entry point for restaurant operators. Supports multi-outlet selection and role-based login, alongside quick 1-click demo role switcher buttons for evaluators.

### B. Layout Structure
* **Centered Card Layout**: Sleek card on `#F8FAFC` canvas.
* **Top Brand Mark**: PakkaOrder AI logo and tagline (*Many Channels. One Pakka Order.*).
* **Outlet Selector**: Dropdown to select restaurant branch (*Spice Garden - Indiranagar* vs. *Spice Garden - Koramangala*).
* **Form Inputs**: Work Email / Employee ID and Password.
* **Demo Quick-Login Bar (For Evaluators)**:
  * Quick-chip 1: `Login as Restaurant Owner`
  * Quick-chip 2: `Login as Lead Ops Manager`
  * Quick-chip 3: `Login as Counter Cashier`
* **Submit Button**: Teal button (*"Sign In to Console"*).

### C. Components
`AuthCard`, `OutletDropdown`, `FormInput`, `QuickRoleChips`, `PrimaryButton`.

### D. Displayed Information
* Product brand mark, outlet names, input labels, role names.

### E. User Interactions
* Select outlet, fill credentials or click quick-role chip, submit form to navigate to `/`.

### F. Functional Dependencies
* Sets active role and tenant context in frontend state.

### G. Responsive Behavior
* Responsive centered card adjusting to mobile screen widths.

### H. Stitch Design Instructions
Minimalist, high-trust authentication card inspired by Linear or Supabase. White card with subtle `#E2E8F0` border, deep teal button, and clean quick-role selection chips below.
