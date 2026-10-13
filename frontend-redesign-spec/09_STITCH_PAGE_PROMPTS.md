# 09 — Google Stitch Page-by-Page Generation Prompts

This document provides individual, copy-pasteable prompts for **Google Stitch** to generate each screen consistently. Every prompt incorporates the exact layout, color tokens, typography, component requirements, and data fields specified in the master design system.

---

## PROMPT 1: Public Marketing Landing Page (`/landing`)

```text
Design a modern, light-theme B2B SaaS landing page for "PakkaOrder AI", an omnichannel restaurant order reconciliation platform with the tagline "Many Channels. One Pakka Order."

Aesthetic & Colors:
- Background: Pure white (#FFFFFF) with subtle cool gray sections (#F8FAFC).
- Primary Brand: Deep Teal (#0F766E) with light teal accents (#CCFBF1).
- Typography: Inter for headings and body; JetBrains Mono for order numbers and metrics.
- Style: Inspired by Linear and Stripe. Minimalist, clean, with 1px subtle borders (#E2E8F0) and restrained shadows.

Key Sections to Generate:
1. Top Navbar: Logo mark ("P" in a rounded teal square) + "PakkaOrder AI", navigation links (Problem, How It Works, Features, Tech Specs), and a right-side primary button "Open Live Demo".
2. Hero Section:
   - Centered badge: "AI Order Truth & Reconciliation Engine".
   - Main headline: "Many Channels. One Pakka Order."
   - Subtitle: "Stop duplicate kitchen preparation, unbilled customer modifications, and revenue leakage across WhatsApp, Zomato, Swiggy, and POS."
   - Dual Call-to-Action: "Launch Interactive Prototype" (solid teal button) and "View Documentation" (outline button).
   - Hero Mockup Preview: A clean, split card showing a green WhatsApp chat order bubble ("bhaiya make it 3 rolls") on the left and a red Zomato delivery slip ("Qty: 2 Rolls") on the right, merging into a single verified master order card in the center: "CANONICAL ORDER #CAN-1042 — VERIFIED QUANTITY: 3".
3. The Problem Section: 3 high-contrast cards highlighting (1) Cross-channel duplicate prep, (2) WhatsApp voice/text confusion, and (3) Inaccurate aggregator settlements.
4. How It Works (3 Steps): (1) Ingest multi-channel webhooks, (2) Heuristic matching & Gemini signal extraction, (3) 1-click human verification with strict quantity guardrails.
5. Interactive Conflict Demo Card: A simulation showing a flagged quantity conflict with buttons to simulate operator approval.
6. Footer: Brand copyright, documentation links, and enterprise compliance badges (HMAC Tamper-Evident Ledger, Zero Automated Overwrites).
```

---

## PROMPT 2: Operational Dashboard (`/`)

```text
Design an executive operational dashboard for "PakkaOrder AI" (Route: /) in a crisp, light-themed SaaS style.

Canvas & Tokens:
- Canvas: #F8FAFC. Card surfaces: #FFFFFF with 1px borders in #E2E8F0 and 12px rounded corners.
- Primary Accent: Deep Teal (#0F766E). Alert colors: Amber (#D97706) and Red (#DC2626).
- Typography: Inter body; tabular monospace for numbers.

Layout Structure:
1. AppShell Layout:
   - Left Sidebar (256px): Outlet switcher ("Spice Garden - Indiranagar"), Operations links (Overview, Orders [148], Review Queue [4], Ingestion & AI, Kitchen Display), Management links (Product Catalog, Audit History, Settings), and an engine health badge ("🟢 MySQL 8.0 & Gemini Active").
   - Top Header (56px): Omni-search bar (⌘K), "Sync Channels" button with refresh icon, notification bell with unread indicator, and user profile avatar ("Pranav M. - Lead Ops").
2. Page Header:
   - Title: "Operations Overview" with subtitle "Real-time multi-channel reconciliation and conflict triage."
   - Shift Badge: "Today's Shift: 11:00 AM – 11:00 PM (Active)".
   - Top CTA: Solid teal button reading "Review 4 Pending Conflicts →".
3. 4 Top Metric Cards (Grid of 4):
   - Card 1: "Source Orders Ingested" -> 148 (+14% today). Subtitle: "WhatsApp: 42 • Zomato: 68 • Swiggy: 38".
   - Card 2: "Canonical Master Orders" -> 136. Green pill: "91.8% Reconciled" (12 duplicate losses prevented).
   - Card 3: "Pending Review Queue" -> 4. Amber alert pill: "2 Critical Quantity Conflicts".
   - Card 4: "Reconciliation Invariant" -> 100% Rule Compliance (Zero automated overrides).
4. Middle Section (2:1 Split):
   - Left Panel (2/3): "High-Priority Review Queue" widget showing top 3 candidate pairs (Pair CAN-8841: Qty 2 vs 3, SLA 12m left; Pair CAN-8839: Modifier variance). Each row has a "Resolve →" button.
   - Right Panel (1/3): "Channel Distribution" breakdown card showing progress bars for Zomato (45.9%), WhatsApp (28.4%), Swiggy (25.7%).
5. Bottom Section: "Recent Activity Ledger" showing the last 4 audit entries with timestamps and operator names.
```

