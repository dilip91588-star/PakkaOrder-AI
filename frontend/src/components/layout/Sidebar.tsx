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
  ChevronDown,
  MonitorCheck,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders Inbox', icon: ShoppingBag, badge: '1,142' },
    { to: '/review', label: 'Review Queue', icon: GitCompare, badge: '4', badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200' },
    { to: '/imports', label: 'AI Ingestion', icon: UploadCloud },
    { to: '/kds', label: 'Kitchen Display', icon: MonitorCheck, badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    { to: '/catalog', label: 'Product Catalog', icon: Boxes, badge: '148' },
    { to: '/audit', label: 'Audit Ledger', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-outline-variant flex flex-col justify-between select-none shadow-xs">
      {/* Top Brand & Tenant Switcher */}
      <div className="p-4 border-b border-outline-variant">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-primary font-black text-lg shadow-2xs">
            P
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>PakkaOrder AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-50 text-primary font-mono font-bold border border-teal-200">v2.4</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">Reconciliation Console</p>
          </div>
        </div>

        {/* Location / Tenant Selector */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Store className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <p className="font-bold text-slate-900 truncate">Spice Garden</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">Indiranagar (TEN-001)</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-teal-50 text-primary border border-teal-200/80 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    item.badgeColor || 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Public &amp; Auth
        </div>
        <NavLink
          to="/landing"
          onClick={onCloseMobile}
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Public Landing Page</span>
          </div>
        </NavLink>
        <NavLink
          to="/login"
          onClick={onCloseMobile}
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Operator Role</span>
          </div>
        </NavLink>
      </nav>

      {/* Bottom Engine Health & Operator Profile */}
      <div className="p-4 border-t border-outline-variant bg-slate-50/60 space-y-3">
        {/* Engine Status */}
        <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[11px] shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>OrderTruth Engine</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            38ms • Live
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-xs font-black text-primary">
            PM
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">Pranav M.</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">Lead Operations • Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
