import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border-crisp rounded-xl bg-surface-panel/40">
      <div className="p-3 bg-surface-elevated border border-border-crisp rounded-xl text-on-surface-muted mb-3">
        <Inbox className="w-8 h-8 opacity-75" />
      </div>
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      <p className="text-xs text-on-surface-muted max-w-sm mt-1">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3.5 py-1.5 rounded-lg bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base text-xs font-semibold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
