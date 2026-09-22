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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white flex items-center justify-center shadow-md shrink-0">
              <span className="font-bold text-xl">₹</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Pledge Monetary Contribution</h3>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Section 80G
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct financial allocation with on-chain cryptographic ledger proof
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="mt-5 space-y-4">
          {/* Beneficiary Sanctuary & Requirement Context */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Beneficiary Sanctuary
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Accredited NGO</span>
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span>{requirement.institutionName}</span>
            </p>
            <p className="text-xs text-slate-600">
              Allocated For: <span className="font-semibold text-slate-800">"{requirement.title}"</span>
            </p>
          </div>

          {/* Amount Selection */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">
                Contribution Amount (INR)
              </label>
              <span className="text-sm font-mono font-bold text-teal-800">
                {formatted}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2.5 px-1 min-h-[44px] text-xs font-semibold rounded-xl border transition-all text-center flex items-center justify-center ${
                    amount === val
                      ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {formatIndianCurrency(val)}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                step="50"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter contribution amount in INR"
                required
                className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono font-bold text-slate-900 transition-all placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            {/* Indian Numbering in Words */}
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">In Words</span>
              <p className="text-xs text-slate-700 font-medium italic truncate max-w-sm ml-2">
                "{words}"
              </p>
            </div>
          </div>

          {/* Optional Donor Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Donor Note / Purpose (Optional)
            </label>
            <input
              type="text"
              value={donorNote}
              onChange={(e) => setDonorNote(e.target.value)}
              placeholder="e.g., In honor of annual education drive"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-800"
            />
          </div>

          {/* Section 80G Tax Exemption & Ledger Notice */}
          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200/70 space-y-1.5 text-xs text-teal-950">
            <div className="flex items-center space-x-1.5 font-bold text-teal-900">
              <FileCheck2 className="w-4 h-4 text-teal-700" />
              <span>Cryptographic Receipt & Section 80G Exemption</span>
            </div>
            <p className="text-[11px] text-teal-800/90 leading-relaxed">
              Confirming this contribution will immediately record block checkpoint <code className="font-mono bg-teal-100 px-1 rounded text-teal-900">MONETARY_DONATION_CONFIRMED</code> on the SHA-256 chain and issue your verifiable Form 10BE receipt.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !amount || amount <= 0}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 min-h-[44px] bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        </form>
      </div>
    </div>
  );
};
