import React, { useState } from 'react';
import { Requirement, formatIndianCurrency, numberToIndianWords, TaxExemptionReceipt } from '@caretrace/shared';
import {
  X,
  ShieldCheck,
  Building2,
  Receipt,
  FileCheck2,
  Sparkles,
  ArrowRight,
  HeartHandshake
} from 'lucide-react';
import { createMonetaryDonation } from '../api/client';

interface PledgeMonetaryModalProps {
  donorId: string;
  requirement: Requirement;
  onClose: () => void;
  onSuccess: (receipt: TaxExemptionReceipt) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export const PledgeMonetaryModal: React.FC<PledgeMonetaryModalProps> = ({
  donorId,
  requirement,
  onClose,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number>(2500);
  const [donorNote, setDonorNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const words = numberToIndianWords(amount || 0);
  const formatted = formatIndianCurrency(amount || 0);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid contribution amount (minimum ₹1).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createMonetaryDonation({
        donorId,
        requirementId: requirement.id,
        amountInr: amount,
        paymentNote: donorNote.trim() || `Direct monetary contribution of ${formatted} towards "${requirement.title}"`
      });

      if (result.success && result.receipt) {
        onSuccess(result.receipt);
      } else {
        setError('Contribution record failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm monetary contribution.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-card rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-elevated border border-surface-border relative overflow-hidden max-h-[92vh] overflow-y-auto animate-slide-up card-premium">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-surface-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-glow-teal shrink-0">
              <span className="font-display text-2xl font-bold">₹</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-display font-bold text-slate-900">Pledge Monetary Contribution</h3>
                <span className="text-[10px] font-sans font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-sm">
                  Section 80G
                </span>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-1">
                Direct financial allocation with on-chain cryptographic ledger proof
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-surface-subtle transition-colors disabled:opacity-30 press-effect"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="mt-6 space-y-5">
          {/* Beneficiary Sanctuary & Requirement Context */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border shadow-inner space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">
                Beneficiary Sanctuary
              </span>
              <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Accredited NGO</span>
              </span>
            </div>
            <p className="text-sm font-sans font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{requirement.institutionName}</span>
            </p>
            <p className="text-xs font-sans text-slate-600">
              Allocated For: <span className="font-bold text-slate-800">"{requirement.title}"</span>
            </p>
          </div>

          {/* Amount Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-sans font-bold text-slate-800">
                Contribution Amount (INR)
              </label>
              <span className="text-sm font-mono font-bold text-teal-800">
                {formatted}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-5 gap-2.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-3 px-1 text-xs font-sans font-bold rounded-xl border transition-all text-center flex items-center justify-center press-effect shadow-sm ${
                    amount === val
                      ? 'bg-teal-800 text-white border-teal-800 shadow-glow-teal'
                      : 'bg-surface-card text-slate-700 border-surface-border hover:border-slate-300 hover:bg-surface-subtle hover-lift'
                  }`}
                >
                  {formatIndianCurrency(val)}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-display font-bold text-lg">₹</span>
              <input
                type="number"
                min="1"
                step="50"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter contribution amount in INR"
                required
                className="w-full pl-10 pr-4 py-3 text-sm border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent font-mono font-bold text-slate-900 transition-all placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 bg-surface-canvas shadow-inner"
              />
            </div>

            {/* Indian Numbering in Words */}
            <div className="px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between shadow-sm">
              <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider shrink-0">In Words</span>
              <p className="text-xs font-sans text-slate-700 font-medium italic truncate max-w-sm ml-2">
                "{words}"
              </p>
            </div>
          </div>

          {/* Optional Donor Note */}
          <div className="space-y-2">
            <label className="text-xs font-sans font-bold text-slate-700">
              Donor Note / Purpose (Optional)
            </label>
            <input
              type="text"
              value={donorNote}
              onChange={(e) => setDonorNote(e.target.value)}
              placeholder="e.g., In honor of annual education drive"
              className="w-full px-4 py-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-slate-800 bg-surface-canvas transition-all shadow-sm"
            />
          </div>

          {/* Section 80G Tax Exemption & Ledger Notice */}
          <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/80 space-y-2 text-xs text-teal-950 shadow-sm">
            <div className="flex items-center space-x-2 font-sans font-bold text-teal-900">
              <FileCheck2 className="w-4.5 h-4.5 text-teal-700" />
              <span>Cryptographic Receipt & Section 80G Exemption</span>
            </div>
            <p className="text-[11px] font-sans text-teal-800 leading-relaxed">
              Confirming this contribution will immediately record block checkpoint <code className="font-mono bg-teal-100/80 px-1.5 py-0.5 rounded text-teal-900 font-bold border border-teal-200/50">MONETARY_DONATION_CONFIRMED</code> on the SHA-256 chain and issue your verifiable Form 10BE receipt.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-sans font-bold text-rose-700 animate-fade-in shadow-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-3 text-xs font-sans font-bold text-slate-600 hover:text-slate-800 hover:bg-surface-subtle rounded-xl transition-colors flex items-center justify-center press-effect"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !amount || amount <= 0}
                className="flex items-center justify-center space-x-2 px-6 py-3 gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal hover-lift transition-all disabled:opacity-50 press-effect"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recording on Ledger...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Confirm Contribution ({formatted})</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-[10px] font-sans font-medium text-slate-500 italic mt-1">
              This is a demonstrative pledge flow. Payment gateway integration (Razorpay/Stripe) planned for future production phase.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
