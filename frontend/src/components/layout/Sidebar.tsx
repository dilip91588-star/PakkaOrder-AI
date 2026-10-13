import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  GitCompare, 
  UploadCloud, 
  Boxes, 
  History, 
  Settings, 
  Store, 
  ChevronDown 
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: ShoppingBag, badge: '1,142' },
    { to: '/review', label: 'Review Queue', icon: GitCompare, badge: '4', badgeColor: 'bg-status-warning/20 text-status-warning border border-status-warning/40' },
    { to: '/imports', label: 'Imports', icon: UploadCloud },
    { to: '/catalog', label: 'Product Catalog', icon: Boxes, badge: '148' },
    { to: '/audit', label: 'Audit History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-surface-panel border-r border-border-crisp flex flex-col justify-between select-none">
      {/* Top Brand & Tenant Switcher */}
      <div className="p-4 border-b border-border-crisp/60">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan font-bold text-base shadow-xs">
            P
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-on-surface flex items-center gap-1.5">
              <span>PakkaOrderAI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-accent-cyan/10 text-accent-cyan font-mono border border-accent-cyan/20">v2.4</span>
            </div>
            <p className="text-[11px] text-on-surface-muted leading-none">Reconciliation Console</p>
          </div>
        </div>

        {/* Location / Tenant Selector */}
        <div className="mt-3 p-2 bg-surface-base rounded-lg border border-border-crisp flex items-center justify-between text-xs cursor-pointer hover:border-slate-500 transition-colors">
          <div className="flex items-center gap-2 overflow-hidden">
            <Store className="w-4 h-4 text-accent-cyan shrink-0" />
            <div className="truncate">
              <p className="font-semibold text-on-surface truncate">Spice Garden</p>
              <p className="text-[10px] text-on-surface-muted truncate">Indiranagar (TEN-001)</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-accent-cyan-subtle text-accent-cyan border border-accent-cyan/30 shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-elevated hover:text-on-surface'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-105" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    item.badgeColor || 'bg-surface-elevated text-on-surface-variant border border-border-crisp/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Engine Health & Operator Profile */}
      <div className="p-3 border-t border-border-crisp/60 bg-surface-panel/80 space-y-2.5">
        {/* Engine Status */}
        <div className="px-2.5 py-1.5 rounded-md bg-surface-base border border-border-crisp flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-on-surface-muted">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            <span>OrderTruth Engine</span>
          </div>
          <span className="text-[10px] font-mono text-status-success">38ms • Healthy</span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border-crisp flex items-center justify-center text-xs font-semibold text-accent-cyan">
            PM
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-on-surface truncate">Pranav M.</p>
            <p className="text-[10px] text-on-surface-muted truncate">Lead Operations</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