---

## PROMPT 3: Unified Orders Inbox (`/orders`)

```text
Design a high-density, professional Orders Inbox screen for "PakkaOrder AI" (Route: /orders).

Aesthetic & Tokens:
- Canvas: #F8FAFC. Surface: #FFFFFF with crisp 1px borders in #E2E8F0.
- Typography: Inter body with JetBrains Mono for Order IDs, amounts, and phone numbers.
- Badges: WhatsApp (green #DCFCE7), Zomato (red #FEE2E2), Swiggy (orange #FFEDD5), POS (indigo #EEF2FF).

Key Layout & UI Elements:
1. Page Header:
   - Title: "Unified Orders Inbox" with subtitle "148 total records processed today."
   - Segmented Dual View Toggle (Pill style): "Canonical Master Orders (136)" vs "Raw Platform Feeds (148)".
   - Action: "Export CSV" button.
2. Filter & Search Bar:
   - Search input with search icon: "Search by Order ID, Customer, Phone, or Dish... (⌘K)".
   - Channel filter pills: "All Channels", "WhatsApp", "Zomato", "Swiggy", "POS".
   - Status dropdown: "All Statuses", "Canonical Clean", "Merged Canonical", "Conflict Review".
3. Main Data Table:
   - Header Row: Background #F8FAFC, text #64748B, uppercase 12px. Columns: Order Number, Channels, Customer, Items Summary, Total Amount, Status, Time, Actions.
   - Sample Rows:
     * Row 1: CAN-ORD-1042 | [WhatsApp] + [POS] badges | Aditya Nair (+91 98112 ****55) | 2 items (Paneer Roll, Chaas) | ₹441.00 | Status: "MERGED_CANONICAL" (indigo pill) | 12m ago | "View Details" + "Inspect JSON" buttons.
     * Row 2: CAN-ORD-1041 | [Zomato] badge | Rahul Verma (+91 98765 ****22) | 1 item (Butter Chicken) | ₹380.00 | Status: "CANONICAL_CLEAN" (green pill) | 24m ago.
4. Expandable Row Drawer (Shown on click):
   - Expands underneath Row 1 showing itemized table: Dish name, SKU, Quantity, Unit Price, and dietary badges (green square for Veg, red triangle for Non-Veg).
5. Raw Payload Modal (Triggered via "Inspect JSON"):
   - Popover showing syntax-highlighted raw JSON payload with 1-click "Copy JSON" button.
```

---

## PROMPT 4: Order Detail & Provenance (`/orders/:id`)

