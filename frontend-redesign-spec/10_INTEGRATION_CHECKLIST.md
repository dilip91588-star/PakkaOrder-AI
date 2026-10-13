# 10 — Frontend Integration, Replacement & Safeguard Checklist

This document provides step-by-step instructions for safely integrating the newly generated Google Stitch presentations into the PakkaOrder AI codebase without breaking existing business logic, routing, API contracts, or database transactions.

---

## 1. Non-Negotiable Integration Rules

1. **Zero Backend Disruption**: Under no circumstances should backend controllers, SQL migrations, repository functions, or database schemas be altered during the frontend redesign.
2. **Contract Preservation**: All API calls must continue routing through [frontend/src/api/client.ts](file:///c:/PakkaOrderAI/frontend/src/api/client.ts) to preserve fallback resilience and typed request/response interfaces.
3. **Safety Invariants**:
   * Never re-enable automatic merging on quantity mismatch in any new UI view.
   * `Confirm Duplicate` must never sum quantities together.
   * `Confirm Update` must continue enforcing operator reason and approved canonical quantity selection.
4. **Secret Isolation**: Never introduce API keys (including Gemini keys or Meta webhook secrets) into any frontend bundle or client environment file.

---

## 2. Phase-by-Phase Integration Roadmap

### Phase A: Setup & Design Token Synchronization
- [ ] **Step A1: Update Tailwind Config**:
  Update [frontend/tailwind.config.js](file:///c:/PakkaOrderAI/frontend/tailwind.config.js) to register the light-theme semantic color tokens:
  * `surface-base`: `#F8FAFC`
  * `surface-panel`: `#FFFFFF`
  * `surface-elevated`: `#F1F5F9`
  * `border-crisp`: `#E2E8F0`
  * `accent-teal`: `#0F766E`
  * `accent-teal-hover`: `#115E59`
  * `accent-teal-subtle`: `#CCFBF1`
  * `on-surface`: `#0F172A`
  * `on-surface-muted`: `#64748B`
- [ ] **Step A2: Base CSS Normalization**:
  Update [frontend/src/index.css](file:///c:/PakkaOrderAI/frontend/src/index.css) to set the body background to `#F8FAFC` and default text color to `#0F172A`. Verify font import for `Inter`.

### Phase B: Shared Component Replacement
- [ ] **Step B1: Update Core Badges & Pills**:
  * [frontend/src/components/common/StatusBadge.tsx](file:///c:/PakkaOrderAI/frontend/src/components/common/StatusBadge.tsx): Apply light-theme background and border tokens.
  * [frontend/src/components/common/ScorePill.tsx](file:///c:/PakkaOrderAI/frontend/src/components/common/ScorePill.tsx): Retain green (≥90%), amber (70–89%), and slate (<70%) heuristic scoring tiers.
  * [frontend/src/components/common/ChannelBadge.tsx](file:///c:/PakkaOrderAI/frontend/src/components/common/ChannelBadge.tsx): Retain platform brand identities (WhatsApp, Zomato, Swiggy, POS).
- [ ] **Step B2: Update Modal Dialogs**:
  * [frontend/src/components/common/ConfirmationModal.tsx](file:///c:/PakkaOrderAI/frontend/src/components/common/ConfirmationModal.tsx): Ensure mandatory operator reason input and preset reason chips remain functional.

### Phase C: AppShell & Layout Modernization
- [ ] **Step C1: AppSidebar Replacement**:
  Replace [frontend/src/components/layout/Sidebar.tsx](file:///c:/PakkaOrderAI/frontend/src/components/layout/Sidebar.tsx) with the light-theme version featuring the outlet switcher, active conflict counter badge, and engine health status indicator.
- [ ] **Step C2: TopNavbar Replacement**:
  Replace [frontend/src/components/layout/TopBar.tsx](file:///c:/PakkaOrderAI/frontend/src/components/layout/TopBar.tsx) with the new omni-search, channel sync trigger, and notification center.
- [ ] **Step C3: Routing Update in App.tsx**:
  Ensure [frontend/src/App.tsx](file:///c:/PakkaOrderAI/frontend/src/App.tsx) preserves all existing paths (`/`, `/orders`, `/orders/:id`, `/review`, `/review/:id`, `/imports`, `/catalog`, `/audit`, `/settings`) and introduces the new `/landing` and `/kds` routes.

### Phase D: Screen-by-Screen View Replacement
- [ ] **Step D1: Replace DashboardPage (`/`)**:
  Connect KPI cards and candidate widget to existing `apiClient.getCandidates()` call.
- [ ] **Step D2: Replace ReviewQueuePage (`/review`)**:
  Connect table and filters to `apiClient.getCandidates()`.
- [ ] **Step D3: Replace ConflictResolutionPage (`/review/:id`)**:
  * Wire side-by-side comparison data to `apiClient.getCandidateById(id)`.
  * Wire Gemini explanation box to `apiClient.explainCandidate(id)`.
  * Wire action buttons to `apiClient.resolveCandidate(...)`.
  * Ensure mandatory operator rationale is submitted.
- [ ] **Step D4: Replace ImportOrdersPage (`/imports`)**:
  * Wire conversational AI box to `apiClient.extractOrder(...)`.
  * Wire commit action to `apiClient.createSourceOrder(...)`.
  * Wire batch CSV dropzone to `apiClient.importCsv(...)`.
- [ ] **Step D5: Replace OrdersListPage (`/orders`) & OrderDetailPage (`/orders/:id`)**:
  Connect canonical and source orders list to `apiClient.getCanonicalOrders()` and `apiClient.getSourceOrders()`.
- [ ] **Step D6: Replace AuditHistoryPage (`/audit`) & SettingsPage (`/settings`)**:
  Connect to audit records and live WhatsApp status probe.

---

## 3. Post-Replacement Verification Checklist

Execute these terminal checks after every phase to ensure zero regression:

```powershell
# 1. Typecheck the frontend:
npm run --prefix frontend build

# 2. Lint the frontend:
npm run --prefix frontend lint

# 3. Verify backend compiles with zero errors:
npm run --prefix backend typecheck

# 4. Run the entire automated test suite:
npm run --prefix backend test
```

### Acceptance Criteria
- [ ] All 75 automated vitest tests pass without failure.
- [ ] `vite build` completes with 0 errors and produces a production bundle.
- [ ] Navigating to `/review/:id` displays side-by-side comparisons with functional resolution actions.
- [ ] No API keys are leaked into frontend assets.
- [ ] Application functions with live MySQL backend AND retains offline fallback when the backend is disconnected.
