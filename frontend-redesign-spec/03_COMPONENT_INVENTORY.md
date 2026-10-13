# 03 — Reusable Component Inventory

This document defines the complete catalog of reusable UI components required for the redesigned PakkaOrder AI frontend using Google Stitch.

---

## 1. Layout Components

### 1.1 `AppSidebar`
* **Purpose**: Primary vertical navigation container for the internal console. Displays branding, tenant/outlet selector, role-scoped navigation links, pending conflict counters, and engine health status.
* **Props**:
  * `currentPath: string`
  * `activeTenant: { id: string; name: string; outletCode: string }`
  * `pendingReviewCount: number`
  * `userRole: 'OWNER' | 'MANAGER' | 'LEAD_OPS' | 'COUNTER_STAFF' | 'KITCHEN'`
  * `isMobileOpen: boolean`
  * `onCloseMobile: () => void`
* **Interactions**: Navigates between routes, switches active outlet via dropdown, collapses on mobile.
* **Reuse**: Wraps all authenticated pages inside the main application layout.

### 1.2 `TopNavbar`
* **Purpose**: Horizontal top bar containing global omni-search, multi-channel sync trigger, real-time notification bell, and user profile avatar.
* **Props**:
  * `onSearch: (query: string) => void`
  * `onSyncChannels: () => Promise<void>`
  * `unreadAlertCount: number`
  * `currentUser: { name: string; role: string; avatarUrl?: string }`
  * `onOpenMobileSidebar: () => void`
* **Interactions**: Focuses search input on `⌘K`, triggers manual ingestion sync animation, toggles notification dropdown.
* **Reuse**: Global header across all authenticated console pages.

### 1.3 `PageHeader`
* **Purpose**: Standardized title bar for pages with breadcrumbs, subtitle, status pills, and right-aligned primary action buttons.
* **Props**:
  * `title: string`
  * `subtitle?: string`
  * `breadcrumbs?: Array<{ label: string; href?: string }>`
  * `badge?: { label: string; variant: 'neutral' | 'success' | 'warning' | 'critical' }`
  * `actionElement?: React.ReactNode`
* **Interactions**: Breadcrumb navigation, primary button trigger.
* **Reuse**: Used at the top of every inner page (`OrdersListPage`, `ReviewQueuePage`, `ProductCatalogPage`, `SettingsPage`, etc.).

### 1.4 `PublicWebsiteLayout`
* **Purpose**: Lightweight public wrapper for the landing page with top marketing nav and footer.
* **Props**:
  * `children: React.ReactNode`
  * `onNavigateLogin: () => void`
  * `onNavigateDemo: () => void`
* **Reuse**: Wraps the public landing page (`/landing`).

---

## 2. Order & Ingestion Components

### 2.1 `OrderCard`
* **Purpose**: Compact card representation of an order, used in dashboard widgets, search results, and mobile lists.
* **Props**:
  * `order: CanonicalOrder | SourceOrder`
  * `isCanonical: boolean`
  * `onClick?: () => void`
  * `showChannelBadge?: boolean`
* **Interactions**: Hover elevation, click navigates to `/orders/:id`.
* **Reuse**: `DashboardPage`, `OrdersListPage` (mobile view), `ReviewQueuePage`.

### 2.2 `OrderTable`
* **Purpose**: High-density, accessible tabular view of orders with expandable row drawers for line item inspection.
* **Props**:
  * `orders: Array<CanonicalOrder | SourceOrder>`
  * `mode: 'CANONICAL' | 'SOURCE'`
  * `onSelectOrder: (id: string) => void`
  * `onInspectPayload?: (payload: string) => void`
  * `isLoading: boolean`
* **Interactions**: Sorting by column, expand/collapse item drawer, pagination controls.
* **Reuse**: `OrdersListPage`.

### 2.3 `OrderStatusBadge`
* **Purpose**: Color-coded pill reflecting reconciliation and delivery statuses.
* **Props**:
  * `status: 'CANONICAL_CLEAN' | 'MERGED_CANONICAL' | 'CONFLICT_REVIEW' | 'MANUAL_LINKED' | 'DISPATCHED' | 'HELD_FOR_REVIEW'`
