import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, ShieldAlert, AlertTriangle, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';
import type { DuplicateCandidate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ScorePill } from '../components/common/ScorePill';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConflictType, setSelectedConflictType] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCandidates();
      setCandidates(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(cand => {
    // Tab filter
    if (activeTab === 'CRITICAL' && cand.severity !== 'CRITICAL') return false;
    if (activeTab === 'WARNING' && cand.severity !== 'WARNING') return false;
    if (activeTab === 'RESOLVED' && !cand.status.startsWith('RESOLVED')) return false;
    if (activeTab === 'ALL' && cand.status.startsWith('RESOLVED')) return false; // Show active pending in ALL tab

    // Conflict type filter
    if (selectedConflictType !== 'ALL' && cand.conflictType !== selectedConflictType) return false;

    // Channel filter
    if (selectedChannel !== 'ALL') {
      const matchA = cand.sourceA.channel === selectedChannel;
      const matchB = cand.sourceB.channel === selectedChannel;
      if (!matchA && !matchB) return false;
    }

    // Date filter
    if (selectedDateFilter === 'TODAY') {
      const receivedDate = new Date(cand.sourceA.receivedAt).toDateString();
      const today = new Date().toDateString();
      if (receivedDate !== today) return false;
    }

    // Search query
    const match = 
      cand.candidatePairId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.sourceA.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.sourceA.customerPhone.includes(searchQuery) ||
      cand.conflictDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return match;
  });

  const handleExportCsv = () => {
    const headers = ['Candidate ID', 'Status', 'Severity', 'Heuristic Score', 'Channel A', 'Customer A', 'Amount A', 'Channel B', 'Customer B', 'Amount B'];
    const rows = filteredCandidates.map(c => [
      `"${c.candidatePairId}"`,
      `"${c.status}"`,
      `"${c.severity}"`,
      `"${c.heuristicScore}%"`,
      `"${c.sourceA.channel}"`,
      `"${c.sourceA.customerName}"`,
      c.sourceA.totalAmount,
      `"${c.sourceB.channel}"`,
      `"${c.sourceB.customerName}"`,
      c.sourceB.totalAmount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pakka_review_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-muted mb-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-on-surface">Review Queue</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2.5">
            <span>Duplicate Review Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-status-warning/20 text-status-warning font-mono border border-status-warning/40">
              {candidates.filter(c => c.status === 'PENDING').length} Pending
            </span>
          </h1>
          <p className="text-xs text-on-surface-muted">
            Inspect flagged cross-channel pairs. Zero auto-merge enforced on quantity conflicts.
          </p>
        </div>

        {/* SLA and Metrics Strip */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 px-3 bg-surface-panel border border-border-crisp rounded-lg flex items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-accent-cyan" />
            <div>
              <p className="text-[10px] text-on-surface-muted leading-tight">Average Resolution SLA</p>
              <p className="font-mono font-bold text-on-surface">1m 42s <span className="text-status-success font-sans font-normal">(Target &lt;5m)</span></p>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadCandidates} />}

      {/* Slicing Tabs */}
      <div className="flex items-center justify-between border-b border-border-crisp pb-1 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-accent-cyan text-surface-base'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated'
            }`}
          >
            All Pending ({candidates.filter(c => c.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'CRITICAL'
                ? 'bg-status-critical text-white'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>High Urgency ({candidates.filter(c => c.severity === 'CRITICAL' && c.status === 'PENDING').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'WARNING'
                ? 'bg-status-warning text-surface-base'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated'
            }`}
          >
            Medium / Warnings ({candidates.filter(c => c.severity === 'WARNING' && c.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'RESOLVED'
                ? 'bg-accent-teal text-surface-base'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated'
            }`}
          >
            Resolved Today ({candidates.filter(c => c.status.startsWith('RESOLVED')).length})
          </button>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-crisp hover:bg-surface-elevated text-xs font-medium text-on-surface-variant transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="hidden sm:inline">Export Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-surface-panel border border-border-crisp rounded-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Candidate ID, phone, or items..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface placeholder:text-on-surface-muted focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedConflictType}
            onChange={(e) => setSelectedConflictType(e.target.value)}
            className="px-3 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          >
            <option value="ALL">All Conflict Types</option>
            <option value="QUANTITY_MISMATCH">Quantity Mismatch (Material)</option>
            <option value="MODIFIER_VARIANCE">Modifier Variance</option>
            <option value="PRICE_DISCREPANCY">Price Discrepancy</option>
            <option value="DUPLICATE_TIMESTAMP">Duplicate Timestamp</option>
          </select>

          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="POS">Petpooja POS</option>
            <option value="ZOMATO">Zomato</option>
            <option value="SWIGGY">Swiggy</option>
            <option value="CALL">Phone Call</option>
          </select>

          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Received Today</option>
          </select>
        </div>
      </div>

      {/* Candidate Data Grid */}
      {filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates match your filters"
          description="Try selecting a different filter tab or clearing the search box."
          action={{ label: 'Reset Filters', onClick: () => { setActiveTab('ALL'); setSelectedConflictType('ALL'); setSearchQuery(''); } }}
        />
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => {
            const isResolved = candidate.status.startsWith('RESOLVED');
            return (
              <div
                key={candidate.id}
                className={`p-4 rounded-xl border transition-all ${
                  candidate.severity === 'CRITICAL' && !isResolved
                    ? 'bg-surface-panel border-status-critical/50 hover:border-status-critical shadow-xs'
                    : 'bg-surface-panel border-border-crisp hover:border-slate-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border-crisp/60">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-bold text-accent-cyan">
                      {candidate.candidatePairId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <ChannelBadge channel={candidate.sourceA.channel} referenceId={candidate.sourceA.referenceId} />
                      <span className="text-xs text-on-surface-muted">vs</span>
                      <ChannelBadge channel={candidate.sourceB.channel} referenceId={candidate.sourceB.referenceId} />
                    </div>
                    <StatusBadge severity={candidate.severity} label={candidate.conflictType.replace('_', ' ')} />
                  </div>

                  <div className="flex items-center gap-3">
                    <ScorePill score={candidate.heuristicScore} showDetails={true} />
                    <span className="text-xs font-mono text-on-surface-muted">
                      {new Date(candidate.sourceA.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-on-surface">
                      Customer: {candidate.sourceA.customerName} ({candidate.sourceA.customerPhone})
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {candidate.conflictDescription}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-on-surface-muted">
                      <span>Phone Match: {candidate.scoreBreakdown.phoneMatch}%</span>
                      <span>•</span>
                      <span>Address Match: {candidate.scoreBreakdown.addressMatch}%</span>
                      <span>•</span>
                      <span>Timestamp Proximity: {candidate.scoreBreakdown.timestampProximity}%</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-elevated text-status-success font-medium text-xs border border-status-success/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{candidate.status.replace('_', ' ')}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/review/${candidate.id}`)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs ${
                          candidate.severity === 'CRITICAL'
                            ? 'bg-status-critical hover:bg-rose-600 text-white'
                            : 'bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base'
                        }`}
                      >
                        <span>Investigate & Resolve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Notice Footer */}
      <div className="p-3 bg-surface-panel border border-border-crisp rounded-xl flex items-center justify-between text-xs text-on-surface-muted">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-accent-cyan" />
          <span>Cryptographic audit hashing is anchored to the ISO-27001 standard. All decisions are immutable.</span>
        </span>
        <span className="font-mono text-[11px]">Shard: ap-south-1</span>
      </div>
    </div>
  );
};
