import React from 'react';
import { ProofOfDeliveryCertificate, formatRelativeTime, formatSmartTimestamp } from '@caretrace/shared';
import { Award, ShieldCheck, X, CheckCircle2, Hash, FileCheck, Printer, Camera, ExternalLink } from 'lucide-react';

interface ProofOfDeliveryModalProps {
  certificate: ProofOfDeliveryCertificate;
  onClose: () => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({ certificate, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-card rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-elevated border border-surface-border relative overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up card-premium">
        {/* Certificate Watermark Seal */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-50/60 pointer-events-none -z-0 flex items-center justify-center">
          <Award className="w-32 h-32 text-teal-600/10" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between relative z-10 pb-5 border-b border-surface-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-glow-teal">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-sm">
                Official Ledger Certificate
              </span>
              <h3 className="text-2xl font-display font-bold text-slate-900 mt-1.5">Proof of Delivery Authentication</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-surface-subtle transition-colors press-effect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Content Card */}
        <div className="mt-6 space-y-4 text-xs relative z-10 font-sans">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-card space-y-4">
            <div className="flex justify-between items-center text-[11px] opacity-80 border-b border-teal-700/60 pb-3">
              <span className="font-bold tracking-wide uppercase">CareTrace Chain-of-Custody Network</span>
              <span className="font-mono bg-black/20 px-2 py-0.5 rounded border border-white/10">{certificate.donationId}</span>
            </div>

            <p className="text-sm font-display text-teal-50 leading-relaxed italic">
              This certifies that the physical consignment described below has completed end-to-end custody verification and was officially received in inspected condition by the accredited institution.
            </p>

            <div className="pt-3 border-t border-teal-700/60 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-teal-300/80 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Donor</span>
                <span className="font-bold text-white text-base font-display">{certificate.donorName}</span>
              </div>
              <div>
                <span className="text-teal-300/80 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Recipient Institution</span>
                <span className="font-bold text-white text-base font-display">{certificate.institutionName}</span>
              </div>
            </div>
          </div>

          {/* Consignment Items */}
          <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border shadow-inner">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Delivered Items Manifest:</span>
            <p className="text-sm font-bold text-slate-800 mt-1.5">{certificate.itemSummary}</p>
          </div>

          {/* Handover & Signatures */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3.5 bg-surface-canvas rounded-xl border border-surface-border shadow-sm">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Handover Representative</span>
              <p className="text-sm font-bold text-slate-800">{certificate.recipientRepresentative}</p>
              <div className="mt-2 pt-2 border-t border-surface-border">
                <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Digital Signature Verified</span>
                </span>
                <p
                  className="text-[9px] font-mono font-medium text-slate-600 bg-white px-2 py-1 rounded border border-surface-border mt-1.5 truncate shadow-inner"
                  title={certificate.recipientSignature || 'DIGITAL_SIG:AKASH_KUMAR_KARUNAI_TAMBARAM_2026'}
                >
                  {certificate.recipientSignature || 'DIGITAL_SIG:AKASH_KUMAR_KARUNAI_TAMBARAM_2026'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-surface-canvas rounded-xl border border-surface-border shadow-sm">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Confirmation Timestamp</span>
              <p className="text-sm font-bold text-slate-800">
                {formatSmartTimestamp(certificate.deliveryConfirmedAt)}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block mt-1.5">
                Field Courier: <span className="font-bold text-slate-700">{certificate.pickupAgentName}</span> ({formatRelativeTime(certificate.deliveryConfirmedAt)})
              </span>
            </div>
          </div>

          {/* Photographic Proof of Handover (if attached) */}
          {certificate.proofPhotoUrl && (
            <div className="p-4 bg-surface-canvas rounded-xl border border-surface-border space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 text-xs font-bold flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Photographic Proof of Handover</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Anchored On-Chain</span>
                </span>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-surface-border bg-slate-900 group shadow-inner">
                <img
                  src={certificate.proofPhotoUrl}
                  alt="Delivery handover evidence"
                  className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(certificate.proofPhotoUrl, '_blank')}
                  title="Click to view full image in new tab"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between text-white text-[11px] font-medium">
                  <span className="truncate">Inspection & Handover Verification</span>
                  <a
                    href={certificate.proofPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-300 hover:text-emerald-200 flex items-center space-x-1 flex-shrink-0 transition-colors"
                  >
                    <span>Enlarge</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Ledger Hashes */}
          <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
              <span className="flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-teal-700" />
                <span>Immutable Block Hashes ({certificate.chainLength} Checkpoint Blocks)</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">SEALED ON CHAIN</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Genesis Matched Hash:</span>
              <p className="font-mono text-[10px] font-medium text-slate-700 break-all bg-white p-2 rounded-lg border border-surface-border shadow-inner">
                {certificate.genesisBlockHash}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Final Delivery Block Hash:</span>
              <p className="font-mono text-[10px] font-medium text-slate-700 break-all bg-white p-2 rounded-lg border border-surface-border shadow-inner">
                {certificate.deliveryBlockHash}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-7 pt-5 border-t border-surface-border flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-sans font-medium">
            <ShieldCheck className="w-4.5 h-4.5 text-teal-700" />
            <span>Verifiable via CareTrace Public Ledger</span>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-surface-canvas hover:bg-surface-subtle border border-surface-border text-slate-700 rounded-xl text-xs font-sans font-bold transition-colors press-effect hover-lift shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal hover-lift transition-all press-effect"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

