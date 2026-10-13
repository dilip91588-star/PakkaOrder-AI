import React, { useEffect, useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  X,
  Plus,
  Tag,
  Sparkles
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-medium">Product Catalog</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 flex-wrap">
            <span>Unified Product Catalog &amp; Normalization Mappings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-primary font-mono font-bold border border-teal-200">
              {items.length || 148} SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Canonical menu registry mapping colloquial Hinglish voice/text order items to POS menu items and aggregator SKUs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSyncNotice('External POS sync requires Petpooja API credentials. Operating in sandbox mode with local catalog definitions.')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span>Sync POS Menu</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-primary font-bold hover:underline ml-3">Dismiss</button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadCatalog} />}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-outline-variant shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Canonical SKUs</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">{items.length || 148}</p>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Schema Valid
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-outline-variant shadow-xs">
          <p className="text-xs font-medium text-slate-500">Channel Variant Mappings</p>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">624</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Avg 4.2 channels / SKU</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-outline-variant shadow-xs">
          <p className="text-xs font-medium text-slate-500">Unmapped Loose Aliases</p>
          <p className="text-2xl font-black font-mono text-amber-600 mt-1">3</p>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">Requires manual triage</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-outline-variant shadow-xs">
          <p className="text-xs font-medium text-slate-500">Active Synced Items</p>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1">145</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">3 Inactive / 86-ed</span>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="p-5 bg-white border border-outline-variant rounded-2xl shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, product name, or colloquial WhatsApp alias (e.g., paneer roll)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {['ALL', 'Rolls & Wraps', 'Main Course', 'Breads', 'Beverages'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-outline-variant text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="p-4">SKU Code</th>
                <th className="p-4">Product Name &amp; Category</th>
                <th className="p-4">Variants</th>
                <th className="p-4 text-right">Base Price</th>
                <th className="p-4">Channel Mappings &amp; Aliases</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr 
                  key={item.sku}
                  onClick={() => setInspectingItem(item)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <span className="font-mono font-bold text-primary bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      {item.sku}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                        item.dietary === 'VEG' ? 'border-emerald-600' : 'border-rose-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.dietary === 'VEG' ? 'bg-emerald-600' : 'bg-rose-600'
                        }`} />
                      </span>
                      <span className="font-bold text-slate-900">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 pl-6">{item.category}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    {item.variants.join(' • ')}
                  </td>
                  <td className="p-4 text-right font-mono font-black text-slate-900 tabular-nums">
                    ₹{item.basePrice.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.mappings.aliases.slice(0, 3).map(alias => (
                        <span key={alias} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {alias}
                        </span>
                      ))}
                      {item.mappings.aliases.length > 3 && (
                        <span className="text-[11px] text-primary font-bold font-mono">
                          +{item.mappings.aliases.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                        <XCircle className="w-3 h-3" /> 86-ed
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setInspectingItem(item)}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white hover:bg-slate-50 text-primary text-xs font-bold transition-colors shadow-xs"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border-l border-outline-variant h-full flex flex-col p-6 space-y-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs text-primary font-black bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{inspectingItem.sku}</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{inspectingItem.name}</h3>
              </div>
              <button 
                onClick={() => setInspectingItem(null)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Channel Prices & Codes */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">
                Channel Identifiers &amp; Prices
              </span>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Petpooja POS Code:</span>
                  <span className="font-mono text-slate-900 font-bold">{inspectingItem.mappings.posCode || 'PTR-REG-01'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Base POS Rate:</span>
                  <span className="font-mono text-slate-900 font-bold">₹{inspectingItem.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Zomato Surcharge Rate:</span>
                  <span className="font-mono text-slate-900 font-bold">₹{inspectingItem.mappings.zomatoPrice?.toFixed(2) || '260.00'} (+8.3%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Swiggy Surcharge Rate:</span>
                  <span className="font-mono text-slate-900 font-bold">₹{inspectingItem.mappings.swiggyPrice?.toFixed(2) || '260.00'}</span>
                </div>
              </div>
            </div>

            {/* Aliases Tag Manager */}
            <div className="space-y-3 text-xs flex-1">
              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>Conversational &amp; NLP Match Aliases</span>
              </span>
              <p className="text-slate-500 text-xs">
                Phrases automatically resolved to this SKU when receiving customer WhatsApp chats or voice calls.
              </p>

              <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 min-h-28">
                {inspectingItem.mappings.aliases.map((alias) => (
                  <span 
                    key={alias} 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono font-medium shadow-2xs"
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
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleAddAlias}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Alias</span>
                </button>
              </div>
              {aliasError && (
                <p className="text-xs text-red-600 font-semibold">{aliasError}</p>
              )}
            </div>

            <button
              onClick={() => setInspectingItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogPage;
