import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Radio, 
  CheckCircle, 
  Info, 
  Save, 
  RefreshCw, 
  Lock, 
  Clock, 
  Coins 
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { BusinessSettings } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [waStatus, setWaStatus] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, whatsappData] = await Promise.all([
        apiClient.getSettings(),
        apiClient.getWhatsAppStatus()
      ]);
      setSettings(settingsData);
      setWaStatus(whatsappData);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (val: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      reconciliationRules: {
        ...settings.reconciliationRules,
        autoMergeThreshold: val
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await apiClient.saveSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Console &amp; Integration Settings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 border border-teal-200 text-primary">
              Tenant: {settings.tenantId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-channel ingestion, OrderTruth AI heuristic parameters, and POS synchronization rules.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-pulse shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Business Identity & Locale */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-teal-50 rounded-xl text-primary border border-teal-200/60">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Store Identity &amp; Accounting Locale</h2>
              <p className="text-xs text-slate-500">Primary restaurant identifier used across canonical ledger and POS tickets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Business / Outlet Name</label>
              <input 
                type="text" 
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered GSTIN Number</label>
              <input 
                type="text" 
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Operating Timezone</span>
              </label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700">
                <span className="font-mono font-bold text-slate-900">{settings.timezone}</span>
                <span className="text-[11px] font-bold text-primary bg-teal-50 px-2 py-0.5 rounded border border-teal-200">UTC +05:30 (IST)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">All events stored in UTC and rendered in local Indian Standard Time.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-primary" />
                <span>Billing Currency</span>
              </label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700">
                <span className="font-bold text-slate-900">{settings.currency} (Indian Rupee)</span>
                <span className="font-mono text-xs text-slate-500 font-bold">Symbol: ₹</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Monetary values formatted with standard Indian grouping (e.g. ₹1,450.00).</p>
            </div>
          </div>
        </div>

        {/* Section 2: OrderTruth AI Engine Rules */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 border border-amber-200/60">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">OrderTruth AI Reconciliation Guardrails</h2>
                <p className="text-xs text-slate-500">Strict deterministic safeguards preventing accidental or speculative order merges.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full">
              Engine v2.1 Active
            </span>
          </div>

          <div className="space-y-5">
            {/* Rule 1: Mandatory QNT-04 Lock */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-900">Rule #QNT-04: Non-Negotiable Quantity Guardrail</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-200 text-red-900 rounded-full">Enforced Hard Lock</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  A quantity mismatch is classified as a material conflict. Ingestion pipelines and matching heuristics are mathematically prohibited from automatically merging conflicting quantities (e.g., 2 rolls vs 3 rolls) or summing quantities. Human supervisor approval is mandatory.
                </p>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Automated Match Review Threshold</div>
                  <div className="text-xs text-slate-500">Orders scoring below this threshold are routed to human review.</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-primary">{settings.reconciliationRules.autoMergeThreshold}</span>
                  <span className="text-xs text-slate-400 font-mono"> / 100</span>
                </div>
              </div>

              <input 
                type="range" 
                min={80} 
                max={99} 
                value={settings.reconciliationRules.autoMergeThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full accent-teal-700 bg-slate-200 rounded-lg cursor-pointer h-2"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>80 (Lenient Review)</span>
                <span className="text-primary font-bold">95 (Default Enterprise Safe)</span>
                <span>99 (Ultra Strict)</span>
              </div>
            </div>

            {/* Other guardrails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Zero Speculative Merging</div>
                  <div className="text-slate-500 mt-0.5">High heuristic scores never trigger silent background merges without an audit entry.</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Preserve Source Evidence</div>
                  <div className="text-slate-500 mt-0.5">Raw incoming payloads and timestamps remain immutable in the source records repository.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Channel Integration Health & Credentials Policy */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200/60">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Channel Ingestion Pipelines</h2>
                <p className="text-xs text-slate-500">Current connection status for food aggregators, WhatsApp bots, and POS systems.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Real credentials stored only in secure backend vault</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp Integration Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">WhatsApp Cloud API</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  waStatus?.status === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-teal-100 text-primary border border-teal-200'
                }`}>
                  {waStatus?.status === 'CONNECTED' ? 'Meta Live Connected' : 'Adapter Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official Meta Graph API v21.0 adapter. HMAC-SHA256 signature guard and idempotency active.
              </p>
              <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-500 font-mono">
                <div className="flex items-center justify-between">
                  <span>Webhook Path</span>
                  <span className="text-slate-800 font-bold">/api/v1/webhooks/whatsapp</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Signature Guard</span>
                  <span className="text-emerald-700 font-bold">{waStatus?.signatureVerificationMode || 'STRICT_HMAC_SHA256'}</span>
                </div>
                {waStatus?.metrics?.totalEventsReceived !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>Events Ingested</span>
                    <span className="text-primary font-bold">{waStatus.metrics.totalEventsReceived}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Petpooja POS Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Petpooja POS Terminal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                  Credentials Required
                </span>
              </div>
              <p className="text-xs text-slate-500">
                External POS sync requires Petpooja App Key and Rest ID. Currently operating in sandbox mode.
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>API Status</span>
                <span className="text-slate-600">Not Connected</span>
              </div>
            </div>

            {/* Zomato Integration Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Zomato Food Delivery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                  Credentials Required
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Production order webhook requires Zomato Partner OAuth credentials. Operating in sandbox mode.
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Webhook Partner Auth</span>
                <span className="text-slate-600">Not Connected</span>
              </div>
            </div>

            {/* Swiggy Integration Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Swiggy Delivery Partner</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                  Credentials Required
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Swiggy merchant dispatch requires partner API client keys and store verification.
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Merchant Auth</span>
                <span className="text-slate-600">Not Connected</span>
              </div>
            </div>

            {/* CSV / Manual Batch Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">CSV &amp; Cashier Import</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Fully Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct manual entry, offline spreadsheet uploads, and Hinglish NLP extraction interface.
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Batch processor</span>
                <span className="text-emerald-700 font-bold">Ready</span>
              </div>
            </div>

            {/* LLM Engine Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Gemini Parsing Service</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-primary border border-teal-200">
                  Backend Secured
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Zero client-side API keys. All informal text orders parsed via server-side schema verification.
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Model: Official SDK</span>
                <span className="text-primary font-bold">Runtime Guard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={fetchSettings}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-colors shadow-xs"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
