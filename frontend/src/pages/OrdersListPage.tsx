import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  FileCode,
  Copy,
  Check,
  X
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { CanonicalOrder, SourceOrder, Channel } from '../types';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const OrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'CANONICAL' | 'SOURCE'>('CANONICAL');
  const [canonicalOrders, setCanonicalOrders] = useState<CanonicalOrder[]>([]);
  const [sourceOrders, setSourceOrders] = useState<SourceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [inspectPayload, setInspectPayload] = useState<{ id: string; payload: string } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const [canonicals, sources] = await Promise.all([
        apiClient.getCanonicalOrders(),
        apiClient.getSourceOrders()
      ]);
      setCanonicalOrders(canonicals);
      setSourceOrders(sources);
      if (canonicals.length > 0) {
        setExpandedRow(canonicals[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredCanonicals = canonicalOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesChannel = 
      selectedChannel === 'ALL' || order.channels.includes(selectedChannel as Channel);
    return matchesSearch && matchesChannel;
  });

  const filteredSources = sourceOrders.filter(source => {
    const matchesSearch = 
      source.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.customerPhone.includes(searchQuery);
    const matchesChannel = 
      selectedChannel === 'ALL' || source.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  const handleExportCsv = () => {
    if (viewMode === 'CANONICAL') {
      const headers = ['Order Number', 'Status', 'Channels', 'Customer', 'Phone', 'Items Count', 'Total Amount', 'Created At'];
      const rows = filteredCanonicals.map(o => [
        `"${o.orderNumber}"`,
        `"${o.status}"`,
        `"${o.channels.join(';')}"`,
        `"${o.customerName}"`,
        `"${o.customerPhone}"`,
        o.items.length,
        o.totalAmount,
        `"${o.createdAt}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `canonical_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Source ID', 'Reference ID', 'Channel', 'Customer', 'Phone', 'Amount', 'Status'];
      const rows = filteredSources.map(s => [
        `"${s.id}"`,
        `"${s.referenceId}"`,
        `"${s.channel}"`,
        `"${s.customerName}"`,
        `"${s.customerPhone}"`,
        s.totalAmount,
        `"${s.status}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `source_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyPayload = () => {
    if (!inspectPayload) return;
    navigator.clipboard.writeText(inspectPayload.payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Unified Orders Inbox</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Compare canonical reconciled master orders against raw multi-channel ingestion records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Dual View Segmented Control */}
          <div className="p-1 bg-[#eff4ff] border border-[#dce9ff] rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('CANONICAL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'CANONICAL'
                  ? 'bg-white text-[#005c55] shadow-xs border border-[#bdc9c6]/50'
                  : 'text-[#64748B] hover:text-[#0b1c30]'
              }`}
            >
              Master Orders ({canonicalOrders.length})
            </button>
            <button
              onClick={() => setViewMode('SOURCE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'SOURCE'
                  ? 'bg-white text-[#005c55] shadow-xs border border-[#bdc9c6]/50'
                  : 'text-[#64748B] hover:text-[#0b1c30]'
              }`}
            >
              Raw Platform Ingestion ({sourceOrders.length})
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e2e8f0] text-slate-700 hover:bg-[#f8f9ff] text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadOrders} />}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer name, masked phone (+91), or dish name..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:border-[#0f766e] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'WHATSAPP', 'ZOMATO', 'SWIGGY', 'POS'].map(ch => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedChannel === ch
                  ? 'bg-[#0f766e] text-white shadow-xs'
                  : 'bg-[#f8f9ff] text-[#64748B] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Order Identifier</th>
                <th className="py-3 px-4">Channel Origin</th>
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {viewMode === 'CANONICAL' ? (
                filteredCanonicals.map(order => {
                  const isExpanded = expandedRow === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        className={`hover:bg-[#f8f9ff] transition-colors cursor-pointer ${isExpanded ? 'bg-[#eff4ff]/30' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                      >
                        <td className="py-3 px-4 text-[#64748B]">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-[#0f766e]" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0b1c30]">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {order.channels.map(ch => <ChannelBadge key={ch} channel={ch} />)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-[11px] font-mono text-[#64748B]">{order.customerPhone}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <span>{order.items.length} items</span>
                          <span className="text-[#64748B] text-[11px] block truncate max-w-xs">
                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={order.sourceOrderIds.length > 1 ? 'MERGED_CANONICAL' : 'CANONICAL_CLEAN'} />
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="text-[#0f766e] hover:underline font-semibold"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Line Items Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#f8f9ff]/70 border-b border-[#e2e8f0]">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-2xs max-w-3xl space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 pb-2 border-b border-[#f1f5f9]">
                                <span>Itemized Preparation Breakdown</span>
                                <span className="font-mono text-[#0f766e] text-[11px]">Correlation: {order.correlationHash}</span>
                              </div>
                              <div className="space-y-1">
                                {order.items.map((itm, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs text-slate-800 py-1 border-b border-[#f8f9ff] last:border-0">
                                    <span className="flex items-center gap-2">
                                      <span className="font-bold font-mono text-[#0f766e]">{itm.quantity}x</span>
                                      <span className="font-medium">{itm.name}</span>
                                      <span className="text-[10px] font-mono text-[#64748B]">({itm.sku})</span>
                                    </span>
                                    <span className="font-mono font-semibold">₹{(itm.unitPrice * itm.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                filteredSources.map(source => (
                  <tr key={source.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3 px-4 text-[#64748B]">
                      <FileCode className="w-4 h-4 text-[#0f766e]" />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0b1c30]">
                      {source.referenceId}
                    </td>
                    <td className="py-3 px-4">
                      <ChannelBadge channel={source.channel} />
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <p className="font-medium">{source.customerName}</p>
                      <p className="text-[11px] font-mono text-[#64748B]">{source.customerPhone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span>{source.items.length} items</span>
                      <span className="text-[#64748B] text-[11px] block truncate max-w-xs">
                        {source.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{source.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={source.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setInspectPayload({
                          id: source.referenceId,
                          payload: JSON.stringify(source, null, 2)
                        })}
                        className="text-[#64748B] hover:text-[#0b1c30] font-mono text-[11px]"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${source.id}`)}
                        className="text-[#0f766e] hover:underline font-semibold"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {((viewMode === 'CANONICAL' && filteredCanonicals.length === 0) || (viewMode === 'SOURCE' && filteredSources.length === 0)) && (
          <div className="p-12 text-center text-xs text-[#64748B]">
            No orders match the current search filter.
          </div>
        )}
      </div>

      {/* Raw Payload Modal */}
      {inspectPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0b1c30]">Raw Source Record Payload</h3>
                <p className="text-[11px] font-mono text-[#64748B]">{inspectPayload.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyPayload}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#e2e8f0] hover:bg-[#f8f9ff] text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setInspectPayload(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-[#f8f9ff]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto bg-[#f8f9ff]">
              <pre className="font-mono text-xs text-slate-800 p-3 bg-white rounded-lg border border-[#e2e8f0] overflow-x-auto">
                {inspectPayload.payload}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
