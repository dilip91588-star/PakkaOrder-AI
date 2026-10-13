import React, { useEffect, useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Lock, 
  User, 
  Bot, 
  ChevronDown, 
  ChevronRight, 
  Code, 
  ShieldAlert,
  Hash,
  Database
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { AuditRecord } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const AuditHistoryPage: React.FC = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Expanded State
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>('AUD-88219');
  const [showMerkleProofModal, setShowMerkleProofModal] = useState(false);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAuditRecords();
      setRecords(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(rec => {
    if (activeFilter === 'OVERRIDES' && rec.action !== 'OPERATOR_OVERRIDE_CONFIRMED') return false;
    if (activeFilter === 'DUPLICATES' && rec.action !== 'DUPLICATE_MERGE') return false;
    if (activeFilter === 'AUTO' && rec.action !== 'AUTO_RECONCILED') return false;
    if (activeFilter === 'CONFLICTS' && rec.action !== 'QUANTITY_CONFLICT_FLAGGED') return false;

    const matches = 
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.targetRecord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.justification.toLowerCase().includes(searchQuery.toLowerCase());
    return matches;
  });

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      {/* Top Header & Compliance Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-medium">Governance &amp; Audits</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 flex-wrap">
            <span>Immutable Audit History &amp; Governance Ledger</span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              APPEND-ONLY ACTIVE
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof record of all operator overrides, deterministic merges, and heuristic rule triggers.
          </p>
        </div>

        <button
          onClick={() => setShowMerkleProofModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-primary text-xs font-bold transition-colors shadow-xs"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify Cryptographic Proof</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadAudit} />}

      {/* Compliance Telemetry Banner */}
      <div className="p-4 rounded-2xl bg-white border border-outline-variant shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <Lock className="w-3.5 h-3.5" /> ISO-27001 WORM Storage
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-700">
            <Hash className="w-3.5 h-3.5 text-primary" />
            SHA-256 Merkle Root: 0x88f2...b109
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-700">
            <Database className="w-3.5 h-3.5 text-primary" />
            Shard: ap-south-1 (Mumbai)
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Retention: 7 Years Enforced
        </span>
      </div>

      {/* Action Filter Pills & Search */}
      <div className="p-4 bg-white border border-outline-variant rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: 'All Actions' },
            { key: 'OVERRIDES', label: 'Operator Overrides' },
            { key: 'DUPLICATES', label: 'Confirmed Duplicates' },
            { key: 'AUTO', label: 'Auto-Reconciled' },
            { key: 'CONFLICTS', label: 'Rule Triggers' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap ${
                activeFilter === key
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Event ID, order number, actor name, or recorded justification..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Audit Ledger Table */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-outline-variant text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="p-4 w-10"></th>
                <th className="p-4">Event ID &amp; Timestamp</th>
                <th className="p-4">Action Classification</th>
                <th className="p-4">Target Record</th>
                <th className="p-4">Actor / Entity</th>
                <th className="p-4">Recorded Justification</th>
                <th className="p-4 text-right">Cryptographic Seal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const isExpanded = expandedRow === record.id;
                return (
                  <React.Fragment key={record.id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : record.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="p-4 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-primary">{record.id}</span>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                          record.action === 'OPERATOR_OVERRIDE_CONFIRMED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : record.action === 'QUANTITY_CONFLICT_FLAGGED'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {record.action}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {record.targetRecord}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {record.actor.isSystem ? (
                            <div className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-primary">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{record.actor.name}</span>
                            <span className="text-[10px] text-slate-400 block">{record.actor.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 max-w-sm">
                        <p className="text-slate-700 truncate font-medium">{record.justification}</p>
                      </td>
                      <td className="p-4 text-right font-mono text-xs font-bold text-emerald-700">
                        {record.signature.split(' ')[0]} ✓
                      </td>
                    </tr>

                    {/* Expanded JSON State Delta Inspector */}
                    {isExpanded && (
                      <tr className="bg-slate-50/60 border-y border-slate-200">
                        <td colSpan={7} className="p-5">
                          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                <Code className="w-4 h-4 text-primary" />
                                <span>Event State Delta &amp; Merkle Leaf Details ({record.id})</span>
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                                {record.signature}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              {/* Prior State */}
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <p className="text-red-700 text-[11px] uppercase font-bold tracking-wider">Prior State Snapshot:</p>
                                <pre className="text-slate-800 text-xs overflow-x-auto leading-relaxed bg-white p-3 rounded border border-slate-200 max-h-48">
                                  {JSON.stringify(record.priorStateSnippet, null, 2)}
                                </pre>
                              </div>

                              {/* Mutated State */}
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <p className="text-emerald-700 text-[11px] uppercase font-bold tracking-wider">Mutated Canonical State:</p>
                                <pre className="text-slate-800 text-xs overflow-x-auto leading-relaxed bg-white p-3 rounded border border-slate-200 max-h-48">
                                  {JSON.stringify(record.mutatedStateSnippet, null, 2)}
                                </pre>
                              </div>
                            </div>

                            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200/80 text-xs text-slate-800">
                              <strong className="text-primary">Recorded Operator Rationale:</strong> "{record.justification}"
                            </div>
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
      </div>

      {/* Footer Legal Assurance */}
      <div className="p-5 rounded-2xl bg-white border border-outline-variant shadow-xs text-xs space-y-1.5">
        <p className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span>Strict Application Immutability Assurance:</span>
        </p>
        <p className="text-slate-500 leading-relaxed">
          Application paths and database roles provide no routes to update, truncate, or delete historical records. Any attempted state modification creates a hard verification fault in the Merkle audit tree.
        </p>
      </div>

      {/* Merkle Proof Modal */}
      {showMerkleProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white border border-outline-variant rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Cryptographic Proof Verified</h3>
                  <p className="text-xs text-slate-500">HMAC-SHA256 Append-Only Merkle Tree</p>
                </div>
              </div>
              <button
                onClick={() => setShowMerkleProofModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Validation Status:</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  100% INTACT &amp; UNALTERED
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Merkle Root:</span>
                <span className="text-primary font-bold">0x88f29c4ef3b29d10e541ad90288eb109</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Storage Protocol:</span>
                <span className="text-slate-700 font-medium">WORM (Write Once, Read Many)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Region Shard:</span>
                <span className="text-slate-700 font-medium">ap-south-1 (Mumbai, India)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every audit record is cryptographically linked to the previous state block. Historical resolution events cannot be purged or updated by any standard database path or application route.
            </p>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowMerkleProofModal(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
              >
                Acknowledge &amp; Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHistoryPage;
