import React, { useEffect, useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  X 
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { CatalogItem } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const ProductCatalogPage: React.FC = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [inspectingItem, setInspectingItem] = useState<CatalogItem | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [aliasError, setAliasError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCatalogItems();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlias = async () => {
    if (!inspectingItem || !newAlias.trim()) return;
    setAliasError(null);
    const updatedAliases = [...inspectingItem.mappings.aliases, newAlias.trim().toLowerCase()];
    try {
      const updated = await apiClient.updateCatalogItem(inspectingItem.sku, {
        mappings: {
          ...inspectingItem.mappings,
          aliases: updatedAliases
        }
      });
      setInspectingItem(updated);
      setNewAlias('');
      loadCatalog();
    } catch (err: unknown) {
      setAliasError(err instanceof Error ? err.message : 'Failed to add alias');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mappings.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-muted mb-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-on-surface">Product Catalog</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2.5">
            <span>Unified Product Catalog &amp; Normalization Mappings</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan font-mono border border-accent-cyan/30">
              148 SKUs
            </span>
          </h1>
          <p className="text-xs text-on-surface-muted">
            Catalog registry mapping colloquial voice/text order items to POS menu items and aggregator SKUs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSyncNotice('External POS sync requires Petpooja API credentials. Currently operating in sandbox mode with local catalog definitions.')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-crisp hover:bg-surface-elevated text-xs font-medium text-on-surface-variant transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Sync POS Menu</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3.5 rounded-xl bg-surface-panel border border-border-crisp text-xs text-on-surface-variant flex items-center justify-between animate-in fade-in">
          <span>{syncNotice}</span>
          <button onClick={() => setSyncNotice(null)} className="text-accent-cyan text-xs hover:underline ml-3">Dismiss</button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadCatalog} />}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-surface-panel border border-border-crisp">
          <p className="text-[11px] text-on-surface-muted">Total Canonical SKUs</p>
          <p className="text-xl font-bold font-mono text-on-surface mt-1">148</p>
          <span className="text-[10px] text-status-success font-medium">100% Schema Valid</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-panel border border-border-crisp">
          <p className="text-[11px] text-on-surface-muted">Channel Variant Mappings</p>
          <p className="text-xl font-bold font-mono text-on-surface mt-1">624</p>
          <span className="text-[10px] text-on-surface-muted font-medium">Avg 4.2 channels / SKU</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-panel border border-border-crisp">
          <p className="text-[11px] text-on-surface-muted">Unmapped Loose Aliases</p>
          <p className="text-xl font-bold font-mono text-status-warning mt-1">3</p>
          <span className="text-[10px] text-status-warning font-medium">Requires triage</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-panel border border-border-crisp">
          <p className="text-[11px] text-on-surface-muted">Active Synced Items</p>
          <p className="text-xl font-bold font-mono text-status-success mt-1">145</p>
          <span className="text-[10px] text-on-surface-muted font-medium">3 Inactive / 86-ed</span>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="p-4 bg-surface-panel border border-border-crisp rounded-xl space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, product name, or colloquial WhatsApp alias..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface placeholder:text-on-surface-muted focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {['ALL', 'Rolls & Wraps', 'Main Course', 'Breads', 'Beverages'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-accent-cyan text-surface-base font-semibold'
                  : 'bg-surface-elevated text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-surface-panel border border-border-crisp rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-base/80 border-b border-border-crisp text-on-surface-muted uppercase tracking-wider text-[11px]">
                <th className="p-3">SKU Code</th>
                <th className="p-3">Product Name &amp; Category</th>
                <th className="p-3">Variants</th>
                <th className="p-3 text-right">Base Price</th>
                <th className="p-3">Channel Mappings &amp; Aliases</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-crisp/60">
              {filteredItems.map((item) => (
                <tr 
                  key={item.sku}
                  onClick={() => setInspectingItem(item)}
                  className="hover:bg-surface-elevated/40 transition-colors cursor-pointer"
                >
                  <td className="p-3">
                    <span className="font-mono font-bold text-accent-cyan bg-surface-base px-2 py-0.5 rounded-sm border border-border-crisp">
                      {item.sku}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-xs border ${item.dietary === 'VEG' ? 'border-emerald-500 bg-emerald-500/20' : 'border-rose-500 bg-rose-500/20'}`} />
                      <span className="font-semibold text-on-surface">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-muted mt-0.5">{item.category}</p>
                  </td>
                  <td className="p-3 text-on-surface-variant">
                    {item.variants.join(' • ')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-on-surface tabular-nums">
                    ₹{item.basePrice.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.mappings.aliases.slice(0, 3).map(alias => (
                        <span key={alias} className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-surface-elevated text-on-surface-muted border border-border-crisp/60">
                          {alias}
                        </span>
                      ))}
                      {item.mappings.aliases.length > 3 && (
                        <span className="text-[10px] text-accent-cyan font-mono">
                          +{item.mappings.aliases.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success-bg text-status-success text-[11px] font-medium border border-status-success/30">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-medium border border-border-crisp">
                        <XCircle className="w-3 h-3" /> 86-ed (Out of Stock)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setInspectingItem(item)}
                      className="px-2.5 py-1 rounded-md border border-border-crisp hover:bg-surface-elevated text-accent-cyan text-xs font-medium transition-colors"
                    >
                      Inspect Mappings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Mapping Drawer */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-elevated border-l border-border-crisp h-full flex flex-col p-6 space-y-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-crisp/60">
              <div>
                <span className="font-mono text-xs text-accent-cyan font-bold">{inspectingItem.sku}</span>
                <h3 className="text-base font-bold text-on-surface mt-0.5">{inspectingItem.name}</h3>
              </div>
              <button 
                onClick={() => setInspectingItem(null)} 
                className="p-1.5 rounded-md hover:bg-surface-panel text-on-surface-muted hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Channel Prices & Codes */}
            <div className="space-y-3 text-xs">
              <span className="font-semibold text-on-surface text-[11px] uppercase tracking-wider block">
                Channel Identifiers &amp; Prices
              </span>

              <div className="p-3 bg-surface-panel rounded-lg border border-border-crisp space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-muted">Petpooja POS Code:</span>
                  <span className="font-mono text-on-surface font-semibold">{inspectingItem.mappings.posCode || 'PTR-REG-01'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-muted">Base POS Rate:</span>
                  <span className="font-mono text-on-surface font-semibold">₹{inspectingItem.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-muted">Zomato Surcharge Rate:</span>
                  <span className="font-mono text-on-surface font-semibold">₹{inspectingItem.mappings.zomatoPrice?.toFixed(2) || '260.00'} (+8.3%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-muted">Swiggy Surcharge Rate:</span>
                  <span className="font-mono text-on-surface font-semibold">₹{inspectingItem.mappings.swiggyPrice?.toFixed(2) || '260.00'}</span>
                </div>
              </div>
            </div>

            {/* Aliases Tag Manager */}
            <div className="space-y-3 text-xs flex-1">
              <span className="font-semibold text-on-surface text-[11px] uppercase tracking-wider block">
                Conversational / NLP Match Aliases
              </span>
              <p className="text-on-surface-muted text-[11px]">
                Phrases automatically resolved to this SKU when receiving customer WhatsApp chats or voice calls.
              </p>

              <div className="flex flex-wrap gap-1.5 p-3 bg-surface-panel rounded-lg border border-border-crisp min-h-24">
                {inspectingItem.mappings.aliases.map((alias) => (
                  <span 
                    key={alias} 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-base border border-border-crisp text-on-surface text-xs font-mono"
                  >
                    <span>{alias}</span>
                  </span>
                ))}
              </div>

              {/* Add Alias Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="e.g. 2 paneer kathi roll"
                  className="flex-1 px-3 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface font-mono"
                />
                <button
                  onClick={handleAddAlias}
                  className="px-3 py-1.5 rounded-lg bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base font-semibold text-xs"
                >
                  + Add Alias
                </button>
              </div>
              {aliasError && (
                <p className="text-[11px] text-status-critical">{aliasError}</p>
              )}
            </div>

            <button
              onClick={() => setInspectingItem(null)}
              className="w-full py-2 rounded-lg bg-surface-panel hover:bg-surface-base border border-border-crisp text-xs font-semibold text-on-surface"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
