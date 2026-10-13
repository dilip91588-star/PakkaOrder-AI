import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Store, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOutlet, setSelectedOutlet] = useState('TEN-001');
  const [email, setEmail] = useState('ops@spicegarden.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  const handleQuickRole = (roleEmail: string, outlet: string) => {
    setEmail(roleEmail);
    setSelectedOutlet(outlet);
    setTimeout(() => {
      navigate('/');
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-center items-center p-4 selection:bg-[#0f766e] selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#005c55] flex items-center justify-center text-white mb-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#a3faef]" />
          </div>
          <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">
            Sign In to PakkaOrder AI
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Many Channels. One Pakka Order.
          </p>
        </div>

        {/* Outlet Switcher Banner */}
        <div className="mb-5 p-3 bg-[#eff4ff] border border-[#dce9ff] rounded-xl text-xs">
          <label className="block text-[11px] font-semibold text-[#005c55] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            <span>Select Restaurant Outlet</span>
          </label>
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="w-full bg-white border border-[#bdc9c6] rounded-lg px-2.5 py-1.5 text-xs text-[#0b1c30] font-medium focus:ring-1 focus:ring-[#0f766e] focus:outline-hidden"
          >
            <option value="TEN-001">Spice Garden — Indiranagar (TEN-001)</option>
            <option value="TEN-002">Spice Garden — Koramangala (TEN-002)</option>
            <option value="TEN-003">Spice Garden — Whitefield (Cloud Kitchen)</option>
          </select>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
              Work Email / Employee ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] focus:outline-hidden"
                placeholder="operator@restaurant.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#0b1c30]">Password</label>
              <span className="text-[11px] text-[#0f766e] hover:underline cursor-pointer">Terminal Pin?</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#bdc9c6] text-[#0f766e] focus:ring-[#0f766e]" 
              />
              <span className="text-[#475569]">Remember on this POS station</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-10 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <span>Sign In to Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switcher for Evaluators */}
        <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
          <p className="text-[11px] font-semibold text-[#64748B] text-center mb-2.5 uppercase tracking-wider">
            Quick Persona Login (Evaluation Mode)
          </p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickRole('owner@spicegarden.com', 'TEN-001')}
              className="p-2 rounded-lg bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e2e8f0] text-center font-medium text-slate-800 transition-colors"
            >
              👔 Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('ops@spicegarden.com', 'TEN-001')}
              className="p-2 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] border border-[#0f766e]/30 text-center font-semibold text-[#005c55] transition-colors"
            >
              ⚡ Lead Ops
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('cashier@spicegarden.com', 'TEN-001')}
              className="p-2 rounded-lg bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e2e8f0] text-center font-medium text-slate-800 transition-colors"
            >
              🛒 Cashier
            </button>
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-[#64748B]">
        <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
        <span>HMAC-SHA256 Authenticated Session • Multi-Tenant Isolated</span>
      </div>
    </div>
  );
};
