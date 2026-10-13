import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse p-4" aria-busy="true" aria-label="Loading content">
      <div className="h-6 bg-surface-elevated rounded-md w-1/4 border border-border-crisp/40"></div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-panel rounded-lg border border-border-crisp/30 flex items-center px-4 gap-4">
            <div className="h-4 bg-surface-elevated rounded-sm w-16"></div>
            <div className="h-4 bg-surface-elevated rounded-sm w-32"></div>
            <div className="h-4 bg-surface-elevated rounded-sm w-48"></div>
            <div className="ml-auto h-4 bg-surface-elevated rounded-sm w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
