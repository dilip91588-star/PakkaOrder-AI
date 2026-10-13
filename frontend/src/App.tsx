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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Orders */}
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          {/* Review Queue & Side-by-Side Conflict Resolution */}
          <Route path="/review" element={<ReviewQueuePage />} />
          <Route path="/review/:id" element={<ConflictResolutionPage />} />

          {/* Imports (Text, CSV, Cashier Manual) */}
          <Route path="/imports" element={<ImportOrdersPage />} />

          {/* Product Catalog */}
          <Route path="/catalog" element={<ProductCatalogPage />} />

          {/* Audit Ledger */}
          <Route path="/audit" element={<AuditHistoryPage />} />

          {/* Console Settings */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
};

export default App;
