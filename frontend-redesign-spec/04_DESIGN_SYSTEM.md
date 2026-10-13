# 04 — Design System Specification: Light-Theme SaaS Direction

This document establishes the design language, color tokens, typography scales, component styles, and accessibility rules for Google Stitch to generate the redesigned PakkaOrder AI user experience.

---

## 1. Visual Philosophy & Design Identity

* **Inspiration**: Linear, Stripe Dashboard, Notion, high-performance SaaS tools.
* **Core Qualities**: Minimal, crisp, trustworthy, high-contrast, restaurant-operations focused.
* **Emotional Tone**: Calm precision. A restaurant manager during peak rush hour needs immediate clarity, readable order numbers, and zero visual noise.
* **Design Anti-Patterns (Strictly Avoided)**:
  * ❌ No excessive gradients or neon glows.
  * ❌ No dark-mode heavy glassmorphism or muddy slate backgrounds.
  * ❌ No overdecorated dashboards or decorative 3D cards.
  * ❌ No cartoonish robot illustrations for AI features.
  * ❌ No non-standard animated transitions that slow down operational clicks.

---

## 2. Color System & Semantic Palette

### 2.1 Core Neutral & Surface Tokens

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `color-bg-primary` | `#F8FAFC` | Main application backdrop, dashboard canvas. |
| `color-surface` | `#FFFFFF` | Primary card surfaces, modals, data tables, dropdown menus. |
| `color-surface-subtle` | `#F1F5F9` | Secondary surfaces, table headers, sidebar active items, code containers. |
| `color-surface-hover` | `#E2E8F0` | Hover state for buttons, clickable list items, and table rows. |
| `color-border` | `#E2E8F0` | Default crisp 1px borders for cards, inputs, and table dividers. |
| `color-border-subtle` | `#F1F5F9` | Subtle dividers between nested items or secondary sections. |

### 2.2 Typography & Text Colors

| Token Name | Hex Code | Contrast Ratio on Surface | Purpose |
| :--- | :--- | :---: | :--- |
| `color-text-primary` | `#0F172A` | `15.8:1` (AAA) | Main headings, order numbers, table data, primary labels. |
| `color-text-secondary` | `#64748B` | `4.8:1` (AA) | Subheadings, timestamps, secondary metadata, table column headers. |
| `color-text-muted` | `#94A3B8` | `3.1:1` | Placeholder text, disabled inputs, decorative icons. |
| `color-text-inverse` | `#FFFFFF` | N/A | Text inside dark buttons and primary badges. |

### 2.3 Brand & Action Tokens

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `color-brand-primary` | `#0F766E` | Deep Teal — primary action buttons, active navigation markers, key highlights. |
| `color-brand-hover` | `#115E59` | Hover state for primary buttons. |
| `color-brand-accent` | `#CCFBF1` | Light Teal — pill badge backgrounds, active selection rings, AI highlight surfaces. |
| `color-brand-ring` | `rgba(15, 118, 110, 0.2)` | Keyboard focus ring for accessible inputs and buttons. |

### 2.4 Semantic Status & Conflict Tokens

| State | Background | Border | Text | Operational Meaning in PakkaOrder AI |
| :--- | :--- | :--- | :--- | :--- |
| **Critical / Conflict** | `#FEF2F2` | `#FCA5A5` | `#DC2626` | Material Quantity Mismatch, high-risk duplicate preparation, failed webhook. |
| **Warning / Suspected** | `#FFFBEB` | `#FCD34D` | `#D97706` | Suspected duplicate candidate, modifier variance, temporal proximity review. |
| **Success / Canonical** | `#F0FDF4` | `#86EFAC` | `#16A34A` | Reconciled canonical clean order, verified customer instruction, HMAC match. |
| **Neutral / Informational** | `#F8FAFC` | `#E2E8F0` | `#64748B` | Unlinked source record, standard operational log, general metadata. |

### 2.5 Channel Platform Badges

| Channel | Background | Text / Border | Brand Logo Icon |
| :--- | :--- | :--- | :--- |
| **WhatsApp** | `#DCFCE7` | `#15803D` | MessageSquare (Green) |
| **Zomato** | `#FEE2E2` | `#B91C1C` | UtensilsCrossed (Crimson) |
| **Swiggy** | `#FFEDD5` | `#C2410C` | ShoppingBag (Orange) |
| **POS Terminal** | `#EEF2FF` | `#4338CA` | Monitor (Indigo) |
| **Manual / Counter** | `#F1F5F9` | `#475569` | UserCheck (Slate) |

---

## 3. Typography Scale

* **Primary Font Family**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Monospace Font Family**: `JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace` (strictly used for Order Numbers, Currency values, Hashes, and Idempotency Keys).

