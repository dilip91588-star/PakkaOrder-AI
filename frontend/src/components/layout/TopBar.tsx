import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  RefreshCw, 
  Bell, 
  Plus, 
  Menu, 
  Check,
  AlertTriangle
} from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onSearchChange?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu, onSearchChange }) => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncToast(true);
      setTimeout(() => setSyncToast(false), 3000);
    }, 800);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchChange?.(e.target.value);
  };

  return (
    <header className="h-16 bg-white border-b border-outline-variant px-5 flex items-center justify-between gap-4 z-20 shadow-2xs">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Omni-Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearch}
            placeholder="Search orders by ID, hash, customer, phone (+91)... (⌘K)"
            className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-3">
        {/* Sync Channels Button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          title="Manually trigger multi-channel ingestion sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Channels'}</span>
        </button>

        {/* Sync Toast Feedback */}
        {syncToast && (
          <div className="fixed top-18 right-5 z-50 px-4 py-3 bg-white border border-emerald-200 rounded-xl shadow-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Webhooks and channels synchronized with Zero Loss.</span>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 relative transition-colors shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5 animate-pulse"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-84 bg-white border border-outline-variant rounded-2xl shadow-2xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="font-black text-slate-900 text-sm">Urgent Operational Alerts</span>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-mono font-bold">2 Critical</span>
              </div>
              <div className="space-y-2.5">
                <div 
                  onClick={() => { setShowNotifications(false); navigate('/review/CAN-8841'); }}
                  className="p-3 rounded-xl bg-red-50/60 hover:bg-red-50 cursor-pointer border border-red-200 transition-colors"
                >
                  <p className="font-bold text-red-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>CAN-8841: Quantity Mismatch</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">2m ago</span>
                  </p>
                  <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                    Paneer Tikka Roll differs: 2 (Zomato) vs 3 (WhatsApp). Dispatch held.
                  </p>
                </div>
                <div 
                  onClick={() => { setShowNotifications(false); navigate('/review'); }}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer border border-slate-200 transition-colors"
                >
                  <p className="font-bold text-slate-900 flex items-center justify-between">
                    <span>CAN-8839: Modifier Conflict</span>
                    <span className="text-[10px] text-slate-400 font-normal">7m ago</span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    No Onions vs Extra Spicy on Dal Makhani.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Header CTA */}
        <button
          onClick={() => navigate('/imports')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Ingestion</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