* **Visual States**:
  * `CANONICAL_CLEAN`: Green background (`#CCFBF1`), dark teal text (`#0F766E`).
  * `MERGED_CANONICAL`: Blue-indigo background (`#E0E7FF`), indigo text (`#3730A3`).
  * `CONFLICT_REVIEW`: Amber background (`#FEF3C7`), amber text (`#92400E`).
  * `HELD_FOR_REVIEW`: Red background (`#FEE2E2`), red text (`#991B1B`).
* **Reuse**: Across all order tables, headers, and detail drawers.

### 2.4 `ChannelIndicator` / `OrderSourceIcon`
* **Purpose**: Visual badge identifying the originating intake channel with official platform brand styling.
* **Props**:
  * `channel: 'WHATSAPP' | 'POS' | 'ZOMATO' | 'SWIGGY' | 'MANUAL'`
  * `variant?: 'icon-only' | 'pill' | 'detailed'`
* **Styles**:
  * `WHATSAPP`: Emerald green badge with chat icon.
  * `ZOMATO`: Crimson badge (`#E23744`).
  * `SWIGGY`: Bright orange badge (`#FC8019`).
  * `POS`: Slate-purple badge (`#6366F1`) with cash register icon.
  * `MANUAL`: Muted slate badge (`#64748B`).
* **Reuse**: `OrdersListPage`, `ReviewQueuePage`, `ConflictResolutionPage`, `TopBar`.

### 2.5 `OrderTimeline`
* **Purpose**: Vertical provenance timeline showing every event in an order's lifecycle (Intake → Normalized → Matched → Confirmed → Dispatched).
* **Props**:
  * `events: Array<{ timestamp: string; title: string; actor: string; details?: string; status: 'completed' | 'active' | 'warning' }>`
* **Reuse**: `OrderDetailPage`, `AuditHistoryPage`.

---

## 3. AI & Conflict Resolution Components

### 3.1 `ConflictAlert`
* **Purpose**: High-visibility banner or badge that screams material discrepancies without causing alarm.
* **Props**:
  * `conflictType: 'QUANTITY_MISMATCH' | 'MODIFIER_VARIANCE' | 'PRICE_DISCREPANCY' | 'DUPLICATE_TIMESTAMP'`
  * `severity: 'CRITICAL' | 'WARNING' | 'INFO'`
  * `description: string`
  * `candidateId?: string`
* **Visual Treatment**:
  * `CRITICAL`: Red border (`#DC2626`), light pink surface (`#FEF2F2`), bold alert icon, explicitly stating: *"Material Quantity Variance: Potential Duplicate Preparation Risk"*.
* **Reuse**: `ReviewQueuePage`, `ConflictResolutionPage`, `DashboardPage`.

### 3.2 `ConflictComparison` (The Diff Pane)
* **Purpose**: The centerpiece of the resolution screen. Renders two orders side-by-side with a central "Diff Spine" that highlights item, quantity, modifier, and customer differences.
* **Props**:
  * `sourceA: SourceOrder`
  * `sourceB: SourceOrder`
  * `highlightFields: Array<'items' | 'quantities' | 'notes' | 'customerName' | 'phone'>`
  * `onSelectCanonicalQuantity?: (qty: number) => void`
* **Interactions**: Line-by-line field hover, toggle item detail expansion, radio selection for canonical quantity in update flows.
* **Reuse**: `ConflictResolutionPage`.

### 3.3 `AIInsightPanel`
* **Purpose**: Context card displaying Gemini AI's explanation of why two records matched or what customer intent was extracted from informal chat.
* **Props**:
  * `explanationText: string`
  * `confidenceScore: number` // 0-100
  * `signals: Array<{ name: string; score: number; weight: string }>`
  * `modelName: string`
  * `promptVersion: string`
* **Visual Treatment**: Subtle teal gradient border with spark icon and clear disclaimer: *"AI provides matching signals only; final decision requires human operator approval."*
* **Reuse**: `ConflictResolutionPage`, `ImportOrdersPage`.

### 3.4 `ConfidenceIndicator` / `ScorePill`
* **Purpose**: Displays the deterministic heuristic matching score (0–100%) with clear tiered styling.
* **Props**:
  * `score: number`
* **Tiers**:
  * `90%–100%`: Green badge (`#16A34A`), label *"High Match"*.
  * `70%–89%`: Amber badge (`#D97706`), label *"Suspected Duplicate"*.
  * `<70%`: Slate badge (`#64748B`), label *"Low Match / Ambiguous"*.
