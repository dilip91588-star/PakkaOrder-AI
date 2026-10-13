import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  actionType: 'CONFIRM_UPDATE' | 'CONFIRM_DUPLICATE' | 'CONFIRM_SEPARATE' | 'KEEP_PENDING' | 'GENERIC';
  description: string;
  beforeAfterPreview?: {
    before: string;
    after: string;
    warning?: string;
  };
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  actionType,
  description,
  beforeAfterPreview,
  confirmLabel,
  confirmVariant = 'primary',
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide an operational justification reason.');
      return;
    }
    if (!isAcknowledged) {
      setError('You must acknowledge the immutable audit trail notice.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(reason);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonClass = () => {
    if (confirmVariant === 'danger') return 'bg-status-critical hover:bg-rose-600 text-white';
    if (confirmVariant === 'warning') return 'bg-status-warning hover:bg-amber-600 text-surface-base font-semibold';
    return 'bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base font-semibold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-surface-elevated border border-border-crisp rounded-xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-crisp/60 bg-surface-panel">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${actionType === 'CONFIRM_UPDATE' ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-status-warning/15 text-status-warning'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="modal-title" className="text-base font-semibold text-on-surface">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-on-surface-muted hover:text-on-surface p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-on-surface">
          <p className="text-on-surface-variant leading-relaxed">
            {description}
          </p>

          {/* Before vs After preview */}
          {beforeAfterPreview && (
            <div className="p-3.5 bg-surface-base rounded-lg border border-border-crisp space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border-crisp/40">
                <span className="text-on-surface-muted">Current State:</span>
                <span className="text-status-critical font-medium">{beforeAfterPreview.before}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-muted">Canonical Target State:</span>
                <span className="text-accent-cyan font-medium">{beforeAfterPreview.after}</span>
              </div>
              {beforeAfterPreview.warning && (
                <div className="mt-2 text-[11px] text-status-warning flex items-start gap-1.5 font-sans pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{beforeAfterPreview.warning}</span>
                </div>
              )}
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="resolution-reason" className="block text-xs font-medium text-on-surface-variant">
              Operational Justification Reason <span className="text-status-critical">*</span>
            </label>
            <textarea
              id="resolution-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer confirmed quantity update to 3 rolls via WhatsApp chat."
              className="w-full px-3 py-2 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface placeholder:text-on-surface-muted focus:outline-hidden focus:ring-1 focus:ring-accent-cyan resize-none"
            />
          </div>

          {/* Tamper-proof Audit Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="mt-0.5 rounded-sm bg-surface-base border-border-crisp text-accent-cyan focus:ring-accent-cyan"
            />
            <span className="text-xs text-on-surface-variant leading-tight">
              I have inspected the raw payloads. This material decision will be cryptographically logged to the ISO-27001 audit ledger.
            </span>
          </label>

          {error && (
            <div className="p-2.5 rounded-md bg-status-critical-bg text-status-critical border border-status-critical/30 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-crisp/60 bg-surface-panel">
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Actor: Pranav M. (Lead Ops)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg border border-border-crisp hover:bg-surface-elevated text-on-surface-variant text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 ${getButtonClass()}`}
            >
              {isSubmitting ? 'Recording Decision...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
