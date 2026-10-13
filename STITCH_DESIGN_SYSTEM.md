# PakkaOrderAI --- Stitch MCP Design System & Screen Asset Registry

This document records the design tokens, component architecture, and screen asset references generated for **PakkaOrderAI** using the connected **Stitch MCP**.

---

## 1. Stitch MCP Project & Design System Identity

- **Stitch Project ID:** `11632535327186639718`
- **Project Title:** `PakkaOrderAI`
- **Design System Asset:** `assets/69590d880bbd44d78cbe81e52a6452bc`
- **Design System Display Name:** `PakkaOrderAI Operations Console`
- **Visual Direction:** Premium dark-first B2B SaaS operations console with the polish of modern enterprise software and the precision of a financial operations dashboard.
- **Color Mode:** Dark (`COLOR_MODE_DARK`)
- **Primary Typography:** `Inter` (geometric sans-serif) with tabular numerals (`tnum` / `font-mono`) for quantities, currency, timestamps, and scores.

---

## 2. Global Design Tokens

### 2.1. Color Palette

| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| `surface-base` (`background`) | `#0b0f19` | Root canvas / deepest workspace background |
| `surface-panel` (`surface`) | `#111827` | Navigation sidebar, top command header, container panels |
| `surface-elevated` | `#1e293b` | Interactive cards, modal dialogs, data table containers |
| `border-crisp` (`outline`) | `#334155` | 1px high-contrast structural borders, separators, and table dividers |
| `accent-cyan` (`primary`) | `#06b6d4` | Primary brand accent, active navigation markers, primary action buttons |
| `accent-teal` (`secondary`) | `#14b8a6` | Secondary accent, confirmed status highlights, link indicators |
| `status-critical` (`error`) | `#ef4444` | Critical conflicts (e.g., quantity mismatches), destructive actions |
| `status-warning` (`tertiary`) | `#f59e0b` | Pending review items, NLP extraction ambiguities, SLA warnings |
| `status-success` | `#10b981` | Fully reconciled canonical orders, clean single-source records |
| `status-neutral` | `#64748b` | Archived, unlinked, or 86-ed / inactive catalog items |
| `on-surface` | `#dfe2f1` | High-contrast body text and tabular labels |
| `on-surface-variant` | `#bcc9cd` | Secondary metadata labels, timestamps, field descriptions |

### 2.2. Typography Hierarchy

- **Font Family:** `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Tabular Numerals:** `font-variant-numeric: tabular-nums;` strictly enforced for prices, counts, and match scores.
- **Headline Scales:**
  - `headline-xl`: 28px / 36px, Semibold (600)
  - `headline-lg`: 22px / 28px, Semibold (600)
  - `headline-md`: 18px / 24px, Semibold (600)
  - `headline-sm`: 14px / 20px, Semibold (600)
- **Body & Data Scales:**
  - `body-lg`: 15px / 24px, Regular (400)
  - `body-md`: 14px / 20px, Regular (400)
  - `body-sm`: 13px / 18px, Regular (400)
  - `tabular-md`: 14px / 20px, Medium (500) tabular numbers
  - `tabular-sm`: 12px / 16px, Medium (500) tabular numbers
  - `label-md`: 12px / 16px, Medium (500) uppercase tracking

### 2.3. Radii & Spacing

- **Corner Radii:** Soft enterprise curvature (`ROUND_FOUR` / `rounded-md` at 6px–8px for inputs and cards; `rounded-full` for status badges).
- **Elevation:** Low-contrast 1px outlines (`#334155`) with subtle dark drop shadows (`0 4px 20px -2px rgba(0, 0, 0, 0.5)`) for modals and floating toolbars.

---

## 3. Generated Application Screens (100% Complete)

All 8 requested screens have been generated using Stitch MCP with identical theme tokens and layout consistency:

