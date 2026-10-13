import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  RefreshCw, 
  Bell, 
  Plus, 
  Menu, 
  Check 
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
    <header className="h-14 bg-surface-panel border-b border-border-crisp px-4 flex items-center justify-between gap-4 z-20">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md hover:bg-surface-elevated text-on-surface-muted hover:text-on-surface"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Omni-Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearch}
            placeholder="Search orders by ID, hash, customer, phone (+91)... (⌘K)"
            className="w-full pl-9 pr-12 py-1.5 bg-surface-base border border-border-crisp rounded-lg text-xs text-on-surface placeholder:text-on-surface-muted focus:outline-hidden focus:ring-1 focus:ring-accent-cyan"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-on-surface-muted bg-surface-elevated px-1.5 py-0.5 rounded-sm border border-border-crisp">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2.5">
        {/* Sync Channels Button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-crisp hover:bg-surface-elevated text-xs font-medium text-on-surface-variant transition-colors"
          title="Manually trigger multi-channel ingestion sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent-cyan ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Channels'}</span>
        </button>

        {/* Sync Toast Feedback */}
        {syncToast && (
          <div className="fixed top-16 right-4 z-50 p-2.5 bg-surface-elevated border border-status-success/40 rounded-lg shadow-xl text-xs text-status-success flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span>Webhooks and channels synchronized with Zero Loss.</span>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg border border-border-crisp hover:bg-surface-elevated text-on-surface-variant relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-status-warning absolute top-1 right-1"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-elevated border border-border-crisp rounded-xl shadow-2xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border-crisp/60 mb-2">
                <span className="font-semibold text-on-surface">Urgent Operational Alerts</span>
                <span className="text-[10px] bg-status-warning/20 text-status-warning px-1.5 py-0.5 rounded-full font-mono">2 Critical</span>
              </div>
              <div className="space-y-2">
                <div 
                  onClick={() => { setShowNotifications(false); navigate('/review/CAN-8841'); }}
                  className="p-2 rounded-lg bg-surface-base hover:bg-surface-panel cursor-pointer border border-status-critical/30 transition-colors"
                >
                  <p className="font-medium text-status-critical flex items-center justify-between">
                    <span>CAN-8841: Quantity Mismatch</span>
                    <span className="text-[10px] text-on-surface-muted">2m ago</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Paneer Tikka Roll differs: 2 (Zomato) vs 3 (WhatsApp). Dispatch held.
                  </p>
                </div>
                <div 
                  onClick={() => { setShowNotifications(false); navigate('/review'); }}
                  className="p-2 rounded-lg bg-surface-base hover:bg-surface-panel cursor-pointer border border-border-crisp transition-colors"
                >
                  <p className="font-medium text-on-surface flex items-center justify-between">
                    <span>CAN-8839: Modifier Conflict</span>
                    <span className="text-[10px] text-on-surface-muted">7m ago</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan hover:bg-accent-cyan-hover text-surface-base font-semibold text-xs transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ingestion</span>
        </button>
      </div>
    </header>
  );
};
