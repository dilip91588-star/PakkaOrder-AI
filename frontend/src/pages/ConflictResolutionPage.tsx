import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Check, 
  Layers, 
  Phone, 
  MapPin, 
  ShieldCheck,
  History,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { DuplicateCandidate } from '../types';
import { ChannelBadge } from '../components/common/ChannelBadge';
import { ScorePill } from '../components/common/ScorePill';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
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

  // Modal state
  const [activeModalAction, setActiveModalAction] = useState<'CONFIRM_UPDATE' | 'CONFIRM_DUPLICATE' | 'CONFIRM_SEPARATE' | 'KEEP_PENDING' | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(3); // default for update

  // Gemini Matching Explanation (Prompt C)
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
        // Load Gemini precomputed matching evidence explanation (Prompt C)
        try {
          setIsExplaining(true);
          const expl = await apiClient.explainCandidate(candidateId);
          setAiExplanation(expl);
        } catch (_expErr) {
          // Keep UI resilient
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

  const handleExecuteResolution = async (reason: string) => {
    if (!candidate || !activeModalAction) return;
    setActionError(null);
    try {
      const res = await apiClient.resolveCandidate({
        candidateId: candidate.id,
        action: activeModalAction,
        selectedCanonicalQuantity: activeModalAction === 'CONFIRM_UPDATE' ? selectedQuantity : undefined,
        reason,
        authorizingOperator: 'Pranav M. (Lead Ops)'
      });
      setActionSuccessMsg(res.message);
      // Reload updated candidate state
      await loadCandidate(candidate.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Resolution failed');
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/review')} className="inline-flex items-center gap-1.5 text-xs text-accent-cyan hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Review Queue
        </button>
        <ErrorBanner message={error || 'Candidate not found'} onRetry={() => id && loadCandidate(id)} />
      </div>
    );
  }

  const { sourceA, sourceB } = candidate;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/review')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-cyan hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Review Queue</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-on-surface-muted">
            Candidate ID: <strong className="text-on-surface">{candidate.candidatePairId}</strong>
          </span>
          <StatusBadge severity={candidate.severity} label={candidate.status} />
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-status-success-bg border border-status-success/40 text-status-success text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="hover:underline text-[11px]">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-status-critical-bg border border-status-critical/40 text-status-critical text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="hover:underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* CRITICAL ZERO AUTO-MERGE WARNING BANNER */}
      <div className="p-4 bg-status-critical-bg border-2 border-status-critical/60 rounded-xl space-y-2 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-status-critical/20 rounded-lg text-status-critical shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-status-critical tracking-tight">
                MATERIAL CONFLICT DETECTED: Quantity Mismatch on Paneer Tikka Roll (2 vs 3)
              </h2>
              <p className="text-xs text-on-surface mt-0.5 leading-relaxed">
                <strong>Zero Auto-Merge Policy:</strong> Kitchen and billing quantities will <u>NEVER</u> be summed or automatically merged without explicit human operator authorization.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-status-critical text-white font-bold shrink-0">
            DISPATCH HELD
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-on-surface-variant font-mono">
          <span>Source Delta: +1 item (+₹240.00 difference)</span>
          <span>•</span>
          <span>Ingestion Delta: 95 seconds apart</span>
          <span>•</span>
          <span>KDS Safety Lock: Active</span>
        </div>
      </div>

      {/* 3-COLUMN COMPARISON MATRIX */}
      <div className="bg-surface-panel border border-border-crisp rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border-crisp/60 bg-surface-elevated/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-cyan" />
              <span>Side-by-Side Ingest Comparison Matrix</span>
            </h3>
            <p className="text-xs text-on-surface-muted">
              Compare source fields, pricing, quantities, and customer prep instructions.
            </p>
          </div>
          <ScorePill score={candidate.heuristicScore} showDetails={true} />
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border-crisp">
          {/* Column 1: Source A (Zomato) */}
          <div className="p-5 space-y-4 bg-surface-panel/40">
            <div className="flex items-center justify-between pb-3 border-b border-border-crisp/60">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-on-surface-muted">SOURCE A</span>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={sourceA.channel} referenceId={sourceA.referenceId} size="md" />
                </div>
              </div>
              <span className="font-mono text-xs text-on-surface font-bold">
                ₹{sourceA.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-on-surface-muted" />
                <span className="font-mono">{new Date(sourceA.receivedAt).toLocaleTimeString()} IST (12:02:10)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-on-surface-muted" />
                <span className="font-mono font-medium text-on-surface">{sourceA.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-on-surface-muted shrink-0 mt-0.5" />
                <span>{sourceA.deliveryAddress}</span>
              </div>
              {sourceA.notes && (
                <div className="p-2 bg-surface-base rounded-md border border-border-crisp/40 text-[11px] text-on-surface-muted">
                  Note: "{sourceA.notes}"
                </div>
              )}
            </div>

            {/* Line Items A */}
            <div className="pt-2 space-y-2.5">
              <span className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">Line Items</span>
              <div className="space-y-2">
                {sourceA.items.map(item => {
                  const isConflictItem = item.sku === 'SKU-PAN-01';
                  return (
                    <div 
                      key={item.id} 
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isConflictItem 
                          ? 'bg-status-critical/10 border-status-critical/40 text-on-surface' 
                          : 'bg-surface-base border-border-crisp/50 text-on-surface-variant'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-on-surface">{item.name}</p>
                        <p className="font-mono text-[11px] text-on-surface-muted">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold text-sm tabular-nums ${isConflictItem ? 'text-status-critical' : 'text-on-surface'}`}>
                          Qty: {item.quantity}
                        </p>
                        <p className="font-mono text-[11px] text-on-surface-muted">₹{item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Center Difference Column */}
          <div className="p-5 space-y-4 bg-surface-elevated/20 flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-border-crisp/60 text-center">
                <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider font-semibold">
                  FIELD &amp; DELTA ANALYSIS
                </span>
                <p className="text-xs font-bold text-on-surface mt-0.5">Evaluation Center</p>
              </div>

              {/* Conflict Highlights */}
              <div className="mt-4 space-y-3 text-xs">
                {/* Quantity Mismatch Box */}
                <div className="p-3 rounded-lg bg-status-critical-bg border-2 border-status-critical/60 space-y-1.5 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-critical text-white text-[10px] font-bold tracking-wide">
                    ⚠️ MATERIAL QUANTITY CONFLICT
                  </div>
                  <p className="text-sm font-bold font-mono text-status-critical">
                    2 vs 3 (Paneer Tikka Roll)
                  </p>
                  <p className="text-[11px] text-on-surface leading-tight">
                    Delta: +1 unit (₹240 difference). Do not sum to 5. Kitchen cannot fulfill without signoff.
                  </p>
                </div>

                {/* Naan Match Box */}
                <div className="p-2.5 rounded-lg bg-status-success-bg/40 border border-status-success/30 flex items-center justify-between text-[11px]">
                  <span className="text-on-surface font-medium">Butter Garlic Naan</span>
                  <span className="text-status-success font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Exact Match (2x)
                  </span>
                </div>

                {/* Chaas Match Box */}
                <div className="p-2.5 rounded-lg bg-status-success-bg/40 border border-status-success/30 flex items-center justify-between text-[11px]">
                  <span className="text-on-surface font-medium">Masala Chaas</span>
                  <span className="text-status-success font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Exact Match (2x)
                  </span>
                </div>

                {/* Instruction Variance */}
                <div className="p-2.5 rounded-lg bg-status-warning-bg/40 border border-status-warning/30 space-y-1 text-[11px]">
                  <span className="text-status-warning font-semibold">Modifier Addendum Detected</span>
                  <p className="text-on-surface-muted leading-tight">
                    WhatsApp note requests: "extra green chutney chahiye and make rolls 3". Indicates intentional amendment.
                  </p>
                </div>
              </div>
            </div>

            {/* Heuristic Breakdown Bar Chart */}
            <div className="pt-3 border-t border-border-crisp/60 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface uppercase text-[10px]">Deterministic Heuristic Features</span>
                <span className="font-mono text-[9px] text-accent-cyan bg-surface-base px-1.5 py-0.5 rounded border border-border-crisp">
                  Algo: {candidate.scoreAlgorithmVersion || 'v2.4.0-deterministic'}
                </span>
              </div>
              
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-on-surface-muted">
                    <span>Phone Hash Match</span>
                    <span className="font-mono text-accent-cyan">100%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-base rounded-full overflow-hidden">
                    <div style={{ width: '100%' }} className="h-full bg-accent-cyan" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-on-surface-muted">
                    <span>Geo Address Similarity</span>
                    <span className="font-mono text-accent-cyan">96%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-base rounded-full overflow-hidden">
                    <div style={{ width: '96%' }} className="h-full bg-accent-cyan" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-on-surface-muted">
                    <span>Arrival Proximity (95s delta)</span>
                    <span className="font-mono text-accent-cyan">92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-base rounded-full overflow-hidden">
                    <div style={{ width: '92%' }} className="h-full bg-accent-cyan" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Source B (WhatsApp) */}
          <div className="p-5 space-y-4 bg-surface-panel/40">
            <div className="flex items-center justify-between pb-3 border-b border-border-crisp/60">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-on-surface-muted">SOURCE B</span>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={sourceB.channel} referenceId={sourceB.referenceId} size="md" />
                </div>
              </div>
              <span className="font-mono text-xs text-on-surface font-bold">
                ₹{sourceB.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-on-surface-muted" />
                <span className="font-mono">{new Date(sourceB.receivedAt).toLocaleTimeString()} IST (12:03:45)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-on-surface-muted" />
                <span className="font-mono font-medium text-on-surface">{sourceB.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-on-surface-muted shrink-0 mt-0.5" />
                <span>{sourceB.deliveryAddress}</span>
              </div>
              {sourceB.notes && (
                <div className="p-2 bg-surface-base rounded-md border border-border-crisp/40 text-[11px] text-on-surface-muted">
                  Note: "{sourceB.notes}"
                </div>
              )}
            </div>

            {/* Line Items B */}
            <div className="pt-2 space-y-2.5">
              <span className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">Line Items</span>
              <div className="space-y-2">
                {sourceB.items.map(item => {
                  const isConflictItem = item.sku === 'SKU-PAN-01';
                  return (
                    <div 
                      key={item.id} 
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isConflictItem 
                          ? 'bg-status-critical/10 border-status-critical/40 text-on-surface' 
                          : 'bg-surface-base border-border-crisp/50 text-on-surface-variant'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-on-surface">{item.name}</p>
                        <p className="font-mono text-[11px] text-on-surface-muted">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold text-sm tabular-nums ${isConflictItem ? 'text-status-critical' : 'text-on-surface'}`}>
                          Qty: {item.quantity}
                        </p>
                        <p className="font-mono text-[11px] text-on-surface-muted">₹{item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI MATCHING EVIDENCE EXPLANATION (PROMPT C) */}
      <div className="bg-surface-panel border border-border-crisp rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border-crisp/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Gemini AI Evidence Explanation (Prompt C Contract)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-accent-cyan bg-surface-base px-2 py-0.5 rounded border border-border-crisp">
              Prompt: match-explanation-v1
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-status-warning-bg text-status-warning border border-status-warning/40 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Decision: HUMAN_REVIEW_REQUIRED</span>
            </span>
          </div>
        </div>

        {isExplaining ? (
          <div className="py-4 text-center text-xs text-on-surface-muted flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-accent-cyan" />
            <span>Generating evidence explanation from precomputed features...</span>
          </div>
        ) : aiExplanation ? (
          <div className="space-y-3 text-xs">
            <p className="text-on-surface font-medium leading-relaxed bg-surface-base p-2.5 rounded-lg border border-border-crisp">
              {aiExplanation.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Supporting Evidence */}
              <div className="p-3 rounded-lg bg-surface-base border border-border-crisp space-y-1.5">
                <span className="text-[10px] font-semibold text-status-success uppercase tracking-wider block">
                  ✓ Supporting Evidence Points
                </span>
                <ul className="space-y-1 text-on-surface-variant text-[11px]">
                  {(aiExplanation.supportingEvidence || []).map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-status-success mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contradictions & Conflicts */}
              <div className="p-3 rounded-lg bg-surface-base border border-border-crisp space-y-1.5">
                <span className="text-[10px] font-semibold text-status-warning uppercase tracking-wider block">
                  ⚠ Contradictions &amp; Contested Fields
                </span>
                <div className="space-y-1.5 text-[11px]">
                  {(aiExplanation.conflicts || []).map((cf: any, i: number) => (
                    <div key={i} className="p-1.5 rounded bg-status-critical/10 border border-status-critical/20">
                      <code className="text-[10px] text-status-critical block font-mono">{cf.fieldPath}</code>
                      <p className="text-on-surface leading-tight text-[10px]">{cf.explanation}</p>
                    </div>
                  ))}
                  {(!aiExplanation.conflicts || aiExplanation.conflicts.length === 0) && (
                    <p className="text-on-surface-muted text-[11px]">No material field conflicts flagged.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-[11px] text-on-surface flex items-center justify-between">
              <div>
                <strong className="text-accent-cyan">Recommended Action: </strong>
                <span>{aiExplanation.recommendedReview}</span>
              </div>
              <span className="text-[10px] font-mono text-on-surface-muted italic">
                Automated merging strictly prohibited by system rule #QNT-04
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* RESOLUTION DECISION ACTIONS (4 EXPLICIT OPTIONS) */}
      <div className="bg-surface-panel border border-border-crisp rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-cyan" />
            <span>Human Operator Resolution Authorization</span>
          </h3>
          <p className="text-xs text-on-surface-muted">
            Select one explicit resolution path below. Merging is NOT the default action.
          </p>
        </div>

        {/* 4 Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Option A: Confirm Authorized Update (Recommended) */}
          <div className="p-4 rounded-xl bg-surface-elevated border-2 border-accent-cyan/50 hover:border-accent-cyan flex flex-col justify-between space-y-3 transition-all relative">
            <span className="absolute -top-2.5 right-3 text-[10px] bg-accent-cyan text-surface-base px-2 py-0.5 rounded-full font-bold">
              Recommended
            </span>
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-on-surface">Option A: Confirm Authorized Update</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Customer explicitly amended their order via WhatsApp from 2 to 3 rolls. Set canonical truth quantity to 3 rolls.
              </p>
              <div className="pt-2 text-xs">
                <label className="text-[11px] text-on-surface-muted block mb-1">Confirm Canonical Qty:</label>
                <select
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                  className="w-full px-2.5 py-1 bg-surface-base border border-border-crisp rounded-md text-xs font-mono font-bold text-accent-cyan"
                >
                  <option value={3}>3 Rolls (WhatsApp Amendment • Recommended)</option>
                  <option value={2}>2 Rolls (Original Zomato Base)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setActiveModalAction('CONFIRM_UPDATE')}
              className="w-full py-2 px-3 rounded-lg bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base font-bold text-xs transition-colors shadow-xs"
            >
              Authorize Update (Qty = {selectedQuantity})
            </button>
          </div>

          {/* Option B: Confirm Duplicate Entry */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-crisp hover:border-slate-500 flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-on-surface">Option B: Confirm Duplicate Entry</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Treat WhatsApp message as duplicate chatter. Keep original Zomato order (Qty = 2). Does <u>NOT</u> sum quantities.
              </p>
            </div>
            <button
              onClick={() => setActiveModalAction('CONFIRM_DUPLICATE')}
              className="w-full py-2 px-3 rounded-lg border border-border-crisp hover:bg-surface-panel text-on-surface font-semibold text-xs transition-colors"
            >
              Confirm Duplicate (Keep Qty = 2)
            </button>
          </div>

          {/* Option C: Confirm Separate Orders */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-crisp hover:border-slate-500 flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-on-surface">Option C: Confirm Separate Orders</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Customer ordered twice for different people. Split into 2 independent kitchen tickets (ORD-1042 for ₹756 and ORD-1043 for ₹1,008).
              </p>
            </div>
            <button
              onClick={() => setActiveModalAction('CONFIRM_SEPARATE')}
              className="w-full py-2 px-3 rounded-lg border border-border-crisp hover:bg-surface-panel text-on-surface font-semibold text-xs transition-colors"
            >
              Split as Separate Orders
            </button>
          </div>

          {/* Option D: Keep Pending / Request Verification */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-status-warning/40 hover:border-status-warning flex flex-col justify-between space-y-3 transition-all">
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-status-warning">Option D: Keep Pending</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Hold kitchen dispatch and send WhatsApp clarification prompt to +91 98765 ****10 to confirm whether they want 2 or 3 rolls.
              </p>
            </div>
            <button
              onClick={() => setActiveModalAction('KEEP_PENDING')}
              className="w-full py-2 px-3 rounded-lg bg-status-warning/15 hover:bg-status-warning/25 text-status-warning border border-status-warning/40 font-semibold text-xs transition-colors"
            >
              Hold &amp; Ask Customer
            </button>
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL AUDIT & PROVENANCE TIMELINE */}
      <div className="bg-surface-panel border border-border-crisp rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-bold text-on-surface">Chronological Provenance &amp; Audit Timeline</h3>
          </div>
          <span className="text-[11px] font-mono text-on-surface-muted bg-surface-base px-2 py-0.5 rounded border border-border-crisp">
            SHA-256 Tamper-Evident Ledger
          </span>
        </div>

        <div className="relative border-l-2 border-border-crisp ml-4 pl-6 space-y-5 my-2">
          {/* T0: Initial Ingestion of Source A */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-accent-teal border-2 border-surface-base" />
            <div className="p-3 bg-surface-base rounded-lg border border-border-crisp/60 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <ChannelBadge channel={sourceA.channel} referenceId={sourceA.referenceId} />
                  <span>Order Ingested (Source A)</span>
                </span>
                <span className="font-mono text-on-surface-muted text-[11px]">
                  {new Date(sourceA.receivedAt).toLocaleTimeString()} IST
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Received via {sourceA.channel} webhook. Customer: {sourceA.customerName} ({sourceA.customerPhone}). 
                Address: {sourceA.deliveryAddress}. Total: ₹{sourceA.totalAmount.toFixed(2)}. 
                Initial canonical baseline established (Version 1).
              </p>
            </div>
          </div>

          {/* T1: Ingestion of Source B */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-accent-cyan border-2 border-surface-base" />
            <div className="p-3 bg-surface-base rounded-lg border border-border-crisp/60 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <ChannelBadge channel={sourceB.channel} referenceId={sourceB.referenceId} />
                  <span>Subsequent Ingest (Source B)</span>
                </span>
                <span className="font-mono text-on-surface-muted text-[11px]">
                  {new Date(sourceB.receivedAt).toLocaleTimeString()} IST (+95s)
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Received via {sourceB.channel}. Matched customer phone hash. 
                Note: "{sourceB.notes || 'Amended order details'}". Total: ₹{sourceB.totalAmount.toFixed(2)}.
              </p>
            </div>
          </div>

          {/* T2: Deterministic Heuristic Engine Evaluation */}
          <div className="relative group">
            <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-status-critical border-2 border-surface-base" />
            <div className="p-3 bg-surface-base rounded-lg border border-status-critical/40 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-status-critical flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Deterministic Heuristic Evaluation Flagged Material Conflict</span>
                </span>
                <span className="font-mono text-accent-cyan text-[11px]">
                  Match Score: {candidate.heuristicScore}% ({candidate.scoreAlgorithmVersion || 'v2.4.0-deterministic'})
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Detected <strong>QUANTITY_MISMATCH</strong> on SKU-PAN-01 (Qty 2 in Source A vs Qty 3 in Source B). 
                Zero Auto-Merge Policy invoked. Kitchen preparation halted. Case placed in review queue.
              </p>
            </div>
          </div>

          {/* T3: Current Operator State */}
          <div className="relative group">
            <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ${candidate.status.startsWith('RESOLVED') ? 'bg-status-success' : 'bg-status-warning'} border-2 border-surface-base`} />
            <div className={`p-3 bg-surface-base rounded-lg border ${candidate.status.startsWith('RESOLVED') ? 'border-status-success/40' : 'border-status-warning/40'} space-y-1`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${candidate.status.startsWith('RESOLVED') ? 'text-status-success' : 'text-status-warning'} flex items-center gap-1.5`}>
                  {candidate.status.startsWith('RESOLVED') ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{candidate.status.startsWith('RESOLVED') ? `Resolved: ${candidate.status}` : 'Pending Human Operator Review'}</span>
                </span>
                <span className="font-mono text-on-surface-muted text-[11px]">
                  {candidate.status.startsWith('RESOLVED') ? 'Committed & Verified' : 'Awaiting Signoff'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {candidate.status.startsWith('RESOLVED')
                  ? `Resolution committed by authorized operator. Immutable audit record signed with HMAC-SHA256. Canonical truth locked.`
                  : `Held at ops review queue. Four explicit actions available. No automatic merging without operator justification.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      <ConfirmationModal
        isOpen={activeModalAction !== null}
        title={
          activeModalAction === 'CONFIRM_UPDATE' ? 'Confirm Authorized Quantity Update' :
          activeModalAction === 'CONFIRM_DUPLICATE' ? 'Confirm Duplicate Intake' :
          activeModalAction === 'CONFIRM_SEPARATE' ? 'Confirm Separate Independent Orders' :
          'Confirm Hold & Dispatch Clarification'
        }
        actionType={activeModalAction || 'GENERIC'}
        description={
          activeModalAction === 'CONFIRM_UPDATE' 
            ? `You are confirming an authorized update amending the canonical order to ${selectedQuantity} Paneer Tikka Rolls. This updates KDS and pushes the financial delta to POS.`
            : activeModalAction === 'CONFIRM_DUPLICATE'
            ? 'You are marking the second order as a duplicate entry. Retaining Zomato Qty = 2. Quantities will NOT be summed.'
            : activeModalAction === 'CONFIRM_SEPARATE'
            ? 'You are confirming that both records represent separate, distinct orders. Two independent tickets will be produced.'
            : 'You are setting this case to In Review / Keep Pending. Canonical records remain unmerged. Customer clarification query will be triggered.'
        }
        beforeAfterPreview={{
          before: activeModalAction === 'KEEP_PENDING' ? 'Candidate Status: PENDING (Dispatch Held)' : 'Paneer Tikka Roll: Qty = 2 (Unresolved Conflict)',
          after: activeModalAction === 'CONFIRM_UPDATE' ? `Paneer Tikka Roll: Qty = ${selectedQuantity} (Canonical Truth)` : activeModalAction === 'KEEP_PENDING' ? 'Candidate Status: IN_REVIEW (Awaiting Response)' : 'Paneer Tikka Roll: Qty = 2 (Canonical Truth)',
          warning: activeModalAction === 'KEEP_PENDING' ? 'Kitchen dispatch remains held until clarification is completed.' : 'Material action: Creates an immutable audit entry in the ISO-27001 cryptographic ledger.'
        }}
        confirmLabel={activeModalAction === 'KEEP_PENDING' ? 'Authorize Hold & Query' : 'Authorize & Commit Decision'}
        onClose={() => setActiveModalAction(null)}
        onConfirm={handleExecuteResolution}
      />
    </div>
  );
};
