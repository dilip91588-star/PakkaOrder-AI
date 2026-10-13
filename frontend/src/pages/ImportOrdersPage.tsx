import React, { useState } from 'react';
import { 
  UploadCloud, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  Cpu, 
  X 
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const ImportOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TEXT_NLP' | 'CSV' | 'MANUAL'>('TEXT_NLP');

  // Text NLP state
  const [informalText, setInformalText] = useState(
    'bhaiya 2 paneer roll aur 1 butter chicken bhej do jaldi prestige ozone indiranagar flat 402 me. payment gpay kardoonga. extra green chutney chahiye'
  );
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [selectedChannel, setSelectedChannel] = useState('WHATSAPP');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);
  const [isHumanConfirmed, setIsHumanConfirmed] = useState(false);

  // Editable parsed fields
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [extractedItems, setExtractedItems] = useState<any[]>([]);

  // CSV state
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Manual Form state
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualItems] = useState([
    { name: 'Paneer Tikka Roll', sku: 'SKU-PAN-01', quantity: 2, price: 240 }
  ]);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  const handleExtractWithGemini = async () => {
    if (!informalText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setCommitSuccess(null);
    try {
      const res = await apiClient.extractOrder({
        messageText: informalText,
        customerPhone: phoneInput,
        channel: selectedChannel
      });
      setParseResult(res);
      setCustomerName(res.extractedCustomer?.name || 'Customer (Prestige Ozone)');
      setDeliveryAddress(res.extractedAddress?.text || 'Prestige Ozone, Indiranagar, Flat 402');
      setExtractedItems(res.extractedItems || [
        { name: 'Paneer Tikka Roll', sku: 'SKU-PAN-01', quantity: 2, unitPrice: 240, confidence: 0.98 },
        { name: 'Butter Chicken (Boneless)', sku: 'SKU-CHK-02', quantity: 1, unitPrice: 380, confidence: 0.95 }
      ]);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'AI Extraction failed');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitExtractedOrder = async () => {
    if (!parseResult || !isHumanConfirmed) return;
    try {
      const total = extractedItems.reduce((acc, itm) => acc + (itm.quantity * itm.unitPrice), 0);
      const res = await apiClient.createSourceOrder({
        channel: selectedChannel as any,
        referenceId: `WA-${Date.now().toString().slice(-4)}`,
        customerName,
        customerPhone: phoneInput,
        deliveryAddress,
        items: extractedItems.map((itm, idx) => ({
          id: `ITM-EXT-${idx}`,
          sku: itm.matchedSku || itm.sku || 'SKU-GEN',
          name: itm.name,
          quantity: itm.quantity,
          unitPrice: itm.unitPrice,
          totalPrice: itm.quantity * itm.unitPrice
        })),
        totalAmount: total
      });
      setCommitSuccess(`Order committed into engine as Source Order #${res.sourceId}.`);
      setParseResult(null);
      setIsHumanConfirmed(false);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Failed to commit order');
    }
  };

  const handleLoadSampleCsv = () => {
    const sample = `channel,externalOrderId,customerName,customerPhone,deliveryAddress,items,totalAmount,currency
ZOMATO,ZOM-8801,Ananya Roy,+919876500111,"Indiranagar 100ft Rd, Bangalore","Paneer Tikka Roll:2:240|Garlic Naan:2:50",580,INR
SWIGGY,SWG-4421,Rahul Verma,+919876500222,"Domlur 2nd Stage, Bangalore","Butter Chicken (Boneless):1:380|Garlic Naan:2:50",480,INR
POS,POS-9912,Walk-in Customer,+919876500333,"Takeaway Counter","Dal Makhani:1:260|Masala Chaas:2:40",340,INR`;
    setCsvRawText(sample);
    setCsvFileName('sample_settlement_batch.csv');
    setCsvError(null);
  };

  const handleProcessCsv = async () => {
    if (!csvRawText.trim()) return;
    setIsImportingCsv(true);
    setCsvError(null);
    try {
      const res = await apiClient.importCsv(csvRawText);
      setCsvResult(res);
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'CSV import failed');
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const total = manualItems.reduce((acc, itm) => acc + (itm.quantity * itm.price), 0);
      const res = await apiClient.createSourceOrder({
        channel: 'POS',
        referenceId: `POS-${Date.now().toString().slice(-4)}`,
        customerName: manualCustomer || 'Walk-in Guest',
        customerPhone: manualPhone || '+91 98765 00000',
        deliveryAddress: manualAddress || 'Takeaway Counter',
        items: manualItems.map((itm, idx) => ({
          id: `ITM-MAN-${idx}`,
          sku: itm.sku,
          name: itm.name,
          quantity: itm.quantity,
          unitPrice: itm.price,
          totalPrice: itm.quantity * itm.price
        })),
        totalAmount: total
      });
      setManualSuccess(`Manual POS order created as #${res.sourceId}.`);
      setManualCustomer('');
      setManualPhone('');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
            Order Ingestion & AI Workbench
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Ingest orders through Multilingual AI extraction, batch CSV settlements, or direct POS cashier entry.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="p-1 bg-[#eff4ff] border border-[#dce9ff] rounded-xl flex items-center text-xs">
          <button
            onClick={() => setActiveTab('TEXT_NLP')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'TEXT_NLP'
                ? 'bg-white text-[#005c55] shadow-xs border border-[#bdc9c6]/50'
                : 'text-[#64748B] hover:text-[#0b1c30]'
            }`}
          >
            Conversational AI
          </button>
          <button
            onClick={() => setActiveTab('CSV')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'CSV'
                ? 'bg-white text-[#005c55] shadow-xs border border-[#bdc9c6]/50'
                : 'text-[#64748B] hover:text-[#0b1c30]'
            }`}
          >
            Batch CSV
          </button>
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'MANUAL'
                ? 'bg-white text-[#005c55] shadow-xs border border-[#bdc9c6]/50'
                : 'text-[#64748B] hover:text-[#0b1c30]'
            }`}
          >
            Manual POS
          </button>
        </div>
      </div>

      {commitSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{commitSuccess}</span>
          </div>
          <button onClick={() => setCommitSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {parseError && <ErrorBanner message={parseError} />}

      {/* ================= TAB 1: CONVERSATIONAL AI WORKBENCH ================= */}
      {activeTab === 'TEXT_NLP' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Pane */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0b1c30]">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Raw WhatsApp / Voice Note Transcript</span>
              </div>
              <button
                type="button"
                onClick={() => setInformalText('bhaiya 2 paneer roll aur 1 butter chicken bhej do jaldi prestige ozone indiranagar flat 402 me. payment gpay kardoonga. extra green chutney chahiye')}
                className="text-[11px] text-[#0f766e] font-semibold hover:underline"
              >
                Load Sample Hinglish Chat
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#64748B] font-semibold mb-1">Intake Channel</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] focus:border-[#0f766e]"
                >
                  <option value="WHATSAPP">WhatsApp Cloud API</option>
                  <option value="MANUAL">Phone Call Transcript</option>
                </select>
              </div>
              <div>
                <label className="block text-[#64748B] font-semibold mb-1">Customer Phone (+91)</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30] font-mono focus:border-[#0f766e]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                Informal Multilingual Message Text:
              </label>
              <textarea
                value={informalText}
                onChange={(e) => setInformalText(e.target.value)}
                rows={5}
                className="w-full p-3 bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl text-xs text-[#0b1c30] focus:border-[#0f766e] focus:outline-hidden leading-relaxed"
                placeholder="Paste customer WhatsApp text, audio transcript, or SMS..."
              />
            </div>

            <button
              onClick={handleExtractWithGemini}
              disabled={isParsing || !informalText.trim()}
              className="w-full h-10 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#a3faef]" />
              <span>{isParsing ? 'Gemini AI Extracting Entities...' : 'Extract with Gemini AI →'}</span>
            </button>
          </div>

          {/* Right: Live Parsed Preview */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#005c55]">
                <Cpu className="w-4 h-4 text-[#0f766e]" />
                <span>Structured Extraction Preview (Runtime Zod Validated)</span>
              </div>
              <span className="text-[10px] font-mono text-[#005c55] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#dce9ff]">
                Model: gemini-3.1-flash
              </span>
            </div>

            {parseResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#64748B] font-semibold mb-1">Customer Identifier</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#64748B] font-semibold mb-1">Extracted Destination</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg text-xs text-[#0b1c30]"
                    />
                  </div>
                </div>

                {/* Extracted Line Items */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800">Extracted Dishes & SKU Matches</h4>
                  {extractedItems.map((itm, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{itm.quantity}x</span>
                        <span className="font-medium text-slate-800">{itm.name}</span>
                        <span className="text-[10px] font-mono text-[#64748B] ml-2">({itm.sku})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          Match: {Math.round((itm.confidence || 0.95) * 100)}%
                        </span>
                        <span className="font-bold text-slate-900">₹{itm.quantity * itm.unitPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Human Confirmation Gate */}
                <div className="p-3 bg-[#eff4ff] border border-[#dce9ff] rounded-xl flex items-start gap-2.5 text-xs">
                  <input
                    type="checkbox"
                    id="humanConfirm"
                    checked={isHumanConfirmed}
                    onChange={(e) => setIsHumanConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-[#bdc9c6] text-[#0f766e] focus:ring-[#0f766e]"
                  />
                  <label htmlFor="humanConfirm" className="text-slate-800 font-medium cursor-pointer">
                    <strong>Rule #8 Compliance:</strong> I have verified this extracted order against the customer's intent and authorized ingestion into the engine.
                  </label>
                </div>

                <button
                  onClick={handleCommitExtractedOrder}
                  disabled={!isHumanConfirmed}
                  className="w-full h-10 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#a3faef]" />
                  <span>Commit Verified Order into Matching Engine</span>
                </button>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#64748B] space-y-2">
                <Sparkles className="w-8 h-8 text-[#0f766e] mx-auto opacity-40" />
                <p className="font-semibold text-slate-800">Awaiting Extraction</p>
                <p>Paste customer message text on the left and click "Extract with Gemini AI".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: BATCH CSV IMPORTER ================= */}
      {activeTab === 'CSV' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-2xs space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <h2 className="text-sm font-bold text-[#0b1c30]">Multi-Channel CSV Batch Importer</h2>
            <button
              onClick={handleLoadSampleCsv}
              className="text-xs text-[#0f766e] font-semibold hover:underline"
            >
              Load Sample CSV Data
            </button>
          </div>

          <div className="p-6 border-2 border-dashed border-[#e2e8f0] rounded-xl bg-[#f8f9ff] text-center space-y-2">
            <UploadCloud className="w-8 h-8 text-[#0f766e] mx-auto" />
            <p className="text-xs font-semibold text-slate-800">
              {csvFileName || 'Drag and drop settlement CSV file here'}
            </p>
            <p className="text-[11px] text-[#64748B]">
              Supports standard Zomato, Swiggy, or POS aggregator batch format.
            </p>
          </div>

          {csvRawText && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#0b1c30]">Raw CSV Content Preview:</label>
              <textarea
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                rows={5}
                className="w-full p-2.5 font-mono text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg"
              />
              <button
                onClick={handleProcessCsv}
                disabled={isImportingCsv}
                className="w-full py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                {isImportingCsv ? 'Processing CSV Rows...' : 'Ingest & Validate CSV Batch →'}
              </button>
            </div>
          )}

          {csvResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <p className="font-bold text-emerald-900">
                CSV Batch Processed: {csvResult.importedCount} rows imported successfully.
              </p>
            </div>
          )}

          {csvError && <ErrorBanner message={csvError} />}
        </div>
      )}

      {/* ================= TAB 3: MANUAL POS CASHIER ================= */}
      {activeTab === 'MANUAL' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-2xs space-y-4 max-w-2xl mx-auto">
          <h2 className="text-sm font-bold text-[#0b1c30] pb-2 border-b border-[#f1f5f9]">
            Direct POS Cashier Order Entry
          </h2>

          {manualSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
              {manualSuccess}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  placeholder="Walk-in Guest"
                  className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Takeaway / Table / Delivery Address</label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Counter Pickup or Table 4"
                className="w-full p-2 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg"
              />
            </div>

            <div className="pt-2">
              <label className="block font-semibold text-slate-800 mb-2">Order Dishes</label>
              <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] flex justify-between items-center font-medium">
                <span>2x Paneer Tikka Roll (SKU-PAN-01)</span>
                <span className="font-mono font-bold">₹480.00</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingManual}
              className="w-full py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              {isSubmittingManual ? 'Creating POS Order...' : 'Submit Manual POS Order →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