| # | Screen Name | Screen ID | Resolution | Stitch Resource Name | Status |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Dashboard** | `68d2d2c60f81473cbfeeb9c151573b02` | 2560 × 3104 | `projects/11632535327186639718/screens/68d2d2c60f81473cbfeeb9c151573b02` | **Complete** |
| **2** | **Orders Management** | `32e51a1d8bf74c558be0f3286decdbec` | 2560 × 3936 | `projects/11632535327186639718/screens/32e51a1d8bf74c558be0f3286decdbec` | **Complete** |
| **3** | **Duplicate Review Queue** | `535bf3880993414cb6f01089bb48c3aa` | 2560 × 2048 | `projects/11632535327186639718/screens/535bf3880993414cb6f01089bb48c3aa` | **Complete** |
| **4** | **Conflict Detail & Resolution** | `f7cc6091fa2741dabfc0aadd817c95db` | 2560 × 3822 | `projects/11632535327186639718/screens/f7cc6091fa2741dabfc0aadd817c95db` | **Complete** |
| **5** | **Source Order Import Wizard** | `7c15b02560364892835ddf30302b67d4` | 2560 × 2048 | `projects/11632535327186639718/screens/7c15b02560364892835ddf30302b67d4` | **Complete** |
| **6** | **Product Catalog & Mappings** | `15ffe851c22f443d8fb821b5cc6a8124` | 2560 × 2048 | `projects/11632535327186639718/screens/15ffe851c22f443d8fb821b5cc6a8124` | **Complete** |
| **7** | **Immutable Audit History** | `b076e36a8c8247cfb529c344aaf95cbc` | 2560 × 4070 | `projects/11632535327186639718/screens/b076e36a8c8247cfb529c344aaf95cbc` | **Complete** |
| **8** | **Settings & Integrations** | `3ee5fcc4b53749a5b40da77d91918f0a` | 2560 × 4266 | `projects/11632535327186639718/screens/3ee5fcc4b53749a5b40da77d91918f0a` | **Complete** |

---

## 4. Screen Asset URLs & Technical Details

### Screen 1: Dashboard (`68d2d2c60f81473cbfeeb9c151573b02`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1Xlt8H4Y1QS3d1Avx0Pgkf5ixE0bnYr6lQ3Au_-N01vyiH6vD675NNSWOiVmUoTYOEBFL-RGFPTc2gZAkQ72_pzwZ7COXCkv_DL9NlR1ETy22P1bOPWbaNYL6qwglH5ANHu-WboUKv54VVkRD0-089O9AmcloiAd1Zs72pHXR5s2BACNmoB5U1cjKfSHJVGd_vwU1x9SRIKPjubxtgnpFQtv3d6zHQRBRuvtlxe-D1TUZU_0XvqVEH8Iy7g)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U3MWM0NGE0N2YwNDQ0YjBiMzYxNjU5YjVlMTAyYTFiEgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - `AppShell` with persistent sidebar, tenant context switcher (`Spice Garden - Indiranagar • TEN-001`), and engine telemetry pill.
  - 4 Summary Metric Cards: Source Orders Received (148), Canonical Orders (136), Pending Reviews (8), Open Conflicts (3).
  - Priority Reconciliation Review Queue table with candidate pairs, heuristic match scores (`94 / 100`), and conflict badges.
  - Channel distribution breakdown (WhatsApp 42, Zomato 68, Swiggy 38).
  - Live WebSocket ingestion stream showing canonical link events.

### Screen 2: Orders Management (`32e51a1d8bf74c558be0f3286decdbec`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1Ux76UY22EToMtNSoPWOzMi3J9j6mQDKXWg2Ll0Qfsk7MJCKzYQLeLydflVO2WRdZqpOVFr0AvzA80KD6g7dff1dol4PCjEjxJBfSBa-oqHcl6QnbKoCJqpW29HCFJF9g0HLYNSAbaTX0B98Div6IsB-qtHZdBtY0p9kV_3WaNwVVyuyDwpXaX-_qDyJfi1839NZHgb8y_pVUavZX66H90cHA0mhNMSXuizVbt5vwEkxu-KcW-nGssfQFqc)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA3YThmN2Y1NjQ2NjRlN2M4MWRhYmFkZWNkYTFkNWQzEgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - View Mode Toggle: `Canonical Orders (Truth) [1,028]` vs `Source Orders (Raw Intake) [1,142]`.
  - Comprehensive filter toolbar: channel, status, date range, amount bounds.
  - Dense operations ledger table with masked customer PII (`+91 98765 ****10`), tabular amounts (`₹756.00`), and channel provenance badges.
  - Interactive row expansion inspector demonstrating cross-channel link provenance (`CORR-20261012-8841`).

