import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Activity, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { DuplicateCandidate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ScorePill } from '../components/common/ScorePill';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCandidates();
      setCandidates(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Notice (Demo Data Disclaimer) */}
      <div className="p-3 bg-surface-elevated/70 border border-border-crisp rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-cyan"></span>
          <span className="text-on-surface-variant">
            <strong className="text-on-surface">Demo Fixture Active:</strong> Connected to Spice Garden Indiranagar sandbox. All numbers reflect synthetic baseline records.
          </span>
        </div>
        <span className="text-[11px] font-mono text-on-surface-muted bg-surface-base px-2 py-0.5 rounded-sm border border-border-crisp">
          HMAC Ledger: Tamper-Evident
        </span>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-surface-panel border border-border-crisp hover:border-slate-600 transition-all shadow-xs">
          <div className="flex items-center justify-between text-on-surface-muted text-xs">
            <span>Source Orders Received</span>
            <Layers className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-on-surface tabular-nums">148</span>
            <span className="text-[11px] font-medium text-status-success flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14% today
            </span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-muted">WhatsApp: 42 • Zomato: 68 • Swiggy: 38</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-surface-panel border border-border-crisp hover:border-slate-600 transition-all shadow-xs">
          <div className="flex items-center justify-between text-on-surface-muted text-xs">
            <span>Canonical Orders</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-on-surface tabular-nums">136</span>
            <span className="text-[11px] font-medium text-status-success bg-status-success-bg px-1.5 py-0.5 rounded-sm border border-status-success/30">
              91.8% reconciled
            </span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-muted">12 deduplicated cross-channel pairs</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-surface-panel border border-border-crisp hover:border-slate-600 transition-all shadow-xs">
          <div className="flex items-center justify-between text-on-surface-muted text-xs">
            <span>Pending Reviews</span>
            <GitCompare className="w-4 h-4 text-status-warning" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-on-surface tabular-nums">
              {candidates.filter(c => c.status === 'PENDING').length}
            </span>
            <span className="text-[11px] font-medium text-status-warning flex items-center gap-1">
              <Clock className="w-3 h-3" /> SLA: 1.4m avg
            </span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-muted">Requires manual operator sign-off</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-surface-panel border border-status-critical/40 hover:border-status-critical/70 transition-all shadow-xs bg-gradient-to-b from-surface-panel to-status-critical-bg/20">
          <div className="flex items-center justify-between text-on-surface-muted text-xs">
            <span className="text-status-critical font-medium">Open Material Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-status-critical" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tracking-tight text-status-critical tabular-nums">
              {candidates.filter(c => c.severity === 'CRITICAL' && c.status === 'PENDING').length}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-status-critical/20 text-status-critical border border-status-critical/40">
              Zero Auto-Merge
            </span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-muted">1 Quantity Mismatch (Hold on kitchen)</p>
        </div>
      </div>

      {/* Main Grid: Priority Review Queue (Left 2 cols) & Channel Stream (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Priority Reconciliation Queue */}
        <div className="lg:col-span-2 bg-surface-panel border border-border-crisp rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
                  <span>Priority Reconciliation Review Queue</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-status-warning/20 text-status-warning border border-status-warning/40">
                    {candidates.filter(c => c.status === 'PENDING').length} Active
                  </span>
                </h2>
                <p className="text-xs text-on-surface-muted">
                  Heuristic candidate matches requiring human operator authorization.
                </p>
              </div>
              <button
                onClick={() => navigate('/review')}
                className="text-xs text-accent-cyan hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>View Full Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Candidate List */}
            <div className="space-y-3">
              {candidates.slice(0, 3).map((candidate) => (
                <div
                  key={candidate.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    candidate.severity === 'CRITICAL'
                      ? 'bg-surface-elevated/70 border-status-critical/40 hover:border-status-critical'
                      : 'bg-surface-elevated/40 border-border-crisp hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border-crisp/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-accent-cyan">
                        {candidate.candidatePairId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <ChannelBadge channel={candidate.sourceA.channel} referenceId={candidate.sourceA.referenceId} />
                        <span className="text-[11px] text-on-surface-muted">vs</span>
                        <ChannelBadge channel={candidate.sourceB.channel} referenceId={candidate.sourceB.referenceId} />
                      </div>
                    </div>
                    <ScorePill score={candidate.heuristicScore} showDetails={true} />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge severity={candidate.severity} label={candidate.conflictType.replace('_', ' ')} />
                        <span className="text-xs font-medium text-on-surface">
                          {candidate.sourceA.customerName} ({candidate.sourceA.customerPhone})
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {candidate.conflictDescription}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/review/${candidate.id}`)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                        candidate.severity === 'CRITICAL'
                          ? 'bg-status-critical hover:bg-rose-600 text-white shadow-xs'
                          : 'bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base'
                      }`}
                    >
                      <span>Review & Resolve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-crisp/40 flex items-center justify-between text-[11px] text-on-surface-muted">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-status-warning" />
              Policy rule: Quantity mismatches will NEVER auto-merge.
            </span>
            <span className="font-mono">Engine: Deterministic v2.1</span>
          </div>
        </div>

        {/* Right Section: Channel Distribution & Activity Stream */}
        <div className="space-y-6">
          {/* Channel Breakdown Card */}
          <div className="bg-surface-panel border border-border-crisp rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-on-surface flex items-center justify-between">
              <span>Channel Ingestion Volume</span>
              <span className="text-xs font-mono text-on-surface-muted">Total: 148</span>
            </h3>

            {/* Segmented bar */}
            <div className="h-2.5 w-full bg-surface-base rounded-full overflow-hidden flex">
              <div style={{ width: '46%' }} className="bg-rose-500" title="Zomato: 68 orders (46%)" />
              <div style={{ width: '28%' }} className="bg-emerald-500" title="WhatsApp: 42 orders (28%)" />
              <div style={{ width: '26%' }} className="bg-amber-500" title="Swiggy: 38 orders (26%)" />
            </div>

            {/* Breakdown rows */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Zomato Webhook
                </span>
                <span className="font-mono font-medium text-on-surface">68 orders (46%)</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> WhatsApp Direct
                </span>
                <span className="font-mono font-medium text-on-surface">42 orders (28%)</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Swiggy Partner
                </span>
                <span className="font-mono font-medium text-on-surface">38 orders (26%)</span>
              </div>
            </div>
          </div>

          {/* Real-time Ingestion Stream */}
          <div className="bg-surface-panel border border-border-crisp rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <Activity className="w-4 h-4 text-status-success animate-pulse" />
                <span>Live Ingestion Stream</span>
              </h3>
              <span className="text-[10px] font-mono text-status-success bg-status-success-bg px-1.5 py-0.5 rounded-sm border border-status-success/30">
                Stream: Active Polling
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-elevated/50 border border-border-crisp/60 flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">ORD-1042 • WhatsApp → POS</p>
                  <p className="text-[11px] text-on-surface-muted">Linked to Canonical #1042</p>
                </div>
                <span className="text-[10px] font-mono text-status-success">2m ago</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-elevated/50 border border-border-crisp/60 flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">ORD-1041 • Swiggy</p>
                  <p className="text-[11px] text-on-surface-muted">Clean Single Source</p>
                </div>
                <span className="text-[10px] font-mono text-on-surface-muted">5m ago</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-elevated/50 border border-status-warning/30 flex items-center justify-between">
                <div>
                  <p className="font-medium text-status-warning">CAN-8841 • Flagged for Review</p>
                  <p className="text-[11px] text-on-surface-muted">Qty Discrepancy (2 vs 3)</p>
                </div>
                <span className="text-[10px] font-mono text-status-warning">8m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
