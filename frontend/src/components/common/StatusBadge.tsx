import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import type { ReconciliationStatus, ConflictSeverity } from '../../types';

interface StatusBadgeProps {
  status?: ReconciliationStatus;
  severity?: ConflictSeverity;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, severity, label, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-medium';

  if (severity === 'CRITICAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-status-critical-bg text-status-critical border border-status-critical/30 font-medium ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{label || 'Critical Conflict'}</span>
      </span>
    );
  }

  if (severity === 'WARNING') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-status-warning-bg text-status-warning border border-status-warning/30 font-medium ${sizeClasses}`}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{label || 'Warning'}</span>
      </span>
    );
  }

  if (severity === 'INFO') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-accent-cyan-subtle text-accent-cyan border border-accent-cyan/30 font-medium ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{label || 'Timing Match'}</span>
      </span>
    );
  }

  // Reconciliation status styles
  switch (status) {
    case 'CONFLICT_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-status-critical-bg text-status-critical border border-status-critical/30 font-medium ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{label || 'Conflict Under Review'}</span>
        </span>
      );
    case 'MERGED_CANONICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-accent-cyan-subtle text-accent-cyan border border-accent-cyan/30 font-medium ${sizeClasses}`}>
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
          <span>{label || 'Merged Canonical (2 Sources)'}</span>
        </span>
      );
    case 'CANONICAL_CLEAN':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-status-success-bg text-status-success border border-status-success/30 font-medium ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{label || 'Single Source Clean'}</span>
        </span>
      );
    case 'MANUAL_LINKED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-accent-teal/15 text-accent-teal border border-accent-teal/30 font-medium ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{label || 'Manual Linked'}</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-slate-300 border border-border-crisp font-medium ${sizeClasses}`}>
          <span>{label || status || 'Unknown'}</span>
        </span>
      );
  }
};