```text
Design an in-depth Order Detail and Provenance screen for "PakkaOrder AI" (Route: /orders/:id).

Aesthetic:
- Minimalist, forensic SaaS layout with high data clarity.
- Background: #F8FAFC. Cards: #FFFFFF with #E2E8F0 borders.

Layout Elements:
1. Header Bar:
   - Back button: "← Back to Orders Inbox".
   - Title: "Canonical Order #CAN-ORD-1042" with Status Badge "MERGED_CANONICAL" and intake time "Today, 11:55 AM IST".
   - Action: "Print Kitchen Slip" outline button.
2. Two-Column Top Grid:
   - Left Column (Customer & Delivery):
     * Customer Name: Aditya Nair.
     * Masked Phone: +91 98112 ****55 (with reveal button).
     * Delivery Address: HAL 2nd Stage, Indiranagar, Bangalore (Coordinates: 12.9716° N, 77.6412° E).
     * Financial Card: Subtotal ₹420.00, GST (5%) ₹21.00, Delivery Fee ₹0.00, Total Amount ₹441.00 (large bold mono font).
   - Right Column (Multi-Channel Linkage & Provenance):
     * Visual Linkage Tree: Shows two incoming feeds converging into this order:
       - Feed 1: [WhatsApp #WA-901] (Received 11:50 AM)
       - Feed 2: [In-Store POS #POS-4412] (Received 11:55 AM)
     * Correlation Hash: Monospace pill "sha256_b4f9...18d2" with copy icon.
     * Idempotency Key: "WA_10492817281_901".
3. Bottom Line Items Table:
   - Full tabular breakdown: Item Name, SKU Code, Quantity, Unit Price, Subtotal, Dietary indicator, and Customer Customizations ("Extra green chutney, less spicy").
4. Expandable Technical Drawer: Raw platform JSON snippet for backend verification.
```

---

## PROMPT 5: Conflict Review Queue (`/review`)

```text
Design the Conflict Review Queue workbench for "PakkaOrder AI" (Route: /review).

Aesthetic:
- Crisp light SaaS theme. Clean, urgent, operational.
- Accentuate critical quantity mismatches in light red (#FEF2F2) and amber (#FFFBEB).

Layout Elements:
1. Page Header:
   - Title: "Conflict Review Queue" with subtitle "Review suspected cross-channel duplicates and conflicting customer revisions."
   - Active Counter: Amber pill reading "4 Pending Reviews".
   - Action: "Export Queue CSV" button.
2. Alert Strip (High Visibility):
   - Red callout box with AlertTriangle icon: "2 Critical Quantity Conflicts require operator confirmation. Kitchen preparation is currently held to prevent food waste."
3. Filter & Tab Bar:
   - Tabs: "All (4)", "Critical Severity (2)", "Warning Severity (2)", "Resolved History (18)".
   - Dropdown filter: Conflict Type ("All", "Quantity Mismatch", "Modifier Variance", "Duplicate Timestamps").
   - Dropdown filter: Channel ("All", "WhatsApp", "Zomato", "Swiggy").
4. Candidate Queue Table:
   - Columns: Candidate Pair ID, Severity, Similarity Score, Source A (Primary), Source B (Revision), Conflict Summary, SLA Countdown, Action.
   - Row 1 (Critical):
     * ID: CAN-8841 (mono font).
     * Severity: Red badge "CRITICAL".
     * Score: Green pill "94% High Match".
     * Source A: [Zomato] #ZOM-8841 (Rohan Gupta, ₹520).
     * Source B: [WhatsApp] #WA-901 (Rohan Gupta, ₹760).
     * Conflict Summary: "Customer WhatsApp requested 3 Paneer Rolls vs Zomato 2 Paneer Rolls (Material Quantity Variance)".
     * SLA: Urgent red countdown "12m 40s remaining".
     * Action: Primary teal button "Review & Resolve →".
   - Row 2 (Warning):
     * ID: CAN-8839 | Severity: "WARNING" | Score: "88%" | Source A: [Swiggy] | Source B: [WhatsApp] | Conflict: "Modifier variance: Extra Cheese requested via chat" | SLA: "28m left" | Action: "Review & Resolve →".
```

---

## PROMPT 6: Side-by-Side Conflict Resolution Workspace (`/review/:id`)

