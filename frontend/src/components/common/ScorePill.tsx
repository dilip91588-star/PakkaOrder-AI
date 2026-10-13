import React from 'react';
import { Target } from 'lucide-react';

interface ScorePillProps {
  score: number; // 0 - 100
  version?: string;
  showDetails?: boolean;
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, version = 'v2.1 Heuristic', showDetails = false }) => {
  let colorClass = 'border-accent-cyan/40 bg-accent-cyan-subtle text-accent-cyan';
  if (score >= 95) {
    colorClass = 'border-accent-cyan/60 bg-accent-cyan/15 text-accent-cyan';
  } else if (score >= 85) {
    colorClass = 'border-amber-500/40 bg-amber-500/10 text-amber-400';
  } else {
    colorClass = 'border-slate-500/40 bg-slate-500/10 text-slate-300';
  }

  return (
    <div className="inline-flex items-center gap-1.5" title={`Deterministic Heuristic Engine score (${version}). Strictly non-probabilistic.`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold tabular-nums ${colorClass}`}>
        <Target className="w-3.5 h-3.5 opacity-80" />
        <span>{score} / 100</span>
      </span>
      {showDetails && (
        <span className="text-[11px] text-on-surface-muted hidden sm:inline">
          Match Score ({version})
        </span>
      )}
    </div>
  );
};
