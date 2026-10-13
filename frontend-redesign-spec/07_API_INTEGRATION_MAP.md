# 07 — Backend API Integration & State Mapping

This document provides a comprehensive mapping of every existing screen, component, and user interaction to the underlying backend REST endpoints, data structures, authentication headers, and reactive UI state updates.

---

## 1. Authentication & Security Contract

* **Tenant Scoping Header**: Every API request made from the frontend attaches the trusted tenant identification header:
  ```http
  x-tenant-code: TEN-001
  ```
* **Request Correlation**: The server injects and returns an `x-request-id` header on every response.
* **CORS Scope**: Configured for local development (`http://localhost:5173`).
* **Error Envelope (RFC 7807 Compliant)**:
  ```json
  {
    "error": {
      "code": "BAD_REQUEST",
      "message": "Detailed failure description",
      "requestId": "req_1728840000_abc123",
      "details": {}
    }
  }
  ```

---

## 2. Interaction-to-API Mappings (`PAGE → COMPONENT → ACTION → API → UI UPDATE`)

### 2.1 Screen: Operational Dashboard (`/`)

#### Interaction 1: Page Mount / Initial Data Load
* **Component**: `DashboardPage`
* **User Action**: Navigates to `/`
* **API Endpoint**: `GET /api/v1/duplicate-candidates`
* **HTTP Method**: `GET`
* **Headers**: `x-tenant-code: TEN-001`
* **Query Parameters**: None (retrieves active candidates)
* **Response Structure**:
  ```json
  {
    "success": true,
    "count": 4,
    "candidates": [
      {
        "id": "cand_1",
        "candidatePairId": "CAN-8841",
        "heuristicScore": 94,
        "conflictType": "QUANTITY_MISMATCH",
        "severity": "CRITICAL",
        "status": "PENDING",
        "sourceA": { "channel": "ZOMATO", "customerName": "Rohan Gupta", "totalAmount": 520 },
        "sourceB": { "channel": "WHATSAPP", "customerName": "Rohan Gupta", "totalAmount": 760 }
      }
    ]
  }
  ```
* **UI Update**: Calculates pending counts, populates the 4 KPI cards, and renders the top 3 high-priority candidate items in the dashboard widget.

#### Interaction 2: Engine Health Probe
* **Component**: `TopNavbar` / `Sidebar`
* **User Action**: Automatic background poll on mount
* **API Endpoint**: `GET /health`
* **HTTP Method**: `GET`
* **Response Structure**:
  ```json
  {
    "status": "HEALTHY",
    "service": "PakkaOrderAI-Backend",
    "uptimeSeconds": 1420,
    "database": { "connected": true, "serverVersion": "8.0.43" }
  }
  ```
* **UI Update**: Sets sidebar status pill to green (*"🟢 Database Connected (8.0.43)"*).

---

### 2.2 Screen: Unified Orders Inbox (`/orders`)

#### Interaction 1: Fetch Orders Listing
* **Component**: `OrdersListPage`
* **User Action**: Page load, switch view toggle, or change channel filter
* **API Endpoint**: `GET /api/v1/source-orders`
* **HTTP Method**: `GET`
* **Headers**: `x-tenant-code: TEN-001`
* **Query Parameters**: Optional `?channel=WHATSAPP&limit=50&offset=0`
* **Response Structure**:
  ```json
  {
    "success": true,
    "count": 148,
    "orders": [
      {
        "id": 1,
        "external_order_id": "WA-901",
        "channel": "WHATSAPP",
        "customer_name": "Aditya Nair",
        "normalized_phone": "+919811200055",
        "delivery_address": "HAL 2nd Stage, Indiranagar",
        "total_amount": "441.00",
        "currency": "INR",
        "items": [
          { "sku": "SKU-PAN-01", "name": "Paneer Tikka Roll", "quantity": 1, "unit_price": "240.00" }
        ],
        "created_at": "2026-10-12T11:55:00.000Z"
      }
    ]
  }
  ```
