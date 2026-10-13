# PakkaOrder AI — Frontend Application

This directory contains the client-side single page application for **PakkaOrder AI**, built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**, styled using the Google Stitch-inspired design system.

## Features

- **Operations Dashboard**: Real-time KPI metrics, active order alerts, reconciliation rates, and channel distribution.
- **Unified Orders Inbox**: Live multi-channel order ledger with status filters, search, and detail inspector.
- **Conflict Review Queue**: AI-detected duplicate candidates with confidence scores and material conflict alerts.
- **Side-by-Side Resolution Workspace**: Visual diff comparisons, line-item selection, quantity validation, and tamper-proof audit trail integration.
- **AI Ingestion Workbench**: Interactive natural language testbench for multimodal WhatsApp/audio extraction.
- **Kitchen Display System (KDS)**: Real-time ticket board grouped by status (New, Preparing, Ready) with sound alerts and priority tags.
- **Product Catalog Management**: Canonical dish directory with alias mappings, price tiers, and inventory toggles.
- **Audit & Compliance Log**: Immutable, cryptographically verified record of all operator actions and system merges.
- **Restaurant Settings & Webhooks**: Configuration panel for WhatsApp Business Cloud API, matching thresholds, and outlet details.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure `VITE_API_URL` if your backend runs on a custom port or domain:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

### 3. Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

The production bundle will be output to `frontend/dist/`.

### 5. Linting

```bash
npm run lint
```
