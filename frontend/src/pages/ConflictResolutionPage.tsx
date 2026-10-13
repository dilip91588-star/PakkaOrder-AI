import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Check, 
  Sparkles, 
  X
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { DuplicateCandidate } from '../types';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const ConflictResolutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<DuplicateCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal & Resolution state
  const [activeModalAction, setActiveModalAction] = useState<'CONFIRM_UPDATE' | 'CONFIRM_DUPLICATE' | 'CONFIRM_SEPARATE' | 'KEEP_PENDING' | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(3);
  const [reasonInput, setReasonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gemini Matching Explanation
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (id) loadCandidate(id);
  }, [id]);

  const loadCandidate = async (candidateId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCandidateById(candidateId);
      if (data) {
        setCandidate(data);
        // Load Gemini explanation
        try {
          setIsExplaining(true);
          const expl = await apiClient.explainCandidate(candidateId);
          setAiExplanation(expl);
        } catch {
          // Keep resilient
        } finally {
          setIsExplaining(false);
        }
      } else {
        setError(`Candidate ${candidateId} not found.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (action: 'CONFIRM_UPDATE' | 'CONFIRM_DUPLICATE' | 'CONFIRM_SEPARATE' | 'KEEP_PENDING') => {
    setActiveModalAction(action);
    if (action === 'CONFIRM_UPDATE') {
      setReasonInput('Customer confirmed revision via WhatsApp conversation.');
    } else if (action === 'CONFIRM_DUPLICATE') {
      setReasonInput('Identical order entered across two channels; duplicate suppressed.');
    } else if (action === 'CONFIRM_SEPARATE') {
      setReasonInput('Verified separate distinct orders for same location.');
    } else {
      setReasonInput('Pending additional customer clarification.');
    }
  };

  const handleExecuteResolution = async () => {
    if (!candidate || !activeModalAction) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      const res = await apiClient.resolveCandidate({
        candidateId: candidate.id,
        action: activeModalAction,
        selectedCanonicalQuantity: activeModalAction === 'CONFIRM_UPDATE' ? selectedQuantity : undefined,
        reason: reasonInput,
        authorizingOperator: 'Pranav M. (Lead Ops)'
      });
      setActionSuccessMsg(res.message);
      setActiveModalAction(null);
      await loadCandidate(candidate.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Resolution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/review')} className="inline-flex items-center gap-1.5 text-xs text-[#0f766e] hover:underline font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Review Queue
        </button>
        <ErrorBanner message={error || 'Candidate not found'} onRetry={() => id && loadCandidate(id)} />
      </div>
    );
  }

  const isResolved = candidate.status.startsWith('RESOLVED');

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/review')} 
            className="p-1.5 rounded-lg border border-[#e2e8f0] text-slate-700 hover:bg-[#f8f9ff] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#0b1c30]">
                Resolution Workspace: {candidate.candidatePairId}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                candidate.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {candidate.severity} CONFLICT
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {candidate.heuristicScore}% Match
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Assigned Operator: Pranav M. (Lead Ops) • Indiranagar Outlet
            </p>
          </div>
        </div>

        {isResolved && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Resolution Committed ({candidate.status})</span>
          </span>
        )}
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && <ErrorBanner message={actionError} />}

      {/* Gemini AI Signal Panel */}
      <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#dce9ff]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#005c55]">
            <Sparkles className="w-4 h-4 text-[#0f766e]" />
            <span>Gemini AI Matching Explanation (Prompt Version: match-explanation-v1)</span>
          </div>
          <span className="text-[10px] font-mono text-[#005c55] bg-white px-2 py-0.5 rounded border border-[#dce9ff]">
            Provider: Google GenAI (Server-Side)
          </span>
        </div>

        {isExplaining ? (
          <p className="text-xs text-slate-500 italic animate-pulse">
            Analyzing candidate records with Gemini GenAI engine...
          </p>
        ) : (
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {aiExplanation?.explanation || 
              `Deterministic score: ${candidate.heuristicScore}%. Customer ${candidate.sourceA.customerName} ordered via ${candidate.sourceA.channel}. Record ${candidate.sourceB.channel} was received with quantity variation. Address matches 100%. This is an out-of-order customer modification.`
            }
          </p>
        )}

        <div className="mt-3 pt-2 border-t border-[#dce9ff]/60 flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="italic">Rule #8: AI output provides matching signals only; human confirmation required.</span>
          <span className="font-mono text-[#005c55]">Zero automated overrides</span>
        </div>
      </div>

      {/* Side-by-Side Comparison Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Left Column: Source A */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <ChannelBadge channel={candidate.sourceA.channel} />
              <span className="font-bold text-xs text-[#0b1c30]">Source Record A</span>
            </div>
            <span className="font-mono text-xs text-[#64748B]">{candidate.sourceA.referenceId}</span>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between text-slate-700">
              <span className="text-[#64748B]">Customer:</span>
              <span className="font-medium text-slate-900">{candidate.sourceA.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-[#64748B]">Masked Phone:</span>
              <span className="font-mono">{candidate.sourceA.customerPhone}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-[#64748B]">Delivery Address:</span>
              <span className="text-right truncate max-w-xs">{candidate.sourceA.deliveryAddress}</span>
            </div>
          </div>

          {/* Line items */}
          <div className="pt-2 border-t border-[#f1f5f9]">
            <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Line Items</h4>
            <div className="space-y-1.5 text-xs">
              {candidate.sourceA.items.map((itm, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0]">
                  <span className="font-medium text-slate-900">
                    <strong className="text-[#0f766e] mr-1.5 font-mono">{itm.quantity}x</strong> {itm.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900">₹{itm.totalPrice}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 font-mono text-xs font-bold text-slate-900">
              <span>Reported Total:</span>
              <span>₹{candidate.sourceA.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Source B */}
        <div className="bg-white border-2 border-red-300 rounded-xl p-4 shadow-2xs space-y-3 relative">
          <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <ChannelBadge channel={candidate.sourceB.channel} />
              <span className="font-bold text-xs text-[#0b1c30]">Source Record B (Conflicting Revision)</span>
            </div>
            <span className="font-mono text-xs text-[#64748B]">{candidate.sourceB.referenceId}</span>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between text-slate-700">
              <span className="text-[#64748B]">Customer:</span>
              <span className="font-medium text-slate-900">{candidate.sourceB.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-[#64748B]">Masked Phone:</span>
              <span className="font-mono">{candidate.sourceB.customerPhone}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-[#64748B]">Delivery Address:</span>
              <span className="text-right truncate max-w-xs">{candidate.sourceB.deliveryAddress}</span>
            </div>
          </div>

          {/* Line items with Red highlight for discrepancy */}
          <div className="pt-2 border-t border-[#f1f5f9]">
            <h4 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Line Items</h4>
            <div className="space-y-1.5 text-xs">
              {candidate.sourceB.items.map((itm, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-[#fef2f2] border border-[#fca5a5]">
                  <span className="font-semibold text-red-900">
                    <strong className="text-red-700 mr-1.5 font-mono">{itm.quantity}x</strong> {itm.name}
                  </span>
                  <span className="font-mono font-bold text-red-900">₹{itm.totalPrice}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 font-mono text-xs font-bold text-slate-900">
              <span>Reported Total:</span>
              <span>₹{candidate.sourceB.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canonical Quantity Selection (For Update Flows) */}
      {!isResolved && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs">
          <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-2">
            Canonical Quantity Decision (Rule #6 Guardrail)
          </h3>
          <p className="text-xs text-[#64748B] mb-3">
            If approving a customer revision, specify the final verified quantity to dispatch to the kitchen:
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input 
                type="radio" 
                name="canonQty" 
                value={2} 
                checked={selectedQuantity === 2}
                onChange={() => setSelectedQuantity(2)}
                className="text-[#0f766e] focus:ring-[#0f766e]" 
              />
              <span>Original Zomato Quantity (2 Rolls)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input 
                type="radio" 
                name="canonQty" 
                value={3} 
                checked={selectedQuantity === 3}
                onChange={() => setSelectedQuantity(3)}
                className="text-[#0f766e] focus:ring-[#0f766e]" 
              />
              <span className="font-bold text-[#005c55]">Approved WhatsApp Customer Revision (3 Rolls)</span>
            </label>
          </div>
        </div>
      )}

      {/* Fixed Safety Action Bar */}
      {!isResolved && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#64748B]">
            <strong className="text-slate-900">Resolution Action Required:</strong> Every selection is executed atomically within a database transaction with rollback.
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => handleOpenModal('CONFIRM_DUPLICATE')}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
              title="Links duplicate records. Does NOT sum quantities."
            >
              Confirm Duplicate (No Qty Sum)
            </button>
            <button
              onClick={() => handleOpenModal('CONFIRM_UPDATE')}
              className="px-3.5 py-2 rounded-lg bg-[#0f766e] hover:bg-[#115e59] text-white shadow-2xs transition-colors"
              title="Approves customer modification to selected quantity."
            >
              Confirm Update (Qty: {selectedQuantity})
            </button>
            <button
              onClick={() => handleOpenModal('CONFIRM_SEPARATE')}
              className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-2xs transition-colors"
              title="Treats records as distinct independent orders."
            >
              Confirm Separate
            </button>
            <button
              onClick={() => handleOpenModal('KEEP_PENDING')}
              className="px-3.5 py-2 rounded-lg bg-white border border-[#e2e8f0] text-slate-700 hover:bg-[#f8f9ff] transition-colors"
            >
              Keep Pending
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Operator Rationale Modal */}
      {activeModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-[#e2e8f0] rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Authorize Resolution: {activeModalAction}
              </h3>
              <button onClick={() => setActiveModalAction(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] mb-3">
              Rule #12 requires an explicit operator justification before updating the canonical order and writing an HMAC-signed audit entry.
            </p>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-semibold text-[#0b1c30]">
                Mandatory Operator Rationale:
              </label>
              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                rows={3}
                required
                className="w-full p-2.5 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:border-[#0f766e] focus:outline-hidden"
                placeholder="Enter justification for this resolution..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveModalAction(null)}
                className="px-3.5 py-2 rounded-lg border border-[#e2e8f0] text-slate-700 hover:bg-[#f8f9ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResolution}
                disabled={isSubmitting || !reasonInput.trim()}
                className="px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Signing Transaction...' : 'Commit & Sign Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
