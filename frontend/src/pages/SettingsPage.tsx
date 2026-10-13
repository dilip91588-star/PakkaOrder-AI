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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Console & Integration Settings</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
              Tenant: {settings.tenantId}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Configure multi-channel ingestion, OrderTruth AI heuristic parameters, and POS synchronization rules.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-sm animate-pulse">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Business Identity & Locale */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Store Identity & Accounting Locale</h2>
              <p className="text-xs text-slate-400">Primary restaurant identifier used across canonical ledger and POS tickets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Business / Outlet Name</label>
              <input 
                type="text" 
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered GSTIN Number</label>
              <input 
                type="text" 
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Timezone</span>
              </label>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-300">
                <span className="font-mono text-xs">{settings.timezone}</span>
                <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">UTC +05:30 (IST)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">All events stored in UTC and converted to local IST timestamps.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>Billing Currency</span>
              </label>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-300">
                <span className="font-semibold">{settings.currency} (Indian Rupee)</span>
                <span className="font-mono text-xs text-slate-400">Symbol: ₹</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Monetary values formatted with standard Indian grouping (e.g. ₹1,450.00).</p>
            </div>
          </div>
        </div>

        {/* Section 2: OrderTruth AI Engine Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">OrderTruth AI Reconciliation Guardrails</h2>
                <p className="text-xs text-slate-400">Strict deterministic safeguards preventing accidental or speculative order merges.</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-amber-950/60 border border-amber-800/60 text-amber-400 rounded">
              Engine v2.1 Heuristic Active
            </span>
          </div>

          <div className="space-y-5">
            {/* Rule 1: Mandatory QNT-04 Lock */}
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-200">Rule #QNT-04: Non-Negotiable Quantity Guardrail</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-red-900/80 text-red-200 rounded">Enforced Hard Lock</span>
                </div>
                <p className="text-xs text-red-300/80 leading-relaxed">
                  A quantity mismatch is classified as a material conflict. Ingestion pipelines and matching heuristics are mathematically prohibited from automatically merging conflicting quantities (e.g., 2 rolls vs 3 rolls) or summing quantities. Human supervisor approval is mandatory.
                </p>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-200">Automated Match Review Threshold</div>
                  <div className="text-xs text-slate-400">Orders scoring below this threshold are routed to human review.</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-cyan-400">{settings.reconciliationRules.autoMergeThreshold}</span>
                  <span className="text-xs text-slate-500 font-mono"> / 100</span>
                </div>
              </div>

              <input 
                type="range" 
                min={80} 
                max={99} 
                value={settings.reconciliationRules.autoMergeThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>80 (Lenient Review)</span>
                <span className="text-cyan-400 font-medium">95 (Default Enterprise Safe)</span>
                <span>99 (Ultra Strict)</span>
              </div>
            </div>

            {/* Other guardrails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">Zero Speculative Merging</div>
                  <div className="text-slate-400 mt-0.5">High heuristic scores never trigger silent background merges without an audit entry.</div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">Preserve Source Evidence</div>
                  <div className="text-slate-400 mt-0.5">Raw incoming payloads and timestamps remain immutable in the source records repository.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Channel Integration Health & Credentials Policy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Channel Ingestion Pipelines</h2>
                <p className="text-xs text-slate-400">Current connection status for food aggregators, WhatsApp bots, and POS systems.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real credentials stored only in secure backend vault</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp Integration Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">WhatsApp Cloud API</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  waStatus?.status === 'CONNECTED'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                }`}>
                  {waStatus?.status === 'CONNECTED' ? 'Meta Live Connected' : 'Adapter Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Meta Graph API v21.0 adapter. HMAC-SHA256 signature guard and idempotency active.
              </p>
              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px] text-slate-500 font-mono">
                <div className="flex items-center justify-between">
                  <span>Webhook Path</span>
                  <span className="text-slate-300">/api/v1/webhooks/whatsapp</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Signature Guard</span>
                  <span className="text-emerald-400 font-medium">{waStatus?.signatureVerificationMode || 'STRICT_HMAC_SHA256'}</span>
                </div>
                {waStatus?.metrics?.totalEventsReceived !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Events Ingested</span>
                    <span className="text-cyan-400 font-bold">{waStatus.metrics.totalEventsReceived}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Petpooja POS Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Petpooja POS Terminal</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Credentials Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                External POS sync requires Petpooja App Key and Rest ID. Currently unconfigured in sandbox.
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>API Status</span>
                <span className="text-slate-400">Not Connected</span>
              </div>
            </div>

            {/* Zomato Integration Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Zomato Food Delivery</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Credentials Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Production order webhook requires Zomato Partner OAuth credentials. Currently unconfigured in sandbox.
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Webhook Partner Auth</span>
                <span className="text-slate-400">Not Connected</span>
              </div>
            </div>

            {/* Swiggy Integration Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Swiggy Delivery Partner</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Credentials Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Swiggy merchant dispatch requires partner API client keys and store verification.
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Merchant Auth</span>
                <span className="text-slate-400">Not Connected</span>
              </div>
            </div>

            {/* CSV / Manual Batch Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">CSV & Cashier Import</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  Fully Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct manual entry, offline spreadsheet uploads, and Hinglish NLP extraction interface.
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Batch processor</span>
                <span className="text-emerald-400">Ready</span>
              </div>
            </div>

            {/* LLM Engine Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Gemini Parsing Service</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  Backend Secured
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zero client-side API keys. All informal text orders parsed via server-side schema verification.
              </p>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Model: Official SDK</span>
                <span className="text-cyan-400">Runtime Guard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={fetchSettings}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-cyan-950/50 disabled:opacity-50"
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
