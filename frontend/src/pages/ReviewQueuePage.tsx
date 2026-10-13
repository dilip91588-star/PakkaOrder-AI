import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { DuplicateCandidate } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ChannelBadge } from '../components/common/ChannelBadge';
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
    if (activeTab === 'CRITICAL' && cand.severity !== 'CRITICAL') return false;
    if (activeTab === 'WARNING' && cand.severity !== 'WARNING') return false;
    if (activeTab === 'RESOLVED' && !cand.status.startsWith('RESOLVED')) return false;
    if (activeTab === 'ALL' && cand.status.startsWith('RESOLVED')) return false;

    if (selectedConflictType !== 'ALL' && cand.conflictType !== selectedConflictType) return false;

    if (selectedChannel !== 'ALL') {
      const matchA = cand.sourceA.channel === selectedChannel;
      const matchB = cand.sourceB.channel === selectedChannel;
      if (!matchA && !matchB) return false;
    }

    const match = 
      cand.candidatePairId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.sourceA.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.sourceA.customerPhone.includes(searchQuery) ||
      cand.conflictDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return match;
  });

  const criticalCount = candidates.filter(c => c.severity === 'CRITICAL' && !c.status.startsWith('RESOLVED')).length;
  const warningCount = candidates.filter(c => c.severity === 'WARNING' && !c.status.startsWith('RESOLVED')).length;
  const resolvedCount = candidates.filter(c => c.status.startsWith('RESOLVED')).length;

  const handleExportCsv = () => {
    const headers = ['Candidate ID', 'Status', 'Severity', 'Heuristic Score', 'Channel A', 'Customer A', 'Amount A', 'Channel B', 'Customer B', 'Amount B', 'Description'];
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
      c.sourceB.totalAmount,
      `"${c.conflictDescription}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `review_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Conflict Review Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-red-50 text-red-700 font-bold border border-red-200">
              {candidates.filter(c => !c.status.startsWith('RESOLVED')).length} Waiting
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Human-in-the-loop review for multi-channel duplicate candidates and conflicting customer revisions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e2e8f0] text-slate-700 hover:bg-[#f8f9ff] text-xs font-semibold rounded-lg transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Queue CSV</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadCandidates} />}

      {/* High-Alert Callout for Critical Quantity Conflicts */}
      {criticalCount > 0 && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-red-800">
                {criticalCount} Critical Quantity Conflicts Detected (Kitchen Preparation Held)
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                Rule #6 enforces that quantity variations can never be automatically merged without operator sign-off.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-red-700 font-bold bg-white px-2.5 py-1 rounded-md border border-red-200 shrink-0">
            SLA: Dispatch Risk
          </span>
        </div>
      )}

      {/* Filter Tabs and Search */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'text-[#64748B] hover:bg-[#f8f9ff] hover:text-[#0b1c30]'
            }`}
          >
            All Pending ({candidates.filter(c => !c.status.startsWith('RESOLVED')).length})
          </button>
          <button
            onClick={() => setActiveTab('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'CRITICAL'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Critical Qty ({criticalCount})
          </button>
          <button
            onClick={() => setActiveTab('WARNING')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'WARNING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Warnings ({warningCount})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'RESOLVED'
                ? 'bg-[#005c55] text-white shadow-xs'
                : 'text-[#64748B] hover:bg-[#f8f9ff]'
            }`}
          >
            Resolved History ({resolvedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] font-medium focus:border-[#0f766e] focus:outline-hidden"
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="ZOMATO">Zomato</option>
            <option value="SWIGGY">Swiggy</option>
            <option value="POS">POS</option>
          </select>

          <select
            value={selectedConflictType}
            onChange={(e) => setSelectedConflictType(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] font-medium focus:border-[#0f766e] focus:outline-hidden"
          >
            <option value="ALL">All Conflicts</option>
            <option value="QUANTITY_MISMATCH">Quantity Mismatch</option>
            <option value="MODIFIER_CONFLICT">Modifier Conflict</option>
            <option value="PRICE_MISMATCH">Price Mismatch</option>
            <option value="EXACT_DUPLICATE">Exact Duplicate</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate ID, customer..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:border-[#0f766e] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Candidate Queue Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Candidate Pair</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Similarity Score</th>
                <th className="py-3 px-4">Source A (Primary)</th>
                <th className="py-3 px-4">Source B (Revision)</th>
                <th className="py-3 px-4">Discrepancy Summary</th>
                <th className="py-3 px-4 text-center">SLA Expiry</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredCandidates.map(cand => (
                <tr key={cand.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0b1c30]">
                    {cand.candidatePairId}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      cand.severity === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {cand.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {cand.heuristicScore}% Match
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ChannelBadge channel={cand.sourceA.channel} />
                      <span className="font-semibold text-xs">{cand.sourceA.customerName}</span>
                    </div>
                    <p className="font-mono text-[11px] text-[#64748B]">₹{cand.sourceA.totalAmount}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ChannelBadge channel={cand.sourceB.channel} />
                      <span className="font-semibold text-xs">{cand.sourceB.customerName}</span>
                    </div>
                    <p className="font-mono text-[11px] text-[#64748B]">₹{cand.sourceB.totalAmount}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs">
                    <p className="font-medium truncate">{cand.conflictDescription}</p>
                    <span className="text-[11px] text-[#64748B]">
                      {cand.conflictType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                    <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded flex items-center justify-center gap-1 w-fit mx-auto">
                      <Clock className="w-3 h-3" /> 12m left
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/review/${cand.id}`)}
                      className="px-3.5 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs"
                    >
                      Resolve →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCandidates.length === 0 && (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-900 text-sm">Review Queue Empty</p>
            <p>No conflict pairs match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
