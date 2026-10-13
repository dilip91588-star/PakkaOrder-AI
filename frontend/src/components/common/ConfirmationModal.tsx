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
    if (confirmVariant === 'danger') return 'bg-red-600 hover:bg-red-700 text-white font-bold';
    if (confirmVariant === 'warning') return 'bg-amber-600 hover:bg-amber-700 text-white font-bold';
    return 'bg-primary hover:bg-primary-container text-white font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${actionType === 'CONFIRM_UPDATE' ? 'bg-teal-50 text-primary border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="modal-title" className="text-base font-bold text-slate-900">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <p className="text-slate-600 leading-relaxed text-xs">
            {description}
          </p>

          {/* Before vs After preview */}
          {beforeAfterPreview && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Current State:</span>
                <span className="text-red-700 font-bold">{beforeAfterPreview.before}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Canonical Target State:</span>
                <span className="text-primary font-bold">{beforeAfterPreview.after}</span>
              </div>
              {beforeAfterPreview.warning && (
                <div className="mt-2 text-[11px] text-amber-800 flex items-start gap-1.5 font-sans pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{beforeAfterPreview.warning}</span>
                </div>
              )}
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="resolution-reason" className="block text-xs font-bold text-slate-700">
              Operational Justification Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="resolution-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer confirmed quantity update to 3 rolls via WhatsApp chat."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Tamper-proof Audit Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-slate-600 leading-tight">
              I have inspected the raw payloads. This material decision will be cryptographically logged to the ISO-27001 audit ledger.
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Actor: Pranav M. (Lead Ops)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
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
