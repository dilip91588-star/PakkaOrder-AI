import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  ArrowRightLeft, 
  CheckCircle2, 
  Eye, 
  FileCode 
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { CanonicalOrder, SourceOrder, Channel } from '../types';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
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
  const [expandedRow, setExpandedRow] = useState<string | null>('CAN-ORD-1042');
  const [inspectPayload, setInspectPayload] = useState<{ id: string; payload: string } | null>(null);

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
        `"${o.channels.join(' + ')}"`,
        `"${o.customerName}"`,
        `"${o.customerPhone}"`,
        o.items.reduce((s, it) => s + it.quantity, 0),
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
      const headers = ['Reference ID', 'Channel', 'Customer', 'Phone', 'Total Amount', 'Received At', 'Status'];
      const rows = filteredSources.map(s => [
        `"${s.referenceId}"`,
        `"${s.channel}"`,
        `"${s.customerName}"`,
        `"${s.customerPhone}"`,
        s.totalAmount,
        `"${s.receivedAt}"`,
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

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-muted mb-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-on-surface">Orders Management</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface">Orders & Reconciliation Ledger</h1>
          <p className="text-xs text-on-surface-muted">
            Inspect canonical single-truth records alongside raw ingest source payloads.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-surface-panel border border-border-crisp rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('CANONICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'CANONICAL'
                ? 'bg-accent-cyan text-surface-base shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Canonical Orders (Truth) [{canonicalOrders.length}]
          </button>
          <button
            onClick={() => setViewMode('SOURCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'SOURCE'
                ? 'bg-accent-cyan text-surface-base shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Source Orders (Raw Intake) [{sourceOrders.length}]
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadOrders} />}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-surface-panel border border-border-crisp rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer, masked phone, or item name..."
            className="w-full pl-9 pr-4 py-2 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface placeholder:text-on-surface-muted focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Channel Filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-2 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="POS">POS Terminal</option>
            <option value="ZOMATO">Zomato</option>
            <option value="SWIGGY">Swiggy</option>
            <option value="MANUAL">Manual</option>
          </select>

          {/* Export CSV button */}
          <button 
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-crisp hover:bg-surface-elevated text-xs font-medium text-on-surface-variant transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Dense Table */}
      {viewMode === 'CANONICAL' ? (
        <div className="bg-surface-panel border border-border-crisp rounded-xl overflow-hidden shadow-xs">
          {filteredCanonicals.length === 0 ? (
            <EmptyState 
              title="No canonical orders found" 
              description="Adjust your search query or channel filter to view records." 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-base/80 border-b border-border-crisp text-on-surface-muted uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-8"></th>
                    <th className="p-3">Order Number & Hash</th>
                    <th className="p-3">Channel Provenance</th>
                    <th className="p-3">Customer Entity</th>
                    <th className="p-3">Items Summary</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-crisp/60">
                  {filteredCanonicals.map((order) => {
                    const isExpanded = expandedRow === order.id;
                    return (
                      <React.Fragment key={order.id}>
                        <tr 
                          onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                          className={`hover:bg-surface-elevated/50 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-surface-elevated/30' : ''
                          }`}
                        >
                          <td className="p-3 text-on-surface-muted">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-accent-cyan" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-accent-cyan">{order.orderNumber}</span>
                            <p className="font-mono text-[10px] text-on-surface-muted">{order.correlationHash}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {order.channels.map(ch => (
                                <ChannelBadge key={ch} channel={ch} size="sm" />
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-on-surface">{order.customerName}</p>
                            <p className="font-mono text-[11px] text-on-surface-muted">{order.customerPhone}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-on-surface font-medium truncate max-w-xs">
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </p>
                            <p className="text-[11px] text-on-surface-muted">
                              {order.items.reduce((acc, i) => acc + i.quantity, 0)} total units
                            </p>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-on-surface tabular-nums">
                            ₹{order.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-3">
                            {order.sourceOrderIds.length > 1 ? (
                              <StatusBadge status="MERGED_CANONICAL" label={`Merged (${order.sourceOrderIds.length} Sources)`} />
                            ) : (
                              <StatusBadge status="CANONICAL_CLEAN" label="Single Source Clean" />
                            )}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="p-1.5 rounded-md hover:bg-surface-panel text-accent-cyan hover:text-white transition-colors"
                              title="Inspect full order detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Inline Expanded Row showing Cross-Channel Provenance */}
                        {isExpanded && (
                          <tr className="bg-surface-base/60 border-y border-border-crisp">
                            <td colSpan={8} className="p-4">
                              <div className="p-4 rounded-xl bg-surface-panel border border-border-crisp space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-border-crisp/60">
                                  <div className="flex items-center gap-2">
                                    <ArrowRightLeft className="w-4 h-4 text-accent-cyan" />
                                    <h4 className="font-semibold text-xs text-on-surface">
                                      Multi-Source Reconciliation Provenance ({order.correlationHash})
                                    </h4>
                                  </div>
                                  <span className="text-[11px] font-mono text-status-success">
                                    Rule: {order.reconciliationRuleApplied || 'Direct Deterministic Sync'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div className="p-3 bg-surface-elevated/40 rounded-lg border border-border-crisp/40 space-y-1.5">
                                    <p className="font-semibold text-on-surface flex items-center justify-between">
                                      <span>Source A: Zomato Webhook</span>
                                      <span className="font-mono text-on-surface-muted">SRC-9182</span>
                                    </p>
                                    <p className="text-on-surface-variant">2x Paneer Tikka Roll, 2x Naan, 2x Chaas</p>
                                    <p className="font-mono text-on-surface-muted">Subtotal: ₹720.00 • Received: 12:02:10 IST</p>
                                  </div>

                                  <div className="p-3 bg-surface-elevated/40 rounded-lg border border-border-crisp/40 space-y-1.5">
                                    <p className="font-semibold text-on-surface flex items-center justify-between">
                                      <span>Source B: WhatsApp Inbound Direct</span>
                                      <span className="font-mono text-on-surface-muted">SRC-9201</span>
                                    </p>
                                    <p className="text-on-surface-variant">3x Paneer Tikka Roll (Updated Qty), 2x Naan, 2x Chaas</p>
                                    <p className="font-mono text-on-surface-muted">Subtotal: ₹960.00 • Received: 12:03:45 IST</p>
                                  </div>
                                </div>

                                <p className="text-[11px] text-on-surface-muted flex items-center gap-1.5 pt-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                                  <span>Quantities were resolved without doubling tickets. Canonical truth committed to POS KDS.</span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Source Orders Table */
        <div className="bg-surface-panel border border-border-crisp rounded-xl overflow-hidden shadow-xs">
          {filteredSources.length === 0 ? (
            <EmptyState 
              title="No source orders found" 
              description="Adjust your search query to inspect raw intake payloads." 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-base/80 border-b border-border-crisp text-on-surface-muted uppercase tracking-wider text-[11px]">
                    <th className="p-3">Source ID & Ref</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Customer Reference</th>
                    <th className="p-3">Ingested Items</th>
                    <th className="p-3 text-right">Raw Total</th>
                    <th className="p-3">Received Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Raw Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-crisp/60">
                  {filteredSources.map((source) => (
                    <tr key={source.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-on-surface">{source.referenceId}</span>
                        <p className="font-mono text-[10px] text-on-surface-muted">{source.id}</p>
                      </td>
                      <td className="p-3">
                        <ChannelBadge channel={source.channel} />
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-on-surface">{source.customerName}</p>
                        <p className="font-mono text-[11px] text-on-surface-muted">{source.customerPhone}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-on-surface truncate max-w-xs">
                          {source.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-on-surface tabular-nums">
                        ₹{source.totalAmount.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-on-surface-muted text-[11px]">
                        {new Date(source.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                      </td>
                      <td className="p-3">
                        <StatusBadge status={source.status} />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setInspectPayload({ id: source.referenceId, payload: source.rawPayloadSnippet || '{}' })}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-surface-elevated border border-border-crisp text-on-surface-muted hover:text-on-surface text-[11px] transition-colors"
                          title="Inspect raw json payload"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Payload</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Raw Payload Inspection Modal */}
      {inspectPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-surface-panel border border-border-crisp rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-crisp pb-3">
              <div>
                <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-accent-cyan" />
                  <span>Raw Ingest Payload: {inspectPayload.id}</span>
                </h3>
                <p className="text-xs text-on-surface-muted">Original payload preserved without modification.</p>
              </div>
              <button
                onClick={() => setInspectPayload(null)}
                className="px-2.5 py-1 text-xs text-on-surface-muted hover:text-on-surface rounded-md border border-border-crisp hover:bg-surface-elevated"
              >
                Close
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-surface-base border border-border-crisp text-xs font-mono text-cyan-300 overflow-x-auto max-h-96 whitespace-pre-wrap">
              {inspectPayload.payload}
            </pre>
            <div className="flex justify-end pt-2 border-t border-border-crisp">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inspectPayload.payload);
                  setInspectPayload(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-accent-cyan text-surface-base text-xs font-semibold hover:bg-cyan-400 transition-colors"
              >
                Copy to Clipboard &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
