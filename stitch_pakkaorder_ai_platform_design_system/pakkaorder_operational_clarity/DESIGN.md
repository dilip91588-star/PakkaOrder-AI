---
name: PakkaOrder Operational Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#216963'
  on-secondary: '#ffffff'
  secondary-container: '#a8ece5'
  on-secondary-container: '#266d68'
  tertiary: '#2d5951'
  on-tertiary: '#ffffff'
  tertiary-container: '#467169'
  on-tertiary-container: '#c5f3ea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#abefe8'
  secondary-fixed-dim: '#8fd3cc'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504b'
  tertiary-fixed: '#bdece2'
  tertiary-fixed-dim: '#a2d0c6'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#224e47'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-data-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
  mono-data-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-data-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  gutter-desktop: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system delivers an operational command center aesthetic engineered for high-volume enterprise restaurant operations, financial auditability, and automated order reconciliation. The brand character is balanced, authoritative, and frictionless—borrowing the obsessive precision of Linear, the structural typographic discipline of Stripe, and the high-density utility of Vercel.

### Design Movement & Core Principles
- **Functional Minimalism & Precision Engineering:** Interfaces prioritize data density without cognitive clutter. High-frequency operators must triage thousands of omnichannel orders across POS, third-party aggregators (DoorDash, UberEats, Deliveroo), and direct web channels with absolute confidence.
- **Calm, High-Luminance Surfaces:** Rather than dark terminal motifs or heavy decorative styling, the environment leverages a pristine, clinical light canvas. Visual hierarchy relies on razor-thin borders, strict vertical alignment, and disciplined optical pacing.
- **Targeted Semantic Signaling:** The interface strictly adheres to a 75-15-10 color allocation rule (75% crisp neutral surfaces, 15% structural typography and deep slate framing, 10% semantic status and primary brand accents). Color carries operational meaning—never decoration.
- **Auditable & Real-Time Posture:** Monospaced data displays for financial deltas, transaction hashes, and reconciliation logs evoke algorithmic dependability and rigorous financial accounting.

## Colors

The palette is engineered to minimize eye strain across long operational shifts while maintaining distinct contrast ratios for rapid triage.

### Surface & Neutral Architecture
- **Application Canvas (`#F8FAFC`):** The foundational viewport canvas providing a soft, clinical substrate behind discrete cards and tables.
- **Primary Surface (`#FFFFFF`):** High-priority interactives, data tables, sheets, and active cards.
- **Secondary Surface (`#F1F5F9`):** Recessed toolbars, table headers, code blocks, sidebar navigation panels, and input backings.
- **Structural Border (`#E2E8F0`):** Consistent 1px hairpins across all containers, column dividers, and interactive components.
- **Text Primary (`#0F172A`):** Deep slate providing optimal legibility for headers, order values, and primary labels.
- **Text Secondary (`#64748B`):** Neutral slate for metadata, supporting timestamps, column headers, and secondary states.
- **Text Muted (`#94A3B8`):** Disabled UI, keyboard shortcuts, and structural table pagination indicators.

### Brand & Interactive States
- **Brand Primary (`#0F766E`):** Deep teal denoting core calls-to-action, primary focus rings, selected table rows, and active navigation nodes.
- **Brand Hover / Active (`#115E59`):** Deepened teal providing tactile visual feedback on mouse-down and hover interactions.
- **Brand Accent Surface (`#CCFBF1`):** Ultra-light teal tint applied to AI-assisted match chips, selected row indicators, and active badge states.

### Operational Semantic Accents
Semantic accents are strictly restricted to 10% of any given view to maintain high alarm fidelity:
- **Success (`#16A34A`):** Order reconciled, ledger match balanced, automated refund processed.
- **Warning / Unresolved (`#D97706`):** Price discrepancy detected, unmapped menu modifier, delayed kitchen sync.
- **Critical / Conflict (`#DC2626`):** Omnichannel duplicate charge, aggregator cancellation conflict, POS sync error.
- **Neutral / Draft (`#64748B`):** Queued, archived, or legacy manual overrides.

## Typography

Typography governs the rhythm of financial reconciliation and error resolution. The dual-typeface hierarchy cleanly divides conversational/operational chrome from hard technical data:

- **Inter (Primary UI & Display):** Deployed across all structural navigation, dialog titles, body content, and standard control labels. Inter's optical neutrality prevents fatigue and remains crisp in high-density tables.
- **JetBrains Mono (Technical, Ledger & Transactional Data):** Deployed specifically for alphanumeric order references (e.g., `#ORD-9021-DD`), ISO currency values (`$1,429.50`), timestamps, reconciliation percentage metrics, and AI confidence parameters (`0.984 conf`).

### Typographic Implementation Rules
- Apply `mono-data-md` to all numeric values in comparative tables to ensure tabular numeral alignment across side-by-side reconciliation logs.
- Never use full uppercase for body text. All-caps is restricted exclusively to `label-sm` when designating short channel origins (e.g., `POS`, `UBER`, `DOOR`, `WEB`) with `0.05em` tracking.

## Layout & Spacing

The layout is built upon an adaptive fluid grid structured for multi-panel desktop workspaces, where operators frequently view the aggregator payload, POS ingestion log, and AI conflict resolver side by side.

### Layout Philosophy & Grid Architecture
- **Desktop (>= 1280px):** 12-column fluid grid with `1.5rem` (`24px`) gutters and a minimum edge margin of `2rem`. Supports fixed 260px collapsible sidebars, a 60% master reconciliation table, and a 40% contextual conflict resolution drawer.
- **Tablet (768px - 1279px):** 8-column layout with `1rem` (`16px`) gutters and `1.5rem` margins. Contextual side drawers shift into slide-over sheets.
- **Mobile (< 768px):** 4-column layout with `0.75rem` (`12px`) gutters and `1rem` margins. Multi-column order diff tables reflow into stacked comparative cards.

