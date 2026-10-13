import React from 'react';
import { MessageSquare, Terminal, Utensils, ShoppingBag, FileEdit } from 'lucide-react';
import type { Channel } from '../../types';

interface ChannelBadgeProps {
  channel: Channel;
  referenceId?: string;
  size?: 'sm' | 'md';
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, referenceId, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  switch (channel) {
    case 'WHATSAPP':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium ${sizeClasses}`}>
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>WhatsApp</span>
          {referenceId && <span className="text-emerald-400/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'POS':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/60 font-medium ${sizeClasses}`}>
          <Terminal className="w-3.5 h-3.5 shrink-0 text-blue-400" />
          <span>POS Terminal</span>
          {referenceId && <span className="text-blue-400/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'ZOMATO':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/60 font-medium ${sizeClasses}`}>
          <Utensils className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>Zomato</span>
          {referenceId && <span className="text-rose-400/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'SWIGGY':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium ${sizeClasses}`}>
          <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Swiggy</span>
          {referenceId && <span className="text-amber-400/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'MANUAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-slate-300 border border-border-crisp font-medium ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>Manual</span>
          {referenceId && <span className="text-slate-400/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
  }
};
