# 08 — Google Stitch Master Design Brief

This document is a comprehensive, copy-ready master brief designed specifically for **Google Stitch** (or an AI design system generator). It encapsulates the complete product context, visual design guidelines, component hierarchy, and screen inventory needed to generate the modern, light-theme PakkaOrder AI frontend.

---

```markdown
# PRODUCT BRIEF FOR GOOGLE STITCH: PAKKAORDER AI

## 1. Product Identity & Essence
- Product Name: PakkaOrder AI (Powered by OrderTruth AI)
- Tagline: Many Channels. One Pakka Order.
- Archetype: B2B Omnichannel Restaurant Order Reconciliation & Conflict Resolution SaaS
- Brand Promise: Reconcile chaotic restaurant orders arriving simultaneously from WhatsApp, phone transcripts, Zomato, Swiggy, and POS systems into a single verified master order.
- Core Non-Negotiable Invariant: Never automatically merge orders or overwrite quantities solely on high similarity scores. A quantity difference is a material conflict requiring human review and approval.

## 2. Target Users & Tone of Voice
- Primary Audience: Restaurant owners, operations managers, cloud kitchen dispatchers, and counter cashiers.
- Visual Tone: Crisp, minimal, highly readable, calm, and trustworthy.
- Aesthetic References: Linear, Stripe Dashboard, Notion, high-density modern SaaS tools.
- Strict Constraints:
  * No muddy dark backgrounds or dark-slate developer themes.
  * No excessive gradients, glassmorphism, or neon glowing elements.
  * No cartoonish robot illustrations for AI features.
  * Ultra-clear contrast, readable tabular numbers, and distinctive status badges.

## 3. Light-Theme Design System Tokens
- Canvas / Background: #F8FAFC
- Card & Panel Surfaces: #FFFFFF
- Secondary Subtle Surfaces: #F1F5F9
- Borders & Dividers: 1px solid #E2E8F0
- Primary Text: #0F172A (Inter font, AAA accessible contrast)
- Secondary Text: #64748B
- Primary Brand Color: #0F766E (Deep Teal)
- Primary Brand Hover: #115E59
- Light Brand Accent: #CCFBF1 (Pill backgrounds, highlight rings)
- Success State: #16A34A (Background: #F0FDF4, Border: #86EFAC)
- Warning State: #D97706 (Background: #FFFBEB, Border: #FCD34D)
- Critical Conflict State: #DC2626 (Background: #FEF2F2, Border: #FCA5A5)
- Monospace Data Font: JetBrains Mono (Strictly for Order Numbers, Currency, Hashes, and Idempotency Keys)

## 4. Required Navigation Structure
- Global AppShell:
  * Left Sidebar (w-64): Brand logo ('P' in deep teal badge), Outlet switcher ('Spice Garden - Indiranagar'), Operations Nav (Overview, Orders, Review Queue, Ingestion & AI, Kitchen Display), Management Nav (Product Catalog, Audit History, Settings), Engine Health pill, User Profile card.
  * Top Navbar (h-14): Omni-search bar with ⌘K badge, 'Sync Channels' button, Notification bell with alert indicator, Outlet profile avatar.

## 5. Complete Screen Inventory to Generate
1. Screen 1: Public Marketing Landing Page (/landing)
   - Modern hero section with headline 'Many Channels. One Pakka Order.'
   - Dual CTA: 'Explore Live Demo' and 'Sign In'
   - Interactive hero preview card showing a green WhatsApp chat order converging with a red Zomato slip into a verified teal Master Order.
   - The Problem breakdown, How It Works (3 steps), and Feature Grid.

2. Screen 2: Operational Dashboard (/)
   - Shift info banner, 4 KPI cards (Source Orders: 148, Canonical Orders: 136, Pending Reviews: 4, Reconciled Rate: 91.8%).
   - High-priority Review Queue widget with direct resolution links.
   - Channel breakdown card (WhatsApp, Zomato, Swiggy, POS).
   - Recent activity feed.

3. Screen 3: Unified Orders Inbox (/orders)
   - Dual view toggle: 'Canonical Master Orders' vs 'Raw Platform Feeds'.
   - Search bar, channel filter pills, expandable data table.
   - Row drawers showing line items with Veg/Non-Veg icons.
   - Raw JSON inspect modal with copy button.

4. Screen 4: Order Detail & Provenance (/orders/:id)
   - 2-column forensic breakdown: Left = Customer & Delivery + Financial Summary; Right = Intake Channel origin + Linked Source Orders.
   - Line items table with dietary tags.
   - Idempotency key and HMAC correlation hash display.

5. Screen 5: Conflict Review Queue (/review)
   - Red alert banner for critical quantity conflicts.
   - Severity tabs (All: 4, Critical: 2, Warning: 2, Resolved).
   - Queue table displaying Candidate Pair ID, Severity badge, Score pill (e.g. 94%), Source A vs Source B summary, conflict description, SLA timer, and 'Review & Resolve' button.

6. Screen 6: Side-by-Side Conflict Resolution Workspace (/review/:id)
   - Dual-column comparison: Left (Source A) vs Right (Source B).
   - Central 'Diff Spine' highlighting mismatched quantities in red (e.g. Qty 2 vs 3).
   - Gemini AI insight panel explaining customer intent.
   - Radio selector for approved canonical quantity.
   - Fixed bottom action bar: Confirm Duplicate (Emerald), Confirm Update (Blue), Confirm Separate (Slate), Keep Pending (Ghost).
   - Mandatory operator reason modal.

7. Screen 7: Order Ingestion & AI Workbench (/imports)
   - 3 tabs: Conversational AI, Batch CSV Upload, Manual POS Entry.
   - Conversational AI view: Left = WhatsApp message box with sample loader; Right = Live Parsed Order card with editable fields, SKU match confidence, and 'Commit Verified Order' button.
   - CSV upload view: Drag-and-drop zone and validation table.

8. Screen 8: Product & SKU Catalog (/catalog)
   - Active SKU counter, category filter pills, menu items table with Indian standard Veg (green square) and Non-Veg (red triangle) badges.
   - Platform price comparison matrix (POS vs Zomato vs Swiggy).
   - Slide-over drawer for managing colloquial chat aliases.

9. Screen 9: Tamper-Evident Audit History (/audit)
   - Cryptographic security header with HMAC-SHA256 badge and Merkle proof modal button.
   - Action filter tabs, audit timeline table with local/UTC timestamps, actor attribution (User vs System), justification text, and expandable state before/after diffs.

10. Screen 10: Console Settings (/settings)
    - Outlet profile form, reconciliation rule sliders (auto-merge threshold, time proximity window).
    - Locked enterprise rule card: Strict Zero Auto-Merge on Quantity Mismatch.
    - Live channel integration cards (WhatsApp Cloud API, Petpooja POS, Zomato, Swiggy).

11. Screen 11: Kitchen Display System (/kds)
    - Touch-optimized 3-column Kanban board: Queued → In Preparation → Ready.
    - Large 24px bold order numbers, dietary flags, customer notes, and 1-tap advance buttons.

12. Screen 12: Authentication & Outlet Switcher (/login)
    - Centered minimal card on #F8FAFC canvas.
    - Outlet selector dropdown, credentials form, and 1-click evaluator demo role chips.
```