* **Reuse**: `ReviewQueuePage`, `ConflictResolutionPage`.

### 3.5 `ApprovalControls`
* **Purpose**: The 4 standardized action buttons for resolving candidate conflict pairs.
* **Props**:
  * `onConfirmDuplicate: () => void`
  * `onConfirmUpdate: () => void`
  * `onConfirmSeparate: () => void`
  * `onKeepPending: () => void`
  * `isSubmitting: boolean`
* **Button Labels & Tooltips**:
  1. `Confirm Duplicate`: Emerald button. *"Links records to one master order. Quantities are NOT summed."*
  2. `Confirm Update`: Blue button. *"Approves customer modification and updates canonical quantity."*
  3. `Confirm Separate`: Slate button. *"Keeps records as independent, non-conflicting orders."*
  4. `Keep Pending`: Gray ghost button. *"Defers resolution for further verification."*
* **Reuse**: `ConflictResolutionPage`.

### 3.6 `VerificationModal` (Mandatory Reason Dialog)
* **Purpose**: Modal required by Rule #11 and Rule #12 before committing any resolution. Captures mandatory operator rationale for the immutable audit trail.
* **Props**:
  * `isOpen: boolean`
  * `action: 'CONFIRM_UPDATE' | 'CONFIRM_DUPLICATE' | 'CONFIRM_SEPARATE'`
  * `candidatePairId: string`
  * `selectedQuantity?: number`
  * `onSubmit: (reason: string) => Promise<void>`
  * `onClose: () => void`
* **Inputs**: Preset reason quick-chips (e.g. *"Customer confirmed on phone"*, *"Zomato rider canceled prior duplicate"*, *"Legitimate second order"*) + freeform rationale text input.
* **Reuse**: `ConflictResolutionPage`.

---

## 4. Kitchen Display (KDS) Components

### 4.1 `KitchenOrderTicket`
* **Purpose**: High-contrast, glanceable ticket card for the kitchen assembly line displaying only verified master items.
* **Props**:
  * `orderNumber: string`
  * `receivedTime: string`
  * `elapsedMinutes: number`
  * `items: Array<{ name: string; quantity: number; customizations?: string[]; dietary?: 'VEG' | 'NON_VEG' }>`
  * `status: 'NEW' | 'PREPARING' | 'READY'`
  * `onAdvanceStatus: (newStatus: string) => void`
* **Visual Treatment**: Large bold typography, highlighted customer notes, distinct Veg/Non-Veg indicators.
* **Reuse**: `KitchenDisplayPage` (`/kds`).

### 4.2 `PreparationStatus`
* **Purpose**: Segmented control showing preparation progress (`Queued` → `In Oven / Wok` → `Plated / Packed`).
* **Props**:
  * `currentStatus: string`
  * `onChange: (status: string) => void`
* **Reuse**: `KitchenDisplayPage`.

---

## 5. Shared Design System Components

| Component | Props | Purpose |
| :--- | :--- | :--- |
| `SearchInput` | `value, onChange, placeholder, onClear, shortcutKey` | Debounced text filter with `⌘K` badge. |
| `FilterDropdown` | `label, options, selectedValue, onSelect` | Clean popover filter for categories, channels, and severity. |
| `DateRangeSelector` | `currentRange, onSelectRange` | Quick buttons for `Today`, `Yesterday`, `Custom`. |
| `EmptyState` | `icon, title, description, actionButton` | Friendly visual fallback when tables or queues are empty. |
| `LoadingSkeleton` | `rows, type: 'table' \| 'cards' \| 'detail'` | Pulsing neutral placeholders matching light theme tokens. |
| `ErrorState` | `title, message, onRetry` | Accessible banner with retry trigger for failed API requests. |
| `ToastNotification` | `message, type: 'success' \| 'error' \| 'info', onClose` | Floating feedback badge for successful resolutions or copies. |
| `Pagination` | `currentPage, totalPages, totalCount, onPageChange` | Standardized page navigator for order listings. |
| `ConfirmationDialog` | `title, message, confirmText, cancelText, onConfirm, onCancel` | Generic blocking confirmation for dangerous operations. |