* **UI Update**: Table renders rows with channel badges, item counts, customer names, and total amounts.

#### Interaction 2: Inspect Raw Source Payload
* **Component**: `RawPayloadModal`
* **User Action**: Clicks *"Inspect JSON"* button on any order row
* **API Endpoint**: `GET /api/v1/source-orders/:id`
* **HTTP Method**: `GET`
* **Response Structure**: Returns single order record containing `original_payload` (the raw Meta WhatsApp webhook JSON or POS XML string preserved verbatim).
* **UI Update**: Modal opens displaying formatted syntax-highlighted JSON with 1-click copy.

---

### 2.3 Screen: Conflict Review Queue (`/review`)

#### Interaction 1: Load Active Candidate Queue
* **Component**: `ReviewQueuePage`
* **User Action**: Navigates to `/review` or changes severity tab
* **API Endpoint**: `GET /api/v1/duplicate-candidates`
* **HTTP Method**: `GET`
* **Headers**: `x-tenant-code: TEN-001`
* **Response Structure**: Array of `DuplicateCandidate` objects including `heuristicScore`, `severity`, `conflictType`, `slaExpiresAt`, and source order snapshots.
* **UI Update**: Renders queue table with urgency badges, score pills, and conflict descriptions.

---

### 2.4 Screen: Side-by-Side Conflict Resolution Workspace (`/review/:id`)

#### Interaction 1: Load Candidate Pair Details
* **Component**: `ConflictResolutionPage`
* **User Action**: Enters `/review/:id`
* **API Endpoint**: `GET /api/v1/duplicate-candidates/:id`
* **HTTP Method**: `GET`
* **Response Structure**: Detailed candidate object containing full item breakdown for both Source A and Source B, field-level conflict metadata, and timestamps.
* **UI Update**: Renders dual comparison panels and highlights contradictory line items in red.

#### Interaction 2: Fetch AI Matching Explanation
* **Component**: `AIInsightPanel`
* **User Action**: Automatic fetch on candidate load
* **API Endpoint**: `GET /api/v1/duplicate-candidates/:id/explain`
* **HTTP Method**: `GET`
* **Response Structure**:
  ```json
  {
    "success": true,
    "candidateId": "cand_1",
    "explanation": "Customer placed Zomato order #ZOM-8841 for 2 Paneer Rolls. Five minutes later, the same customer sent a WhatsApp chat specifying 3 rolls. Address and phone match 100%. This represents a customer-initiated quantity revision.",
    "modelName": "gemini-3.1-flash-lite-preview",
    "promptVersion": "match-explanation-v1",
    "signals": [
      { "name": "Phone Match", "score": 100 },
      { "name": "Address Match", "score": 95 },
      { "name": "Time Proximity", "score": 92 }
    ]
  }
  ```
* **UI Update**: Populates the Gemini explanation box above the side-by-side workspace.

#### Interaction 3: Execute Atomic Resolution
* **Component**: `VerificationModal` → `ApprovalControls`
* **User Action**: Selects action (e.g. `CONFIRM_UPDATE`), inputs operator reason, clicks *"Confirm Resolution"*
* **API Endpoint**: `POST /api/v1/duplicate-candidates/:id/resolve`
* **HTTP Method**: `POST`
* **Headers**: `Content-Type: application/json`, `x-tenant-code: TEN-001`
* **Request Payload**:
  ```json
  {
    "action": "CONFIRM_UPDATE",
    "selectedCanonicalQuantity": 3,
    "reason": "Customer confirmed order modification via WhatsApp phone conversation.",
    "authorizingOperator": "Pranav M. (Lead Ops)"
  }
  ```
* **Response Structure**:
  ```json
  {
    "success": true,
    "message": "Candidate resolved successfully as CONFIRM_UPDATE.",
    "candidateId": "cand_1",
    "canonicalOrderId": 1042,
    "auditEventId": "AUD-99120",
    "auditSignature": "hmac_sha256_e8f3...a9b1"
  }
  ```
