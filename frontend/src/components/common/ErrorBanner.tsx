import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg bg-status-critical-bg text-status-critical border border-status-critical/30 text-xs">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-critical/20 hover:bg-status-critical/30 transition-colors text-status-critical font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
