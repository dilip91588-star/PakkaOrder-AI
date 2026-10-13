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
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-bold' : 'px-3 py-1 text-sm font-bold';

  if (severity === 'CRITICAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-800 border border-red-200 shadow-2xs ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
        <span>{label || 'Critical Conflict'}</span>
      </span>
    );
  }

  if (severity === 'WARNING') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs ${sizeClasses}`}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>{label || 'Warning'}</span>
      </span>
    );
  }

  if (severity === 'INFO') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-primary border border-teal-200 shadow-2xs ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
        <span>{label || 'Timing Match'}</span>
      </span>
    );
  }

  // Reconciliation status styles
  switch (status) {
    case 'CONFLICT_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-800 border border-red-200 shadow-2xs ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span>{label || 'Conflict Under Review'}</span>
        </span>
      );
    case 'MERGED_CANONICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-primary border border-teal-200 shadow-2xs ${sizeClasses}`}>
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-primary" />
          <span>{label || 'Merged Canonical (2 Sources)'}</span>
        </span>
      );
    case 'CANONICAL_CLEAN':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>{label || 'Single Source Clean'}</span>
        </span>
      );
    case 'MANUAL_LINKED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-primary border border-teal-200 shadow-2xs ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-primary" />
          <span>{label || 'Manual Linked'}</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs ${sizeClasses}`}>
          <span>{label || status || 'Unknown'}</span>
        </span>
      );
  }
};

export default StatusBadge;
