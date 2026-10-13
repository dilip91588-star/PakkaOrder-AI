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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-300 rounded-2xl bg-white shadow-2xs">
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 mb-3">
        <Inbox className="w-8 h-8 opacity-75" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-colors shadow-2xs"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
