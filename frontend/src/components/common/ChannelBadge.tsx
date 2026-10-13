import React from 'react';
import { MessageSquare, Terminal, Utensils, ShoppingBag, FileEdit } from 'lucide-react';
import type { Channel } from '../../types';

interface ChannelBadgeProps {
  channel: Channel;
  referenceId?: string;
  size?: 'sm' | 'md';
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, referenceId, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-semibold';

  switch (channel) {
    case 'WHATSAPP':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-2xs ${sizeClasses}`}>
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>WhatsApp</span>
          {referenceId && <span className="text-emerald-700/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'POS':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-2xs ${sizeClasses}`}>
          <Terminal className="w-3.5 h-3.5 shrink-0 text-blue-600" />
          <span>POS Terminal</span>
          {referenceId && <span className="text-blue-700/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'ZOMATO':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold shadow-2xs ${sizeClasses}`}>
          <Utensils className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>Zomato</span>
          {referenceId && <span className="text-rose-700/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'SWIGGY':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-2xs ${sizeClasses}`}>
          <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Swiggy</span>
          {referenceId && <span className="text-amber-700/80 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
    case 'MANUAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-bold shadow-2xs ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span>Manual</span>
          {referenceId && <span className="text-slate-500 font-mono text-[10px]">({referenceId})</span>}
        </span>
      );
  }
};

export default ChannelBadge;
