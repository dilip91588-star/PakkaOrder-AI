import React from 'react';
import { Target } from 'lucide-react';

interface ScorePillProps {
  score: number; // 0 - 100
  version?: string;
  showDetails?: boolean;
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, version = 'v2.1 Heuristic', showDetails = false }) => {
  let colorClass = 'border-teal-200 bg-teal-50 text-primary';
  if (score >= 95) {
    colorClass = 'border-teal-200 bg-teal-50 text-primary font-bold';
  } else if (score >= 85) {
    colorClass = 'border-amber-200 bg-amber-50 text-amber-800 font-bold';
  } else {
    colorClass = 'border-slate-200 bg-slate-100 text-slate-700 font-medium';
  }

  return (
    <div className="inline-flex items-center gap-1.5" title={`Deterministic Heuristic Engine score (${version}). Strictly non-probabilistic.`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs tabular-nums ${colorClass}`}>
        <Target className="w-3.5 h-3.5 opacity-80" />
        <span>{score} / 100</span>
      </span>
      {showDetails && (
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Match Score ({version})
        </span>
      )}
    </div>
  );
};

export default ScorePill;