### Screen 3: Duplicate Review Queue (`535bf3880993414cb6f01089bb48c3aa`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1WZi-4i1vAZPVbwje-ylRGi-5c7JNB8DHTOX9pipHk93-SwSEe_2s7ygshgEIN4e_F7UpFjxVJPaXOANQmvWfxY0qgbksvx5yhDGmNQvH0Sk7XNm327avjL4s-FWcYLUIL-4B_umAYdQ8XeJiQaEfnjJGO2-kEyyvStNxT2c4WdobH4hnRoydzN5Tgi8Gh9A14cAbCMgeoLe5lT8Ps2OsGFXK3qHZ_MAlm7v_WaSYjk4LpBoVhNDjbP3hcT)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzUzNDRlMjMxYzBjYjQ4YTI5YTRmNWMwOGUxYmRlZmI5EgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - Operational SLA metric bar (`< 5 min target`, `Current Avg: 1m 42s`).
  - Slicing tabs: All Pending (4), High Urgency (2), Medium (1), Low (1), Resolved Today (18).
  - Explicitly labeled Match Score: `94 / 100 (v2.1 Heuristic Score - Non-probabilistic)`.
  - Material conflict signatures highlighting quantity differences (`2x vs 3x Paneer Tikka Roll`), modifier variance, and timestamp duplicates.
  - Docked batch operations bar (`Mark Safe as Separate Orders`, `Export Review Log`).

### Screen 4: Conflict Detail & Resolution (`f7cc6091fa2741dabfc0aadd817c95db`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1UXfOsE6DarWu7o076nOOxpJsxRJ-xlCwdCj_ggNAvDIX4DRf35CG98iFXgit3wYRLYgw4gbS5ZH8J8eVtX3znaFQqEIon2Di31MuTeOBp95kXGigyW602bbcGYDJyXAYvMePbrk_pgIVN9qLx2puzR6864TAJFvH-cRuS5hJpnzH9ZM4wJT4no4QAS_jDeCohSG_G4VoQbOLw6nAhm0sXsJs8yedCOsvl16qbj3zZkoW5CX6cmZyj-FCXq)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2QxNTRlOGIyNTMxZjRlMGQ4N2MxMDYwYWJlODE0YjBjEgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - **Zero Auto-Merge Warning Banner:** Explicit warning that quantities will *never* be summed without operator sign-off.
  - **Side-by-Side 3-Column Comparison Matrix:** Source A (Zomato ZOM-8921) vs Difference Column vs Source B (WhatsApp WAPP-104).
  - **Highlighted Line Item Diff:** Paneer Tikka Roll (Qty: 2 vs Qty: 3) with crimson conflict badge and financial delta (+₹240).
  - **Deterministic Score Breakdown:** Customer Phone (100%), Address (96%), Timestamp Proximity (92%), Catalog Overlap (90%).
  - **4 Explicit Resolution Actions:**
    1. *Confirm Authorized Update* (Recommended, selects canonical Qty = 3, requires reason, previews canonical state).
    2. *Confirm Duplicate Entry* (retains original Qty = 2, does NOT sum).
    3. *Confirm Separate Orders* (maintains two independent orders ORD-1042 and ORD-1043).
    4. *Keep Pending / Request Clarification* (triggers customer WhatsApp verification prompt).
  - Tamper-proof safety signoff checkbox and cryptographic session attribution.
  - Embedded audit history drawer for the candidate.

### Screen 5: Source Order Import Wizard (`7c15b02560364892835ddf30302b67d4`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1WDpdQTwjqFvcjyHhGXyPonfVwAvuEFk3D34yAhsKU-zMjoW5yaSOeUT4CZpsEiFMw4H59l7gWtJqhcva2FqHPD55Re56ejY7ZsgCWCD1I1VUwmyMehlEncvTzkxAvA_ggVLJYynYQe0cAZ9jTEHwYO5pefl9UCwfzhR2U1VzsSQg866N0ky12I95TuKa7pBRsnITy175l_SVp7kgXuJXtLLlToicXkoFSS02E4OyRoEq5ClIg33YygQyBT)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ3NDk4Y2M2NTgxYjQyM2U5ZTg2NDBkMTY0ZjFlNGI1EgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - Segmented Intake Tabs: Informal Text (Active), CSV Upload, Manual Entry Form.
  - Split-screen workspace: Left panel with raw Indian restaurant text input and SHA-256 idempotency key (`IDEM-WAPP-20261012-0041`).
  - Right panel with normalized field extraction, catalog SKU mapping (`SKU-PAN-01`, `SKU-MC-04`), confidence metrics, and uncertainty caution box.
  - Sticky bottom commit bar triggering deduplication checks.
  - Recent ingestion batches table.