### Spacing Rhythm
- **Micro Spacing (`space-xxs` to `space-xs`):** Reserved for interior badge padding, input borders, icon-to-label gaps, and inline tag separation.
- **Component Spacing (`space-sm` to `space-md`):** Interior padding for dense table cells, button containers, dropdown items, and card headers.
- **Layout Rhythm (`space-lg` to `space-3xl`):** Gap separation between stacked workspace panels, filter toolbars, and primary view headers.

## Elevation & Depth

Depth is established primarily through crisp boundary architecture (`#E2E8F0` hairline borders) combined with subtle micro-elevations. The design explicitly avoids deep blurs, dramatic drop shadows, or dark glassmorphic overlays.

### Elevation Hierarchy
- **Level 0 (Flat Canvas - `#F8FAFC`):** Application root canvas, backdrop underlays, and inactive structural side rails.
- **Level 1 (Card & Row Surface - `#FFFFFF`):** Base layer for all cards, panels, and data tables. Outlined with `1px solid #E2E8F0`. No drop shadow.
- **Level 2 (Hover & Active Context):** Dynamic cards on hover, active split-screen panels, and dragged conflict items. Border remains `#E2E8F0` with a subtle elevation: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 3 (Floating Overlays & Popovers):** Date range pickers, filter dropdowns, and context menus. `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`, bordered with `#E2E8F0`.
- **Level 4 (System Drawers & Conflict Modals):** High-priority resolution sheets and modal overlays. `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`. Paired with a neutral backdrop scrim: `#0F172A` at `20%` opacity with no backdrop blur to retain operational context.

## Shapes

The design system employs a soft, highly disciplined geometry (`roundedness: 1`). Radii are kept tight and restrained, evoking the clean industrial software feel of developer tools and modern fintech platforms.

### Geometry Specifications
- **Base Components (`rounded` / 4px / `0.25rem`):** Buttons, inputs, search fields, table selection checkboxes, inline code tags, and status chips.
- **Containers (`rounded-lg` / 8px / `0.5rem`):** Cards, primary data tables, popover sheets, dropdown menus, and conflict preview panels.
- **Floating Modals & Sheets (`rounded-xl` / 12px / `0.75rem`):** Central dialogs, drawer corners, and bulk conflict resolution wizards.
- **Pill Elements (`rounded-full`):** Reserved exclusively for status indicator pips and AI confidence percentage pills.

## Components

### Buttons
- **Primary:** Background `#0F766E`, text `#FFFFFF`, border `transparent`. Hover `#115E59`. Active `#0F766E` with an inner shadow. Height 36px (`label-md`), padding 0 14px, radius 4px.
- **Secondary / Outline:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`. Hover background `#F8FAFC`, hover border `#CBD5E1`.
- **Ghost:** Background transparent, text `#64748B`. Hover text `#0F172A`, hover background `#F1F5F9`.
- **Destructive:** Background `#FEF2F2`, text `#DC2626`, border `1px solid #FECACA`. Hover background `#DC2626`, hover text `#FFFFFF`.

### Chips & Semantic Status Badges
Status chips communicate audit readiness at a glance. Height 22px, radius 4px, font `mono-data-sm`.
- **Reconciled (Success):** Background `#F0FDF4`, text `#16A34A`, border `1px solid #BBF7D0`.
- **Conflict Detected (Critical):** Background `#FEF2F2`, text `#DC2626`, border `1px solid #FECACA`.
- **Pending Review (Warning):** Background `#FFFBEB`, text `#D97706`, border `1px solid #FDE68A`.
- **AI Suggested Match:** Background `#CCFBF1`, text `#0F766E`, border `1px solid #99F6E4`. Paired with a subtle 6px solid teal indicator dot.

### Inputs & Filters
- **Text & Search Fields:** Height 36px, background `#FFFFFF`, border `1px solid #E2E8F0`, radius 4px, text `body-md` (`#0F172A`), placeholder `#94A3B8`.
- **Focus State:** Border `#0F766E`, box-shadow `0 0 0 1px #0F766E`.
- **Monospace Input (Overrides/Calculations):** Utilizes `mono-data-md` for numeric quantity adjustments and tax recalculations.

### Checkboxes & Selection Controls
- Base 16px × 16px square, radius 4px, border `1px solid #CBD5E1`, background `#FFFFFF`.
- Checked state: Background `#0F766E`, border `#0F766E`, check icon `#FFFFFF` (1.5px stroke).

### Cards & Reconciliation Panels
- Background `#FFFFFF`, border `1px solid #E2E8F0`, radius 8px, padding `space-lg` (`16px`).
- Card header features a bottom separator `1px solid #F1F5F9` when enclosing secondary toolbars or filter strips.

### Specialized Component: Conflict Diff Viewer
A specialized side-by-side reconciliation card compares Aggregator Payload vs POS Ingestion:
- **Left Column (Aggregator):** Secondary surface `#F8FAFC`, border `#E2E8F0`.
- **Right Column (POS Core):** Secondary surface `#F8FAFC`, border `#E2E8F0`.
- **Discrepancy Line Item:** Highlighted with a `#FEF2F2` background, a 2px left border in `#DC2626`, and conflicting currency amounts displayed via `mono-data-md` in `#DC2626`.
- **One-Click Auto Resolve Action:** Inline primary mini-button (`height: 24px`, font `label-sm`, background `#0F766E`, text `#FFFFFF`) labeled with the AI confidence percentage.