import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersListPage } from './pages/OrdersListPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { ConflictResolutionPage } from './pages/ConflictResolutionPage';
import { ImportOrdersPage } from './pages/ImportOrdersPage';
import { ProductCatalogPage } from './pages/ProductCatalogPage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { KitchenDisplayPage } from './pages/KitchenDisplayPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing Landing Page */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Authentication & Outlet Switcher */}
        <Route path="/login" element={<LoginPage />} />

        {/* Fullscreen Touch Kitchen Display System */}
        <Route path="/kds" element={<KitchenDisplayPage />} />

        {/* Core Operations Console (Wrapped in AppShell) */}
        <Route
          path="/*"
          element={
            <AppShell>
              <Routes>
                {/* Operations Overview Dashboard */}
                <Route path="/" element={<DashboardPage />} />

                {/* Orders Inbox & Detail */}
                <Route path="/orders" element={<OrdersListPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />

                {/* Conflict Review Queue & Side-by-Side Resolution */}
                <Route path="/review" element={<ReviewQueuePage />} />
                <Route path="/review/:id" element={<ConflictResolutionPage />} />

                {/* AI Order Ingestion (Voice, Hinglish Text, CSV, POS) */}
                <Route path="/imports" element={<ImportOrdersPage />} />

                {/* Product Catalog & Normalization Mappings */}
                <Route path="/catalog" element={<ProductCatalogPage />} />

                {/* Immutable Audit History & Governance */}
                <Route path="/audit" element={<AuditHistoryPage />} />

                {/* Console Settings & Guardrails */}
                <Route path="/settings" element={<SettingsPage />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
