import React from 'react';
import { ProofOfDeliveryCertificate } from '@caretrace/shared';
import { Award, ShieldCheck, X, CheckCircle2, Hash, FileCheck, Printer, Camera, ExternalLink } from 'lucide-react';

interface ProofOfDeliveryModalProps {
  certificate: ProofOfDeliveryCertificate;
  onClose: () => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({ certificate, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E7E8E2] relative overflow-hidden">
        {/* Certificate Watermark Seal */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-50/60 pointer-events-none -z-0 flex items-center justify-center">
          <Award className="w-32 h-32 text-teal-600/10" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between relative z-10 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white flex items-center justify-center shadow-md">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Official Ledger Certificate
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Proof of Delivery Authentication</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Content Card */}
        <div className="mt-6 space-y-4 text-xs relative z-10">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-lg space-y-3">
            <div className="flex justify-between items-center text-[11px] opacity-80 border-b border-teal-700/60 pb-2">
              <span>CareTrace Chain-of-Custody Network</span>
              <span className="font-mono">{certificate.donationId}</span>
            </div>

            <p className="text-xs text-teal-100 leading-relaxed">
              This certifies that the physical consignment described below has completed end-to-end custody verification and was officially received in inspected condition by the accredited institution.
            </p>

            <div className="pt-2 border-t border-teal-700/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-teal-300 text-[10px] block">Donor</span>
                <span className="font-bold text-white text-sm">{certificate.donorName}</span>
              </div>
              <div>
                <span className="text-teal-300 text-[10px] block">Recipient Institution</span>
                <span className="font-bold text-white text-sm">{certificate.institutionName}</span>
              </div>
            </div>
          </div>

          {/* Consignment Items */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Delivered Items Manifest:</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">{certificate.itemSummary}</p>
          </div>

          {/* Handover & Signatures */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Handover Representative</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{certificate.recipientRepresentative}</p>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Digitally Signed</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Confirmation Timestamp</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {new Date(certificate.deliveryConfirmedAt).toLocaleDateString()}{' '}
                {new Date(certificate.deliveryConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Field Courier: {certificate.pickupAgentName}
              </span>
            </div>
          </div>

          {/* Photographic Proof of Handover (if attached) */}
          {certificate.proofPhotoUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 text-xs font-semibold flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Photographic Proof of Handover</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Anchored On-Chain</span>
                </span>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                <img
                  src={certificate.proofPhotoUrl}
                  alt="Delivery handover evidence"
                  className="w-full max-h-44 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(certificate.proofPhotoUrl, '_blank')}
                  title="Click to view full image in new tab"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-white text-[10px]">
                  <span className="truncate">Inspection & Handover Verification</span>
                  <a
                    href={certificate.proofPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-emerald-300 flex items-center space-x-0.5 flex-shrink-0"
                  >
                    <span>Enlarge</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Ledger Hashes */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
              <span className="flex items-center space-x-1">
                <Hash className="w-3 h-3 text-teal-700" />
                <span>Immutable Block Hashes ({certificate.chainLength} Checkpoint Blocks)</span>
              </span>
              <span className="text-emerald-700 font-bold">SEALED ON CHAIN</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400">Genesis Matched Hash:</span>
              <p className="font-mono text-[10px] text-slate-700 break-all bg-white p-1.5 rounded border border-slate-200">
                {certificate.genesisBlockHash}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400">Final Delivery Block Hash:</span>
              <p className="font-mono text-[10px] text-slate-700 break-all bg-white p-1.5 rounded border border-slate-200">
                {certificate.deliveryBlockHash}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-1 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Verifiable via CareTrace Public Ledger</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