```text
Design the core Side-by-Side Conflict Resolution Workspace for "PakkaOrder AI" (Route: /review/:id).

Aesthetic & Tone:
- Split-screen comparison interface. Calm, forensic, and decisive.
- Left column (Source A) vs Right column (Source B), with a central "Diff Spine".
- Fixed bottom action bar with high-contrast safety buttons.

Layout Structure:
1. Header Bar:
   - Back button: "← Back to Review Queue".
   - Title: "Candidate Pair #CAN-8841" with Severity Badge "CRITICAL QUANTITY MISMATCH" and Score Pill "94% Match".
   - Operator attribution: "Assigned: Pranav M. (Lead Ops)".
2. Gemini AI Insight Panel:
   - Full-width card with subtle teal border and spark icon:
     "Gemini Matching Explanation: High-confidence match (94%). Customer Rohan Gupta ordered 2 Paneer Tikka Rolls via Zomato at 12:04 PM. At 12:09 PM, the same customer texted via WhatsApp from +91 98765 00111: 'make it 3 rolls'. Address matches 100%. This is a customer-initiated quantity revision."
3. Side-by-Side Comparison Workspace:
   - Left Panel (Source A — Zomato):
     * Header: [Zomato Logo] Zomato Order #ZOM-8841 • Received 12:04 PM.
     * Customer: Rohan Gupta • Indiranagar 100ft Rd.
     * Line Items: 2x Paneer Tikka Roll @ ₹240 = ₹480 | 1x Masala Chaas @ ₹40 = ₹40. Total: ₹520.
   - Right Panel (Source B — WhatsApp):
     * Header: [WhatsApp Logo] WhatsApp Message #WA-901 • Received 12:09 PM.
     * Customer: Rohan Gupta • Indiranagar 100ft Rd.
     * Line Items: 3x Paneer Tikka Roll @ ₹240 = ₹720 | 1x Masala Chaas @ ₹40 = ₹40. Total: ₹760.
   - Central Conflict Spine:
     * Red connecting line highlighting the quantity contradiction: "Variance: +1 Roll (₹240 discrepancy)".
4. Canonical Quantity Selector (Update Mode):
   - Radio selector card: "Select Approved Canonical Quantity: ( ) 2 Rolls [Zomato Original]  (*) 3 Rolls [WhatsApp Customer Revision]".
5. Fixed Bottom Action Bar:
   - Button 1 (Emerald #16A34A): "Confirm Duplicate" (Tooltip: Links records without summing quantities).
   - Button 2 (Blue #2563EB): "Confirm Update" (Tooltip: Approves customer change to 3 rolls).
   - Button 3 (Slate #64748B): "Confirm Separate" (Tooltip: Keeps as two distinct independent orders).
   - Button 4 (Ghost): "Keep Pending" (Tooltip: Defer resolution).
6. Mandatory Reason Modal:
   - Dialog overlay with preset quick chips ("Customer confirmed via phone call", "WhatsApp revision approved", "Rider canceled previous order") + freeform justification textarea + "Sign & Commit Resolution" button.
```

---

## PROMPT 7: Ingestion & AI Extraction Workbench (`/imports`)

```text
Design the multi-channel Order Ingestion & AI Extraction Workbench for "PakkaOrder AI" (Route: /imports).

Aesthetic:
- Crisp light SaaS workbench.
- Left side = Raw customer chat/audio input; Right side = Live parsed order preview.

Layout Structure:
1. Page Header:
   - Title: "Order Ingestion & AI Workbench" with subtitle "Ingest orders via Multilingual AI extraction, batch CSV settlements, or manual POS entry."
   - Segmented Tabs: "Conversational AI (WhatsApp / Voice)" | "Batch CSV Upload" | "Manual POS Cashier Entry".
2. Tab 1: Conversational AI View (Split 1:1):
   - Left Panel (Raw Message Intake):
     * Channel Selector dropdown: "WhatsApp Business".
     * Phone number input: "+91 98765 43210".
     * Message Textarea: Pre-populated with Hinglish text: "bhaiya 2 paneer roll aur 1 butter chicken bhej do jaldi prestige ozone indiranagar flat 402 me. payment gpay kardoonga. extra green chutney chahiye".
     * Quick Button: "Load Sample Hinglish Chat".
     * Primary Action: Solid teal button with Sparkles icon: "Extract with Gemini AI →".
   - Right Panel (Live Parsed Order Card):
     * Card Header: "Gemini Structured Output" with Model pill "gemini-3.1-flash".
     * Parsed Customer: "Customer (Prestige Ozone)" • Address: "Prestige Ozone, Indiranagar, Flat 402".
     * Extracted Items Table:
       - Row 1: Paneer Tikka Roll | SKU-PAN-01 | Qty: 2 | ₹240 | Match: 98% (green pill).
       - Row 2: Butter Chicken (Boneless) | SKU-CHK-02 | Qty: 1 | ₹380 | Match: 95% (green pill).
     * Customization note: "Extra green chutney, GPay payment".
     * Human Verification Checkbox: "[✓] I have verified this extracted order against the customer's intent."
     * Commit Action: Solid teal button: "Commit Verified Order into Engine".
3. Tab 2: Batch CSV Upload View (Available on tab switch):
   - Drag-and-drop file upload zone for CSV files with sample download link, and a preview table showing row-by-row validation status (Valid vs Errors).
```

