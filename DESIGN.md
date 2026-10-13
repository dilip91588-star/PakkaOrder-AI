# PakkaOrderAI --- UX and Visual Design Specification

## 1. Product experience & Branding

The interface should feel like a trustworthy operations console, not a
generic chatbot.

**Branding:** The application shell, headers, page titles, navigation labels, and user-facing dialogs must consistently display the product name **PakkaOrderAI** (with OrderTruth AI representing the underlying reconciliation engine).

Users need to quickly understand: - Which orders
require attention. - Why two records were matched. - Exactly what
conflicts. - What decision they are being asked to make. - What changes
after they approve the decision.

## 2. Visual direction

-   **Theme & Atmosphere:** Premium dark-first B2B SaaS operations console with the polish of modern enterprise software and the precision of a financial operations dashboard.
-   **Color Palette:**
    -   *Base & Surfaces:* Deep navy and charcoal surfaces (`#0b0f19` root canvas, `#111827` panel surfaces, `#1e293b` elevated cards, `#334155` crisp borders).
    -   *Brand & Accent:* Restrained cyan/teal accents (`#06b6d4`, `#14b8a6`, `#0891b2`) for active selections and primary highlights.
    -   *Semantic Status:* Amber (`#f59e0b`) for warnings/uncertainties, Red (`#ef4444`) for critical conflicts (e.g. quantity mismatches), Green (`#10b981`) for confirmed canonical matches, Slate (`#64748b`) for neutral/archived.
-   **Typography & Hierarchy:** Clean geometric sans-serif (Inter/system-ui), tabular numerals for quantities and monetary values, high contrast legible labels.
-   **Structure & Elevation:** Subtle 1px borders, tasteful dark shadows, restrained linear gradients, consistent 8px/12px card border radii.
-   **Icons:** Lucide-style consistent 16px/20px stroke icons.
-   **Avoid:** Generic admin templates, glowing neon, excessive glassmorphism, random gradients on every card, huge meaningless hero headings inside operational screens, and fake charts or fabricated metrics.
-   **Accessibility:** WCAG AA contrast compliance, visible keyboard focus rings (`ring-2 ring-cyan-500`), semantic labels and aria attributes so color is never the sole indicator.

## 3. Main application shell

### Sidebar

-   Overview
-   Orders
-   Review Queue
-   Imports
-   Product Catalog
-   Audit History
-   Settings

Show badges for pending review/conflict counts where useful.

### Header

-   Current business/tenant
-   Search
-   Notifications
-   Current user and role

## 4. Dashboard page

Summary cards: - Source records received - Canonical orders - Candidates
awaiting review - Open conflicts

Main sections: - Review queue with priority, candidate pair, channels,
conflict summary, time, and status. - Recent order activity. - Recent
resolution history.

Do not display fabricated live metrics. Demo data must be labelled as
demo data.

## 5. Source order import flow

1.  Select input: manual form, paste text, or CSV upload.
2.  Preview extracted/parsed fields.
3.  Show uncertain fields and parsing errors.
4.  Allow corrections before committing normalized fields.
5.  Preserve original input.
6.  Show import outcome and candidates generated.

Use explicit empty, loading, success, and error states.

## 6. Review queue

Each row should show: - Candidate/reference IDs. - Source channels. -
Received/source times. - Customer/address match summary with PII masked
where appropriate. - Conflict badges, e.g. Quantity mismatch. - Match
score labelled as a score, not a probability. - Review status. - Action
to open details.

Filters: pending status, conflict type, channel, score band, date range.

## 7. Candidate detail page

### Summary strip

-   Candidate ID
-   Review status
-   Score and algorithm version
-   Open conflict count
-   Created time

### Side-by-side record comparison

Columns: - Source A - Field/difference - Source B

Show: - Original and normalized values where useful. - Channel and
timestamps. - Product line items, quantities, variants, customizations,
prices. - Match evidence. - Source record IDs.

For a quantity conflict, visually emphasize both quantities and show an
explicit warning that the correct quantity is not inferred
automatically.

### Resolution panel

Actions: 1. Confirm duplicate entry. 2. Confirm authorized update. 3.
Confirm separate orders. 4. Leave pending / request clarification.

For update: - Ask which value is confirmed. - Require a reason. - Show a
before/after preview. - Require explicit confirmation. - Display the
expected canonical order version.

For duplicate: - Explain that quantities will not be added. - Preview
which canonical order will remain. - Show which source records will link
to it.

For separate: - Show that both orders will remain independent.

### Audit timeline

Display actor, action, timestamp, reason, and relevant before/after
values. Do not expose internal secrets or unnecessary customer data.

## 8. Status and warning language

Use plain language: - "Possible duplicate" - "Quantity differs: 2 vs
3" - "Needs human review" - "Customer-confirmed update" - "Confirmed
separate orders" - "Not enough evidence to decide"

Avoid claims like "96% probability" unless the model has been calibrated
and validated. A heuristic score should be labelled "Match score".

## 9. Accessibility and interaction

-   All actions keyboard accessible.
-   Focus indicators visible.
-   Inputs have labels and validation messages.
-   Confirm destructive/material actions in a dialog.
-   Support screen readers and semantic table markup.
-   Do not use color alone to indicate conflicts.
-   Preserve user-entered notes on recoverable request failures.
-   Warn when the case has changed since the reviewer opened it.

## 10. Components

-   `AppShell`
-   `SidebarNav`
-   `DashboardMetricCard`
-   `ReviewQueueTable`
-   `ConflictBadge`
-   `MatchScoreBadge`
-   `OrderRecordPanel`
-   `OrderItemsTable`
-   `FieldDiffRow`
-   `EvidencePanel`
-   `ResolutionDialog`
-   `AuditTimeline`
-   `ImportWizard`
-   `EmptyState`
-   `ErrorState`
-   `LoadingSkeleton`

Keep reusable UI components separate from data-fetching and business
logic.

## 11. Stitch MCP Generated Assets & Screen Registry

All core application screens have been generated in high fidelity using the Stitch MCP under project `11632535327186639718` and design system `assets/69590d880bbd44d78cbe81e52a6452bc`.
For full screen IDs, download URLs for production HTML/Tailwind templates, and screenshot previews, see [STITCH_DESIGN_SYSTEM.md](file:///d:/PakkaOrderAI/STITCH_DESIGN_SYSTEM.md).

