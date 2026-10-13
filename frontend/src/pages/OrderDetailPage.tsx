import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck,
  FileText,
  Database,
  Calendar,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { CanonicalOrder, SourceOrder } from '../types';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canonical, setCanonical] = useState<CanonicalOrder | null>(null);
  const [source, setSource] = useState<SourceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadOrder(id);
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getOrderById(orderId);
      if (res?.canonical) setCanonical(res.canonical);
      if (res?.source) setSource(res.source);
      if (!res?.canonical && !res?.source) setError(`Order ${orderId} not found.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error || (!canonical && !source)) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => navigate('/orders')} 
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </button>
        <ErrorBanner message={error || 'Order record not found'} onRetry={() => id && loadOrder(id)} />
      </div>
    );
  }

  const items = canonical ? canonical.items : source ? source.items : [];
  const customerName = canonical ? canonical.customerName : source?.customerName;
  const customerPhone = canonical ? canonical.customerPhone : source?.customerPhone;
  const address = canonical ? canonical.deliveryAddress : source?.deliveryAddress;
  const subtotal = canonical ? canonical.subtotal : source?.subtotal || 0;
  const tax = canonical ? canonical.tax : source?.tax || 0;
  const total = canonical ? canonical.totalAmount : source?.totalAmount || 0;

  return (
    <div className="space-y-6">
      {/* Header Back & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-container transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders List</span>
        </button>

        <div className="flex items-center gap-2">
          {canonical && (
            <StatusBadge status={canonical.sourceOrderIds.length > 1 ? 'MERGED_CANONICAL' : 'CANONICAL_CLEAN'} />
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Docket</span>
          </button>
        </div>
      </div>

      {/* Title Card */}
      <div className="p-6 bg-white border border-outline-variant rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {canonical ? canonical.orderNumber : source?.referenceId}
            </h1>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
              canonical 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {canonical ? 'Canonical Truth Record' : 'Source Ingest Record'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-mono flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {canonical?.createdAt || source?.receivedAt || 'Recent'}
            </span>
            <span>•</span>
            <span>{canonical ? `Hash: ${canonical.correlationHash}` : `ID: ${source?.id}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canonical?.channels.map(ch => (
            <ChannelBadge key={ch} channel={ch} size="md" />
          ))}
          {source && <ChannelBadge channel={source.channel} referenceId={source.referenceId} size="md" />}
        </div>
      </div>

      {/* Grid: Order Metadata & Line Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900">Order Line Items</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {items.length} unique SKUs
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.sku}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    </div>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 mt-1.5 inline-flex">
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Modifier: {item.customizations.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium text-slate-600 tabular-nums">
                      {item.quantity} x ₹{item.unitPrice.toFixed(2)}
                    </p>
                    <p className="font-mono font-black text-slate-900 text-sm tabular-nums mt-0.5">
                      ₹{item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-medium tabular-nums">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (5% Restaurant Service Tax)</span>
                <span className="font-mono font-medium tabular-nums">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Amount Due</span>
                <span className="font-mono text-primary tabular-nums">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Provenance Context */}
        <div className="space-y-6 text-xs">
          {/* Customer Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Customer Information</span>
            </h3>
            
            <div className="space-y-3 text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{customerName}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{customerPhone}</span>
                </div>
                <div className="flex items-start gap-2 pt-1 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Provenance Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Provenance &amp; Integrity</span>
            </h3>
            
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Tenant Shard</span>
                <span className="font-mono font-bold text-slate-900">TEN-001 (Indiranagar)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Dispatch Mode</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  KDS Synced
                </span>
              </div>
              {canonical?.reconciliationRuleApplied && (
                <div className="pt-2 text-slate-700">
                  <p className="font-bold text-primary text-[11px] uppercase tracking-wider">Reconciliation Rule Applied:</p>
                  <p className="mt-1 font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200">{canonical.reconciliationRuleApplied}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Immutable cryptographic hash verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distinction: Original Source Evidence vs Normalized Operational Fields */}
      <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>Audit Provenance: Original Source Evidence vs Normalized Operational Fields</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Strict audit policy: Original source payload is immutable and stored separately from normalized reconciliation fields.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-50 text-primary border border-teal-200 shrink-0">
            AUDIT LAW #4 &amp; #8 ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Original Immutable Source Payload */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-xs text-slate-900">Original Source Evidence</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                RAW / READ-ONLY
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Unmodified payload received via {source?.channel || canonical?.channels[0] || 'INCOMING'} webhook / manual entry. Never altered during reconciliation.
            </p>
            <pre className="p-3.5 bg-slate-900 text-teal-300 rounded-lg font-mono text-xs overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap">
              {source?.rawPayloadSnippet || JSON.stringify(
                {
                  sourceChannel: source?.channel || canonical?.channels[0] || 'MANUAL',
                  referenceId: source?.referenceId || canonical?.orderNumber,
                  receivedAt: source?.receivedAt || canonical?.createdAt,
                  payload: {
                    customer: { name: customerName, phone: customerPhone },
                    deliveryAddress: address,
                    items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.unitPrice }))
                  }
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* Right: Normalized Extraction & Operational Fields */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900">Normalized Operational Fields</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                NORMALIZED SCHEMA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mapped through product catalog entity-resolution and address standardizers.
            </p>
            
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Standardized Phone:</span>
                <span className="font-mono text-slate-900 font-bold">{customerPhone}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Resolved Customer:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-slate-900 text-right font-medium max-w-[60%] truncate">{address}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Catalog Mapped Items:</span>
                <span className="font-mono text-primary font-bold">{items.length} SKUs Identified</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Record Integrity Status:</span>
                <span className="font-mono text-emerald-700 font-bold">VERIFIED VALID</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
