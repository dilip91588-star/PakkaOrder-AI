import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Receipt, 
  Layers, 
  Clock, 
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased selection:bg-[#0f766e] selection:text-white">
      {/* 1. STICKY NAVIGATION */}
      <header className="sticky top-0 z-50 w-full h-14 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-xs">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/landing')}>
            <div className="w-8 h-8 rounded-lg bg-[#005c55] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-[#a3faef]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-base tracking-tight text-[#0b1c30]">PakkaOrder</span>
              <span className="font-bold text-base text-[#0f766e]">AI</span>
            </div>
          </div>

          {/* Nav Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#475569]">
            <a href="#the-problem" className="hover:text-[#0b1c30] transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-[#0b1c30] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#0b1c30] transition-colors">Safety Features</a>
            <a href="#interactive-demo" className="hover:text-[#0b1c30] transition-colors">Interactive Demo</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-[#0b1c30] hover:text-[#0f766e] px-3 py-1.5 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-9 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
            >
              <span>Open Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-16 overflow-hidden border-b border-[#e2e8f0]/60 bg-gradient-to-b from-white to-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            {/* Credibility Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#eff4ff] border border-[#dce9ff] rounded-full mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#0f766e] animate-pulse"></span>
              <span className="text-xs font-mono text-[#005c55] font-medium tracking-tight">
                AI-Assisted Reconciliation • Zero Automated Overwrites
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0b1c30] tracking-tight leading-tight mb-3">
              Many Channels. <span className="text-[#0f766e] underline decoration-[#80d5cb] decoration-4 underline-offset-4">One Pakka Order.</span>
            </h1>

            {/* Supporting Headline */}
            <h2 className="text-base sm:text-lg text-[#475569] font-medium mb-4">
              Smarter multi-channel order reconciliation for modern food operations.
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#475569] max-w-2xl mx-auto mb-8 leading-relaxed">
              Bring WhatsApp, Zomato, Swiggy, and POS order records into one verifiable workflow. Detect conflicting customer revisions, review AI explanations, and prevent duplicate food preparation before dispatch.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <button 
                onClick={() => navigate('/')}
                className="h-10 px-5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-[#a3faef]" />
                <span>Launch Live Console</span>
              </button>
              <a 
                href="#interactive-demo"
                className="h-10 px-5 bg-white hover:bg-[#f1f5f9] text-[#0b1c30] border border-[#e2e8f0] rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all"
              >
                <span>View Conflict Simulation</span>
                <ChevronRight className="w-4 h-4 text-[#0f766e]" />
              </a>
            </div>
          </div>

          {/* HERO VISUAL MOCKUP (STITCH COMPARATIVE PREVIEW) */}
          <div id="interactive-demo" className="max-w-5xl mx-auto bg-white border border-[#e2e8f0] rounded-2xl shadow-md p-4 md:p-6 relative">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                </div>
                <span className="font-mono text-slate-500 font-medium ml-2">ORDERTRUTH RECONCILER • DEMO SESSION #PK-9821</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#0f766e] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#dce9ff]">
                  ENGINE: ACTIVE (38ms)
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-semibold text-slate-700">LIVE FEED</span>
              </div>
            </div>

            {/* Ingestion Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left: WhatsApp Record */}
              <div className="bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] p-4 border-l-4 border-l-emerald-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-900">WhatsApp Inbound Modification</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">12:09 PM IST</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0] mb-2 text-xs text-slate-800 italic">
                  "Bhaiya please make it 3 paneer rolls instead of 2. Very urgent thanks!"
                </div>
                <div className="space-y-1 mb-2 text-xs">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-slate-900">3x Paneer Tikka Roll</span>
                    <span className="font-mono text-slate-900">₹720.00</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Special note: Extra mint chutney</span>
                    <span className="font-mono">Included</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500">CUST: +91 98765 00111</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Direct Customer Revision
                  </span>
                </div>
              </div>

              {/* Right: Zomato Record */}
              <div className="bg-[#f8f9ff] rounded-xl border border-[#e2e8f0] p-4 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-slate-900">Zomato Aggregator Payload</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">12:04 PM IST</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0] mb-2 text-xs font-mono text-slate-500">
                  PAYLOAD_JSON • REF_ID: #ZM-8841 • OUTLET: IND-01
                </div>
                <div className="space-y-1 mb-2 text-xs">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-slate-900">2x Paneer Tikka Roll</span>
                    <span className="font-mono text-slate-900">₹480.00</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>1x Masala Chaas</span>
                    <span className="font-mono">₹40.00</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500">NET AMOUNT: ₹520.00</span>
                  <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    Material Conflict Identified
                  </span>
                </div>
              </div>
            </div>

            {/* Conflict Alert Callout */}
            <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-xl p-3 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-red-700">Quantity Mismatch: 2 vs 3 Paneer Tikka Rolls (Item Delta +1)</p>
                  <p className="text-slate-600 text-[11px]">
                    WhatsApp chat received 5 minutes after Zomato order specifies customer intent to modify quantity. Kitchen prep held.
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <span className="font-mono text-xs font-bold text-[#005c55] bg-white px-2.5 py-1 rounded-md border border-[#e2e8f0]">
                  AI Signal: Customer Revision (+₹240)
                </span>
              </div>
            </div>

            {/* Canonical Master Output */}
            <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-[#dce9ff]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0f766e]" />
                  <span className="text-xs font-bold text-[#0f766e]">CANONICAL MASTER ORDER #CAN-ORD-1042</span>
                  <span className="bg-[#ccfbf1] text-[#005c55] text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">
                    Verified For Kitchen KDS
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-500">MERGE SIMILARITY:</span>
                  <span className="text-[#0f766e] font-bold">94.0%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                <div className="md:col-span-2 space-y-1">
                  <div className="flex justify-between items-center font-medium text-slate-900">
                    <span>3x Paneer Tikka Roll <span className="text-[#0f766e] text-[11px] font-mono">(Approved WhatsApp Update)</span></span>
                    <span className="font-mono font-bold">₹720.00</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>1x Masala Chaas</span>
                    <span className="font-mono font-medium">₹40.00</span>
                  </div>
                </div>
                <div className="flex md:justify-end">
                  <button 
                    onClick={() => navigate('/review')}
                    className="w-full md:w-auto px-4 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Open in Review Queue →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE PROBLEM SECTION */}
      <section id="the-problem" className="py-16 bg-white border-b border-[#e2e8f0]/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">The Omnichannel Order Chaos</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              When orders flow in through 4 different channels, kitchens lose money and customer trust every single shift.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Duplicate Kitchen Preparation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A customer places an order on Swiggy and calls on WhatsApp to confirm. Unsynchronized stations prepare both tickets, leading to immediate food waste.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Unbilled Chat Modifications</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Customers text informal instructions ("make it large", "add extra paneer"). Cashiers miss the note, resulting in wrong dispatches or revenue loss.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Aggregator Reconciliation Errors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                End-of-day settlement reports from Zomato, Swiggy, and Petpooja POS never match, requiring hours of tedious manual tallying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-[#f8f9ff] border-b border-[#e2e8f0]/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How PakkaOrder AI Works</h2>
            <p className="text-xs sm:text-sm text-slate-600">Three disciplined steps from raw channel intake to verified kitchen fulfillment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-xs relative">
              <span className="w-6 h-6 rounded-full bg-[#005c55] text-white flex items-center justify-center font-bold text-xs mb-3">1</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Ingest & Normalize</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captures webhooks from WhatsApp Cloud API, POS feeds, and CSV settlements. Preserves raw source payloads verbatim while normalizing phone numbers and dish names.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-xs relative">
              <span className="w-6 h-6 rounded-full bg-[#005c55] text-white flex items-center justify-center font-bold text-xs mb-3">2</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Match & Explain</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deterministic heuristic algorithms calculate proximity scores (0–100%). Gemini AI generates concise explanations of customer intent without rewriting source records.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-xs relative">
              <span className="w-6 h-6 rounded-full bg-[#005c55] text-white flex items-center justify-center font-bold text-xs mb-3">3</span>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Verify & Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Staff confirms resolution with mandatory reason logging. The engine updates the single canonical master order, writes an HMAC audit trail, and sends the verified ticket to the kitchen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">PakkaOrder AI</span>
            <span>— Many Channels. One Pakka Order.</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="hover:text-slate-900 underline">Operations Console</button>
            <button onClick={() => navigate('/kds')} className="hover:text-slate-900 underline">Kitchen Display</button>
            <button onClick={() => navigate('/login')} className="hover:text-slate-900 underline">Sign In</button>
          </div>
          <p className="text-slate-400">© 2026 PakkaOrder AI. Engineered with OrderTruth AI.</p>
        </div>
      </footer>
    </div>
  );
};