---

## PROMPT 8: Product & SKU Catalog (`/catalog`)

```text
Design the Product & SKU Catalog management screen for "PakkaOrder AI" (Route: /catalog).

Aesthetic:
- Clean restaurant catalog view. Indian food service standards (authentic Veg/Non-Veg indicators).

Layout Structure:
1. Page Header:
   - Title: "Product & SKU Catalog" with badge "148 Active SKUs".
   - Category Filter Pills: "All (148)", "Rolls (32)", "Curries (24)", "Breads (18)", "Beverages (14)".
   - Action: Solid teal button "+ Add New Product".
2. Search Bar:
   - "Search dishes by name, SKU, or colloquial alias...".
3. Catalog Table:
   - Header Row: SKU, Dish Name, Dietary, Category, Base Price, Platform Matrix, Aliases, Actions.
   - Sample Rows:
     * SKU-PAN-01 | Paneer Tikka Roll | Green Square (Veg) | Rolls | ₹240.00 | POS: ₹240 • Zomato: ₹260 • Swiggy: ₹255 | 4 Aliases | "Manage Aliases →" button.
     * SKU-CHK-02 | Butter Chicken (Boneless) | Red Triangle (Non-Veg) | Curries | ₹380.00 | POS: ₹380 • Zomato: ₹410 • Swiggy: ₹399 | 3 Aliases | "Manage Aliases →" button.
4. Slide-over Alias Drawer (Opens on clicking "Manage Aliases"):
   - Drawer Title: "Manage Colloquial Aliases for Paneer Tikka Roll (SKU-PAN-01)".
   - Explanatory Subtitle: "These colloquial phrases help Gemini map informal customer chat orders to this canonical SKU."
   - Existing Alias Chips: "paneer roll" (×), "paneer wrap" (×), "cottage cheese roll" (×), "paneer kathi" (×).
   - Add Alias Form: Input field "Type colloquial alias..." + "Add Alias" button.
```

---

## PROMPT 9: Tamper-Evident Audit History (`/audit`)

```text
Design the Tamper-Evident Audit History screen for "PakkaOrder AI" (Route: /audit).

Aesthetic:
- Forensic, cryptographic enterprise ledger style inspired by Stripe Events and GitHub Audit Log.
- High trust, clean typography, monospace hash indicators.

Layout Structure:
1. Page Header:
   - Title: "Tamper-Evident Audit History" with subtitle "Cryptographic ledger of all automated and human order modifications."
   - Cryptographic Status Pill: Green shield icon + "HMAC-SHA256 Ledger: Cryptographically Verified".
   - Action: Outline button "Verify Merkle Tree Proof".
2. Filter & Search:
   - Action Tabs: "All Actions", "Operator Overrides", "Duplicate Merges", "Auto-Reconciled", "Quantity Conflicts".
   - Search bar: "Search audit entries by ID, Operator, Order Number, or Reason...".
3. Audit Ledger Table:
   - Columns: Audit ID, Timestamp (IST), Action Type, Target Record, Actor, Justification, Checksum.
   - Sample Row 1:
     * ID: AUD-88219 (mono).
     * Time: Today, 12:12 PM IST.
     * Action: Blue badge "OPERATOR_OVERRIDE_CONFIRMED".
     * Target: Link "CAN-ORD-1042".
     * Actor: User icon "Pranav M. (Lead Ops)".
     * Justification: "Customer verified on WhatsApp chat to update quantity from 2 to 3 rolls."
     * Checksum: Monospace truncated pill "hmac_e8f3...a9b1" with copy icon.
     * Expander icon to reveal Before vs After diff.
4. Expanded State Mutation Diff View:
   - Side-by-side diff: Left = Previous State (Quantity: 2 in light red #FEF2F2); Right = Mutated State (Quantity: 3 in light green #F0FDF4).
```

---

## PROMPT 10: Console Settings (`/settings`)