* **UI Update**: Closes modal, displays green success notification, reloads updated candidate state (shows *"RESOLVED"* badge), and enables navigation back to `/review`.

---

### 2.5 Screen: Order Ingestion & AI Workbench (`/imports`)

#### Interaction 1: Conversational AI Extraction
* **Component**: `ImportOrdersPage` (Tab 1: Conversational AI)
* **User Action**: Pastes chat text, clicks *"Extract with Gemini"*
* **API Endpoint**: `POST /api/v1/source-orders/extract`
* **HTTP Method**: `POST`
* **Request Payload**:
  ```json
  {
    "text": "bhaiya 2 paneer roll aur 1 butter chicken bhej do jaldi prestige ozone indiranagar flat 402 me",
    "customerPhone": "+919876543210",
    "channel": "WHATSAPP"
  }
  ```
* **Response Structure**:
  ```json
  {
    "success": true,
    "extracted": {
      "customerName": "Customer (Prestige Ozone)",
      "deliveryAddress": "Prestige Ozone, Indiranagar, Flat 402",
      "items": [
        { "name": "Paneer Roll", "sku": "SKU-PAN-01", "quantity": 2, "unitPrice": 240, "confidence": 0.98 },
        { "name": "Butter Chicken", "sku": "SKU-CHK-02", "quantity": 1, "unitPrice": 380, "confidence": 0.95 }
      ],
      "specialInstructions": "Deliver quickly"
    }
  }
  ```
* **UI Update**: Populates the live parsed order card on the right pane with editable fields.

#### Interaction 2: Commit Extracted Order into Engine
* **Component**: `ImportOrdersPage`
* **User Action**: Checks human confirmation, clicks *"Commit Verified Order"*
* **API Endpoint**: `POST /api/v1/source-orders`
* **HTTP Method**: `POST`
* **Request Payload**: Standard source order ingestion schema containing external order ID, customer details, line items, and raw payload snippet.
* **Response Structure**: `{ "success": true, "orderId": 149, "idempotencyKey": "MAN_1728840120" }`
* **UI Update**: Displays success toast and resets form for next intake.

#### Interaction 3: Batch CSV Import
* **Component**: `ImportOrdersPage` (Tab 2: CSV Upload)
* **User Action**: Drops CSV file, clicks *"Ingest Valid Rows"*
* **API Endpoint**: `POST /api/v1/source-orders/import-csv`
* **HTTP Method**: `POST`
* **Request Payload**: Multi-part or raw CSV text payload.
* **Response Structure**:
  ```json
  {
    "success": true,
    "totalRows": 4,
    "importedCount": 3,
    "errorCount": 1,
    "errors": [
      { "row": 4, "error": "Missing mandatory channel header or negative amount." }
    ]
  }
  ```
* **UI Update**: Renders per-row validation report table.

---

### 2.6 Screen: Settings & Integrations Console (`/settings`)

#### Interaction 1: Check WhatsApp Webhook & Channel Health
* **Component**: `SettingsPage`
* **User Action**: Mounts `/settings`
* **API Endpoint**: `GET /api/v1/channels/whatsapp/status`
* **HTTP Method**: `GET`
* **Response Structure**:
  ```json
  {
    "configured": true,
    "webhookVerified": true,
    "mode": "SANDBOX_DEVELOPMENT",
    "phoneNumberId": "10492817281",
    "verifyTokenConfigured": true
  }
  ```
* **UI Update**: Displays green status pill on WhatsApp card with webhook callback verification badge.

---

## 3. Real-Time Update Strategy

* **Current Implementation**: On-demand polling and manual trigger via *"Sync Channels"* button in TopNavbar.
* **Redesign Strategy for Google Stitch**:
  * Implement an optimistic UI update model: upon resolving a candidate, the local queue state immediately updates before refetching.
  * 30-second interval polling for the Review Queue counter badge when the window is in focus.