### Screen 6: Product Catalog & Mappings (`15ffe851c22f443d8fb821b5cc6a8124`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1V7dr55sHNe6-Kj0nNVo819AMOjJA2aJR78sdL9IRETefAlyXTyqoUDwvRNK121rTve0jx-aEZNGKq2aAGsBqbWDxG2zBAbJGxvN97TrHc3ENTQu-DFNWITdgmtJ7EUCjdfq33ZV7MKq8gz2xyL_bRv1ztp8KpbDMsHo6-HXn7IkIzqXdGzw9f2KfdehnIos1lSNzJjWXKUor2P7kpgdCDs1LvfYG12O8b_dqP-LBz55ODSnkbiibXu6YOn)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2UxNzFkNDVhNmQ3YzRiZmE4YmYxMTQ3ZDcyOGQzMGJkEgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - Catalog summary metrics: 148 Canonical SKUs, 624 Channel Mappings, 3 Unmapped Aliases, 145 Active Items.
  - Dietary indicators (Veg vs Non-Veg), portion variants, and tabular base prices (`₹240.00`).
  - Slide-out mapping inspector for `SKU-PAN-01` showing Petpooja POS anchor, aggregator price variances, and Hinglish NLP alias chip tags.

### Screen 7: Immutable Audit History (`b076e36a8c8247cfb529c344aaf95cbc`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1WuB4HWt52-Kzx3silGbU9Eo0DArDr-E5jxyeT-YSvOlk8_NBD0g2Cvecq2ltflasQI2IQCJ6TRdWK7MDKnrYACDO8So-RyWkPDctXx1FBIMu9FKWojMHOSeC1x6i9EpYHhiSoxC9jXiGfRWnu76uLAdNhp_Vf1DfgfzYq5rsSxwqlljGbvKRpc0pWpBZvrFAuG1sXpMw5Hx8hUr5nFREGdUntCcv2zxHzlvoiMsEQaUoLfn1uo2eg7J9gO)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAxOWIwZGY5YWUzMTRlMzBiYjMxZGMxZjQ4NzgyZDQ3EgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - ISO-27001 Certified Append-Only ledger status and SHA-256 Merkle root telemetry (`0x88f29c4...b109`).
  - Action category filter pills (Operator Overrides, Duplicates, Canonical Merges, Rule Triggers).
  - Expanded Event Inspector for `AUD-88219` displaying side-by-side prior vs mutated JSON payloads, operator IP, session ID, rule override, and HMAC-SHA256 signature verification.
  - Strict append-only footer disclaimer.

### Screen 8: Settings & Integrations (`3ee5fcc4b53749a5b40da77d91918f0a`)
- **Screenshot:** [View Preview](https://lh3.googleusercontent.com/aida/AEtjO1X1TJXpg3-OIPoAiVjf07NyLAiu8KeGkIl0Ba_mzoCzpOKCtBl87CO9c_wZsYQln4c0LHUxyHFhWmUKEkgeqXSRTiXDhq2ePPXkJEE7N6KKj4sVKnaXGffi0WUxG7ErdLx2296ufYfN_xpiSa20U3mTHRI00STM2PvS3l1AhjhgSUlVe0doWf-Ce9EeZ9K4aZLXou4kxxOIUHzD9H6-ezY7sQBMg1qAbg-vzlnHGgcS1-MyOsua8hSx0oYG)
- **HTML Code:** [Download HTML](https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzhmNzIwZmU3OTM2ZDRjZTliNzc4NWFlNGE0NDg5ODI5EgsSBxCktvjipgYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTYzMjUzNTMyNzE4NjYzOTcxOA&filename=&opi=96797242)
- **Core Components:**
  - Business profile with read-only tenant ID (`TEN-001`), timezone (`Asia/Kolkata IST`), currency preview (`₹1,240.50`), and GSTIN.
  - Safe Integration Status Placeholders: WhatsApp (Sandbox Active), Petpooja POS (Production), Zomato (Production), Swiggy (Pending Setup), Manual CSV (Always Active). No claimed fake credentials.
  - OrderTruth AI Threshold Controls: Auto-merge slider (95/100), locked-on Quantity Mismatch guardrail (Rule #QNT-04), 60s temporal window, and 100m geo-radius.
  - Persistent save action bar with unsaved change detection.

---

## 5. Next Steps for Implementation

The frontend design specification and high-fidelity screen implementations in Stitch are complete. In accordance with `PHASES.md` and the project working agreement, the exact next phases are:

1. **Phase 1 --- Project Scaffold:**
   - Create React 18+ TypeScript Vite frontend and Node.js + Express + TypeScript backend.
   - Configure Tailwind CSS tokens matching `STITCH_DESIGN_SYSTEM.md`.
   - Setup `/health` endpoint, error middleware, and dev scripts.
2. **Phase 2 --- UI Shell & Component Assembly:**
   - Translate the Stitch HTML/CSS screens into reusable React components (`AppShell`, `ReviewQueueTable`, `OrderRecordPanel`, `ResolutionDialog`, etc.).
   - Wire mock fixtures strictly labelled as demo data.