```text
Design the Console Settings screen for "PakkaOrder AI" (Route: /settings).

Aesthetic:
- Crisp SaaS settings view with clean tabbed navigation and clear grouping.

Layout Structure:
1. Page Header:
   - Title: "Console Settings" with subtitle "Configure restaurant profile, reconciliation thresholds, and external channels."
   - Action: Solid teal button "Save Changes".
2. Settings Tab Navigation:
   - "Outlet Profile" | "Reconciliation Rules" | "Channels & Webhooks" | "Staff & Access".
3. Tab Content — Reconciliation Rules & Channels (Combined View):
   - Section 1: Reconciliation Engine Thresholds:
     * Slider 1: "Auto-Merge Confidence Threshold" -> 95% (with explanation: "Orders with score ≥ 95% and zero conflicts can be merged automatically").
     * Locked Safety Card: Highlighted light blue card with padlock icon: "Strict Quantity Mismatch Zero-Merge Guardrail — Permanently Locked ON (Rule #6: Quantity differences always trigger human review)."
     * Slider 2: "Temporal Proximity Window" -> 60 seconds.
   - Section 2: Channel Integrations & Webhooks:
     * Card 1: WhatsApp Business Cloud API -> Status: Green dot "Sandbox Active" | Webhook URL: https://api.pakkaorder.ai/webhooks/whatsapp | Verify Token: pakka_wa_verify_token_dev | Phone Number ID: 10492817281.
     * Card 2: Petpooja POS Terminal -> Status: Green dot "Connected" | Terminal ID: TERM-IND-01.
     * Card 3: Zomato Merchant API -> Status: Green dot "Connected" | Merchant ID: ZOM-99214.
     * Card 4: Swiggy Merchant API -> Status: Green dot "Connected" | Outlet ID: SWG-88120.
```

---

## PROMPT 11: Kitchen Display System (`/kds`)

```text
Design a touch-optimized Kitchen Display System (KDS) screen for "PakkaOrder AI" (Route: /kds).

Aesthetic & Purpose:
- High-contrast, clean, distraction-free board designed for kitchen chefs and station packing staff.
- Displays ONLY verified canonical master orders.

Layout Elements:
1. Header Bar:
   - Left: Brand mark + "Live Kitchen Assembly Queue".
   - Middle: Shift order count "6 Active Tickets in Prep" + Elapsed shift timer.
   - Right: Sound alert toggle + Fullscreen button.
2. 3-Column Kanban Board:
   - Column 1: "Queued (2)" — Newly verified orders.
   - Column 2: "In Preparation (3)" — Currently cooking.
   - Column 3: "Ready for Dispatch (1)" — Plated and ready for rider handover.
3. Ticket Card Design (Large touch cards):
   - Top: Order Number in bold 24px mono text: "CAN-ORD-1042".
   - Channel provenance: Green pill "WhatsApp Verified".
   - Elapsed Timer: "7 mins elapsed" (turns amber at 10m, red at 15m).
   - Items List:
     * 3x Paneer Tikka Roll [Green Veg Square]
     * 1x Masala Chaas [Green Veg Square]
   - Special Customer Instructions (Yellow callout box #FEF3C7): "Extra green chutney - No onions".
   - Large Touch Advance Button at bottom: "Start Cooking →" (moves to Column 2) or "Mark Ready →" (moves to Column 3).
```

---

## PROMPT 12: Authentication & Outlet Switcher (`/login`)

```text
Design a minimal, high-trust Authentication and Outlet Switcher screen for "PakkaOrder AI" (Route: /login).

Aesthetic:
- Canvas: #F8FAFC. Card: #FFFFFF with subtle #E2E8F0 border and shadow-sm.
- Minimalist, centered SaaS login inspired by Linear and Supabase.

Layout Elements:
1. Centered Card Container (440px width):
   - Brand Header: Teal "P" logo mark + "PakkaOrder AI".
   - Tagline: "Many Channels. One Pakka Order."
2. Outlet Selector Dropdown:
   - Label: "Select Restaurant Outlet".
   - Options: "Spice Garden - Indiranagar (TEN-001)" [Default] | "Spice Garden - Koramangala (TEN-002)".
3. Credentials Form:
   - Email / Operator ID input: "ops@spicegarden.com".
   - Password input with toggle visibility icon.
   - "Remember outlet on this terminal" checkbox.
   - Primary button: Deep Teal (#0F766E) reading "Sign In to Console →".
4. Evaluator Quick Demo Roles Bar (Bottom of card):
   - Label: "Or explore as demo persona:"
   - 3 Quick Chips:
     * [👔 Restaurant Owner]
     * [⚡ Lead Operations Manager]
     * [ cashier Counter Cashier]
```