| Scale | Size | Line Height | Weight | Usage |
| :--- | :---: | :---: | :---: | :--- |
| **Display / Hero** | `32px` | `40px` | `Bold (700)` | Landing Page Hero headline, major marketing headings. |
| **H1 — Page Title** | `24px` | `32px` | `SemiBold (600)` | Top of pages (`Dashboard`, `Review Queue`, `Orders`). |
| **H2 — Section Header** | `18px` | `24px` | `SemiBold (600)` | Card titles, modal headers, major panel divisions. |
| **H3 — Subtitle** | `15px` | `20px` | `Medium (500)` | Form section labels, candidate pair headers. |
| **Body Primary** | `14px` | `20px` | `Regular (400)` | Standard table cell data, order descriptions, button text. |
| **Body Secondary** | `13px` | `18px` | `Regular (400)` | Card subtext, timestamps, item customization notes. |
| **Caption / Badge** | `12px` | `16px` | `Medium (500)` | Status pills, channel badges, table column headers. |
| **Mono Metric** | `18px–28px` | `24px–32px` | `Bold (700)` | Summary metric figures (e.g. `148`, `91.8%`, `₹1,240`). |

---

## 4. Spacing, Elevation & Corner Radii

### 4.1 Spacing Grid (4px / 8px Base)
* `space-1`: `4px` (internal icon/text gaps)
* `space-2`: `8px` (button padding vertical, badge padding)
* `space-3`: `12px` (standard card inner padding, input padding)
* `space-4`: `16px` (container margins, table cell padding)
* `space-6`: `24px` (page section gap, card grid gutters)
* `space-8`: `32px` (major page container padding)

### 4.2 Corner Radii
* `radius-sm`: `6px` (badges, small action buttons, table row highlights)
* `radius-md`: `8px` (standard buttons, form input fields, dropdowns)
* `radius-lg`: `12px` (cards, modal dialogs, data table containers)
* `radius-xl`: `16px` (landing page hero cards, major workbench containers)

### 4.3 Restrained Shadows (Clean & Subtle)
* `shadow-xs`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (card default state, input focus)
* `shadow-sm`: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)` (dropdown popovers, card hover)
* `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` (floating notification toasts, modal dialogs)

---

## 5. Standard Component Styling Rules

### 5.1 Buttons
* **Primary Button**:
  * Background: `#0F766E`
  * Text: `#FFFFFF`, `14px`, `font-medium`
  * Hover: `#115E59`
  * Padding: `8px 16px`, rounded `8px`
  * Focus Ring: `2px` offset with `#0F766E`
* **Secondary / Outline Button**:
  * Background: `#FFFFFF`
  * Border: `1px solid #E2E8F0`
  * Text: `#0F172A`, `14px`
  * Hover: `#F8FAFC`
* **Destructive / High-Alert Button**:
  * Background: `#DC2626`
  * Text: `#FFFFFF`
  * Hover: `#B91C1C`
* **Ghost Button**:
  * Background: `transparent`
  * Text: `#64748B`
  * Hover: `#F1F5F9`, Text: `#0F172A`

### 5.2 Cards & Panels
* **Container**: `bg-white border border-[#E2E8F0] rounded-xl shadow-xs`
* **Card Header**: Subtle bottom border (`border-b border-[#F1F5F9]`) with title in `16px font-semibold text-[#0F172A]` and optional right-side action link.
* **Card Body**: Generous padding (`16px` or `20px`) with high contrast text.

### 5.3 Data Tables
* **Header Row**: Background `#F8FAFC`, text `#64748B`, `12px uppercase font-semibold tracking-wider`, bottom border `#E2E8F0`.
* **Data Rows**: Background `#FFFFFF`, border-bottom `#F1F5F9`, hover background `#F8FAFC transition-colors`.
* **Cell Padding**: `12px 16px` (tight enough for high data density, spacious enough for legibility).
* **Selection State**: Left border accent `3px solid #0F766E` with subtle background `#F0FDFA`.

### 5.4 Form Inputs
* **Default State**: Background `#FFFFFF`, border `1px solid #E2E8F0`, rounded `8px`, padding `8px 12px`, text `14px #0F172A`, placeholder `#94A3B8`.
* **Focus State**: Border `#0F766E`, shadow ring `0 0 0 3px rgba(15, 118, 110, 0.15)`.
* **Error State**: Border `#DC2626`, shadow ring `0 0 0 3px rgba(220, 38, 38, 0.15)`.

---

## 6. Accessibility (WCAG 2.1 AA Compliance)

1. **Color Contrast**: All primary text (`#0F172A`) against `#FFFFFF` or `#F8FAFC` exceeds `15:1` contrast ratio. Secondary metadata (`#64748B`) exceeds `4.8:1`.
2. **Keyboard Navigation**: All interactive elements (buttons, inputs, dropdowns, table rows) feature visible focus indicators (`color-brand-ring`).
3. **Screen Reader Attributes**: ARIA roles applied on table expanders (`aria-expanded`), dialogs (`aria-modal="true"`), and status pills (`aria-label`).
4. **Color Independence**: Status badges never rely on color alone; every badge includes both an unambiguous textual label (e.g. `CRITICAL CONFLICT`) and a distinct icon (AlertTriangle, CheckCircle2, Clock).
