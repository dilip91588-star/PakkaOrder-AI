import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse p-4" aria-busy="true" aria-label="Loading content">
      <div className="h-7 bg-slate-200 rounded-xl w-1/4 border border-slate-200"></div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 bg-white rounded-2xl border border-slate-200 flex items-center px-4 gap-4 shadow-2xs">
            <div className="h-4 bg-slate-200 rounded-md w-16"></div>
            <div className="h-4 bg-slate-200 rounded-md w-32"></div>
            <div className="h-4 bg-slate-200 rounded-md w-48"></div>
            <div className="ml-auto h-4 bg-slate-200 rounded-md w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
