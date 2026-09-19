import React, { useState } from 'react';
import { Requirement, formatIndianCurrency, numberToIndianWords, TaxExemptionReceipt } from '@caretrace/shared';
import {
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Smartphone,
  Wallet,
  Building2
} from 'lucide-react';
import { createMonetaryDonation } from '../api/client';

interface SimulatedUpiModalProps {
  donorId: string;
  requirement: Requirement;
  onClose: () => void;
  onSuccess: (receipt: TaxExemptionReceipt) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 100000];
const FICTIONAL_VPA = 'caretrace.demo@sandboxbank';

export const SimulatedUpiModal: React.FC<SimulatedUpiModalProps> = ({
  donorId,
  requirement,
  onClose,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number>(2500);
  const [selectedApp, setSelectedApp] = useState<string>('BHIM');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const words = numberToIndianWords(amount || 0);
  const formatted = formatIndianCurrency(amount || 0);

  const handleConfirm = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await createMonetaryDonation({
        donorId,
        requirementId: requirement.id,
        amountInr: amount,
        paymentNote: `Simulated UPI payment of ${formatted} via ${selectedApp} (${FICTIONAL_VPA})`
      });

      if (result.success && result.receipt) {
        onSuccess(result.receipt);
      } else {
        setError('Payment simulation encountered an error. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <span className="font-semibold text-lg">₹</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Direct Donation Checkout</h3>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                  Demo Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant settlement with on-chain cryptographic proof
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institution / Requirement Context */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Beneficiary Sanctuary</span>
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{requirement.institutionName}</span>
            </h4>
            <p className="text-[11px] text-slate-500 truncate max-w-xs">
              For: <span className="text-slate-700 font-medium">"{requirement.title}"</span>
            </p>
          </div>
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center space-x-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>80G Eligible</span>
          </span>
        </div>

        {/* Amount Selection */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700">
              Select Donation Amount (INR)
            </label>
            <span className="text-xs font-mono font-bold text-teal-800">
              {formatted}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                  amount === val
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                {formatIndianCurrency(val)}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
            <input
              type="number"
              min="1"
              step="100"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Or enter custom amount in INR"
              className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono font-medium text-slate-900 transition-all placeholder:font-sans placeholder:text-slate-400"
            />
          </div>

          {/* Indian Numbering Words Display */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">In Words</span>
            <p className="text-xs text-slate-700 font-medium italic truncate max-w-sm ml-2">
              "{words}"
            </p>
          </div>
        </div>

        {/* UPI Payment Card & QR Presentation */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-5 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
            {/* QR Code Presentation */}
            <div className="bg-white p-3 rounded-2xl shadow-xl shrink-0 flex flex-col items-center border border-white/20">
              <div className="relative">
                <svg
                  viewBox="0 0 100 100"
                  className="w-24 h-24 text-slate-950"
                  fill="currentColor"
                >
                  {/* Outer corner markers */}
                  <rect x="6" y="6" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="5.5" />
                  <rect x="13.5" y="13.5" width="13" height="13" rx="2" />
                  <rect x="66" y="6" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="5.5" />
                  <rect x="73.5" y="13.5" width="13" height="13" rx="2" />
                  <rect x="6" y="66" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="5.5" />
                  <rect x="13.5" y="73.5" width="13" height="13" rx="2" />
                  {/* Data matrices */}
                  <rect x="42" y="8" width="7" height="7" rx="1" />
                  <rect x="51" y="18" width="7" height="7" rx="1" />
                  <rect x="42" y="27" width="7" height="7" rx="1" />
                  <rect x="10" y="44" width="7" height="7" rx="1" />
                  <rect x="24" y="44" width="12" height="7" rx="1" />
                  <rect x="44" y="44" width="12" height="12" rx="2" fill="#059669" />
                  <rect x="64" y="44" width="14" height="7" rx="1" />
                  <rect x="83" y="44" width="7" height="12" rx="1" />
                  <rect x="42" y="66" width="7" height="14" rx="1" />
                  <rect x="57" y="73" width="14" height="7" rx="1" />
                  <rect x="78" y="68" width="14" height="14" rx="2" />
                </svg>
              </div>
              <div className="flex items-center space-x-1 mt-1.5 pt-1.5 border-t border-slate-100">
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-800">
                  UPI • BHIM
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  Beneficiary VPA
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                  Sandbox
                </span>
              </div>

              <div className="font-mono text-xs sm:text-sm font-semibold text-emerald-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 select-all break-all">
                {FICTIONAL_VPA}
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Scan with any mock UPI app or confirm directly below to seal settlement on the CareTrace ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Mock UPI App Options */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-700">Simulate Payment Routing</span>
            <span className="text-[10px] text-slate-400 font-medium">Sandbox Gateway</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['BHIM UPI', 'Google Pay', 'PhonePe', 'Paytm'].map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => setSelectedApp(app)}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                  selectedApp === app
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {app}
              </button>
            ))}
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>SHA-256 Ledger Sealed</span>
          </span>

          <div className="flex space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !amount || amount <= 0}
              className="px-5 py-2.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm disabled:opacity-50 flex items-center space-x-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sealing Ledger Block...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Donation of {formatted}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subtle low-emphasis footer line for safety */}
        <p className="mt-3 text-[10px] text-slate-400 text-center leading-relaxed">
          Demo sandbox environment • No real funds debited • Generates sample 80G tax receipt on confirmation
        </p>
      </div>
    </div>
  );
};

