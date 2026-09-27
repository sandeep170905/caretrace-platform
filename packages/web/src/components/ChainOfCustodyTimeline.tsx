import React, { useState } from 'react';
import { Donation, LedgerBlock, formatRelativeTime, formatSmartTimestamp } from '@caretrace/shared';
import {
  Check,
  FileCheck2,
  HeartHandshake,
  QrCode,
  Truck,
  Building,
  Award,
  X,
  Hash,
  Clock,
  User,
  ShieldCheck,
  Camera,
  Lock,
  Link
} from 'lucide-react';

interface ChainOfCustodyTimelineProps {
  donation: Donation;
  blocks?: LedgerBlock[];
  onInspectCertificate?: () => void;
}

interface StepDefinition {
  id: string;
  title: string;
  subtitle: string;
  eventType?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TIMELINE_STEPS: StepDefinition[] = [
  { id: 'REQUIREMENT_VERIFIED', title: 'Requirement Verified', subtitle: 'Authenticity score audited & NGO verified', eventType: 'REQUIREMENT_AUTHENTICATED', icon: FileCheck2 },
  { id: 'MATCHED', title: 'Donation Matched', subtitle: 'Consignment created & QR generated', eventType: 'DONATION_MATCHED', icon: HeartHandshake },
  { id: 'PICKED_UP', title: 'Picked Up', subtitle: 'Agent scanned QR at origin', eventType: 'PICKUP_VERIFIED', icon: QrCode },
  { id: 'IN_TRANSIT', title: 'In Transit', subtitle: 'Corridor route tracking active', eventType: 'IN_TRANSIT_CHECKPOINT', icon: Truck },
  { id: 'DELIVERED', title: 'Delivered', subtitle: 'QR scanned at institution', eventType: 'DELIVERY_CONFIRMED', icon: Building },
  { id: 'CONFIRMED', title: 'Handover Confirmed', subtitle: 'Recipient signature & ledger proof sealed', eventType: 'DELIVERY_CONFIRMED', icon: Award },
];

const MONETARY_STEPS: StepDefinition[] = [
  { id: 'REQUIREMENT_VERIFIED', title: 'Requirement Verified', subtitle: 'Audited requirement & verified sanctuary', eventType: 'REQUIREMENT_AUTHENTICATED', icon: FileCheck2 },
  { id: 'MONETARY_CONFIRMED', title: 'Contribution Settled', subtitle: 'Cryptographic monetary record allocated', eventType: 'MONETARY_DONATION_CONFIRMED', icon: HeartHandshake },
  { id: 'RECEIPT_SEALED', title: '80G Receipt Sealed', subtitle: 'SHA-256 block anchored on immutable ledger', eventType: 'MONETARY_DONATION_CONFIRMED', icon: Award },
];

// Clean cryptographic hash truncation helper
const formatShortHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

export const ChainOfCustodyTimeline: React.FC<ChainOfCustodyTimelineProps> = ({
  donation,
  blocks = [],
  onInspectCertificate
}) => {
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const isMonetary = donation.type === 'FUNDS' || Boolean(donation.monetaryAmountInr);
  const steps = isMonetary ? MONETARY_STEPS : TIMELINE_STEPS;

  const getStepStatus = (stepIndex: number): 'COMPLETED' | 'ACTIVE' | 'PENDING' => {
    if (isMonetary) return 'COMPLETED';
    let currentActiveIdx = 1;
    if (donation.status === 'MATCHED') currentActiveIdx = 1;
    else if (donation.status === 'PICKUP_SCHEDULED') currentActiveIdx = 2;
    else if (donation.status === 'PICKED_UP') currentActiveIdx = 3;
    else if (donation.status === 'IN_TRANSIT') currentActiveIdx = 3;
    else if (donation.status === 'DELIVERED') currentActiveIdx = 4;
    else if (donation.status === 'CONFIRMED') currentActiveIdx = 6;
    if (donation.status === 'CONFIRMED') return 'COMPLETED';
    if (stepIndex < currentActiveIdx) return 'COMPLETED';
    if (stepIndex === currentActiveIdx) return 'ACTIVE';
    return 'PENDING';
  };

  const getBlockForStep = (stepIndex: number): LedgerBlock | undefined => {
    if (isMonetary) {
      if (stepIndex === 0) return blocks[0];
      return blocks.find(b => b.eventType === 'MONETARY_DONATION_CONFIRMED') || blocks[blocks.length - 1];
    }
    if (stepIndex === 0) return blocks[0];
    if (stepIndex === 1) return blocks.find(b => b.eventType === 'DONATION_MATCHED') || blocks[0];
    if (stepIndex === 2) return blocks.find(b => b.eventType === 'PICKUP_VERIFIED');
    if (stepIndex === 3) return blocks.find(b => b.eventType === 'IN_TRANSIT_CHECKPOINT');
    if (stepIndex >= 4) return blocks.find(b => b.eventType === 'DELIVERY_CONFIRMED');
    return undefined;
  };

  const getStepActor = (stepIndex: number): string | null => {
    const block = getBlockForStep(stepIndex);
    if (block) return block.actorName;
    if (isMonetary) {
      if (stepIndex === 0) return 'Compliance Engine';
      return donation.donorName;
    }
    if (stepIndex === 0) return 'Compliance Engine';
    if (stepIndex === 1) return donation.donorName;
    if (stepIndex === 2) return donation.pickupAgentName || 'Sakthivel S';
    if (stepIndex === 3) return 'Transit Telemetry';
    if (stepIndex >= 4) return donation.institutionName;
    return null;
  };

  const getStepTimestamp = (stepIndex: number): string | null => {
    const block = getBlockForStep(stepIndex);
    if (block) return formatRelativeTime(block.timestamp, { includeTime: true });
    if (stepIndex === 1) return formatRelativeTime(donation.createdAt, { includeTime: true });
    if (stepIndex === 2 && donation.pickupTimestamp) return formatRelativeTime(donation.pickupTimestamp, { includeTime: true });
    if (stepIndex >= 4 && donation.deliveryTimestamp) return formatRelativeTime(donation.deliveryTimestamp, { includeTime: true });
    return null;
  };

  return (
    <div className="bg-white border border-surface-border rounded-2xl overflow-hidden animate-fade-up">
      {/* Header */}
      <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link className="w-3.5 h-3.5 text-teal-600" />
            <h3 className="text-sm font-sans font-bold text-slate-900">Chain-of-Custody Timeline</h3>
            <code className="text-[10px] font-mono text-slate-400 bg-surface-subtle px-1.5 py-0.5 rounded-sm border border-surface-border">
              {donation.id}
            </code>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            SHA-256 ledger · {blocks.length} sealed blocks · Click any completed step to inspect raw block
          </p>
        </div>
        {donation.status === 'CONFIRMED' && onInspectCertificate && (
          <button
            onClick={onInspectCertificate}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-sm text-xs font-sans font-bold transition-colors press-effect"
          >
            <Award className="w-3.5 h-3.5 text-teal-600" />
            Certificate
          </button>
        )}
      </div>

      {/* ── EVIDENCE RAIL ── The signature visual moment ── */}
      <div className="px-6 py-6">
        <div className="relative">
          {/* Vertical connector rail SVG */}
          <div className="absolute left-[19px] top-5 bottom-5 w-[1px] bg-surface-border" />

          <div className="space-y-0">
            {steps.map((step, idx) => {
              const status = getStepStatus(idx);
              const block = getBlockForStep(idx);
              const actor = getStepActor(idx);
              const timestamp = getStepTimestamp(idx);
              const isClickable = status === 'COMPLETED' && block;
              const isLast = idx === steps.length - 1;

              return (
                <div key={step.id} className="relative flex gap-5">
                  {/* Step indicator column */}
                  <div className="flex flex-col items-center" style={{ minWidth: '40px' }}>
                    {/* Node circle */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-sm flex items-center justify-center border-2 transition-all shrink-0 ${
                        status === 'COMPLETED'
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : status === 'ACTIVE'
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-white border-surface-border text-slate-300'
                      }`}
                    >
                      {status === 'COMPLETED' ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : status === 'ACTIVE' ? (
                        <div className="w-3 h-3 rounded-sm bg-white animate-pulse" />
                      ) : (
                        <step.icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    {/* Connector segment */}
                    {!isLast && (
                      <div className={`w-px flex-1 min-h-[20px] ${status === 'COMPLETED' ? 'bg-slate-900' : 'bg-surface-border'}`}
                        style={{ marginTop: '-1px', marginBottom: '-1px' }}
                      />
                    )}
                  </div>

                  {/* Content card */}
                  <div
                    className={`flex-1 mb-4 transition-all ${isClickable ? 'cursor-pointer group' : ''}`}
                    onClick={() => isClickable && setSelectedBlock(block!)}
                  >
                    <div className={`border rounded-sm overflow-hidden transition-all ${
                      status === 'COMPLETED'
                        ? isClickable
                          ? 'border-slate-200 hover:border-slate-400 bg-white'
                          : 'border-slate-200 bg-white'
                        : status === 'ACTIVE'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-surface-border bg-surface-canvas'
                    }`}>
                      {/* Card header row */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Step number */}
                          <span className={`text-[10px] font-mono font-bold ${
                            status === 'COMPLETED' ? 'text-slate-400' : status === 'ACTIVE' ? 'text-amber-600' : 'text-slate-300'
                          }`}>
                            {String(idx).padStart(2, '0')}
                          </span>

                          <div>
                            <p className={`text-sm font-sans font-bold leading-snug ${
                              status === 'COMPLETED' ? 'text-slate-900' : status === 'ACTIVE' ? 'text-amber-900' : 'text-slate-400'
                            }`}>
                              {step.title}
                            </p>
                            {actor && status !== 'PENDING' && (
                              <p className={`text-[11px] font-sans mt-0.5 ${status === 'COMPLETED' ? 'text-slate-500' : 'text-amber-700'}`}>
                                {actor}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Timestamp */}
                          {timestamp && (
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:block">{timestamp}</span>
                          )}

                          {/* Block index badge */}
                          {status === 'COMPLETED' && block && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm border flex items-center gap-1 ${
                              isClickable
                                ? 'text-teal-700 bg-teal-50 border-teal-200 group-hover:bg-teal-100 group-hover:border-teal-300'
                                : 'text-slate-500 bg-surface-subtle border-surface-border'
                            }`}>
                              <Lock className="w-2.5 h-2.5" />
                              #{block.index}
                            </span>
                          )}

                          {/* Active pulse indicator */}
                          {status === 'ACTIVE' && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-sm bg-amber-500 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hash info bar */}
                      {status === 'COMPLETED' && block && (
                        <div className="px-4 py-2.5 border-t border-surface-border bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Hash</span>
                            <code className="text-[11px] font-mono font-medium text-slate-600 bg-white px-2 py-0.5 rounded-sm border border-surface-border">
                              {formatShortHash(block.blockHash)}
                            </code>
                          </div>

                          {isClickable && (
                            <span className="text-[11px] font-mono font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1">
                              Inspect Block ↗
                            </span>
                          )}
                        </div>
                      )}

                      {/* Photo proof indicator */}
                      {donation.proofPhotoUrl && (step.id === 'DELIVERED' || step.id === 'CONFIRMED') && (
                        <div className="px-4 pb-2.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(donation.proofPhotoUrl!); }}
                            className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-sm transition-colors press-effect"
                          >
                            <Camera className="w-3 h-3 text-emerald-600" />
                            Photo Proof Anchored
                          </button>
                        </div>
                      )}

                      {/* Pending state */}
                      {status === 'PENDING' && (
                        <div className="px-4 pb-3">
                          <p className="text-[11px] font-mono text-slate-400">{step.subtitle}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BLOCK DETAIL MODAL ── */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-elevated border border-surface-border animate-slide-up overflow-hidden">
            {/* Modal header — dark */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-teal-800 text-teal-200 flex items-center justify-center font-mono text-xs font-bold">
                  #{selectedBlock.index}
                </div>
                <div>
                  <p className="text-sm font-sans font-bold text-white">Ledger Block</p>
                  <p className="text-[10px] font-mono text-slate-400">{selectedBlock.eventType}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors press-effect"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cryptographic SHA-256 Hash Display */}
            <div className="px-6 py-4 bg-slate-50 border-b border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-teal-600" />
                  SHA-256 Block Hash
                </p>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                  Verified Seal
                </span>
              </div>
              <code className="text-[11px] font-mono text-slate-800 break-all select-all leading-relaxed block bg-white px-3 py-2.5 rounded-sm border border-surface-border font-medium">
                {selectedBlock.blockHash}
              </code>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Previous hash */}
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Previous Block Hash</p>
                <code className="text-[11px] font-mono text-slate-600 break-all select-all block bg-surface-canvas px-3 py-2 rounded-sm border border-surface-border">
                  {selectedBlock.previousHash}
                </code>
              </div>

              {/* Actor + timestamp 2-col */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-canvas rounded-sm border border-surface-border">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User className="w-3 h-3" />Actor</p>
                  <p className="text-sm font-sans font-bold text-slate-900">{selectedBlock.actorName}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">{selectedBlock.actorRole}</p>
                </div>
                <div className="p-3 bg-surface-canvas rounded-sm border border-surface-border">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Sealed At</p>
                  <p className="text-sm font-sans font-bold text-slate-900">{formatSmartTimestamp(selectedBlock.timestamp)}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">{formatRelativeTime(selectedBlock.timestamp)}</p>
                </div>
              </div>

              {/* Details */}
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Checkpoint Summary</p>
                <p className="text-sm font-sans text-teal-900 bg-teal-50 border border-teal-200 px-3 py-2.5 rounded-sm leading-relaxed">
                  {selectedBlock.details}
                </p>
              </div>

              {/* Payload hash */}
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Payload Hash</p>
                <code className="text-[10px] font-mono text-slate-500 break-all block bg-surface-canvas px-3 py-2 rounded-sm border border-surface-border">
                  {selectedBlock.payloadHash}
                </code>
              </div>

              {/* Photo proof */}
              {(selectedBlock.payload?.hasPhotoProof || selectedBlock.payload?.photoAttached || (selectedBlock.eventType === 'DELIVERY_CONFIRMED' && donation.proofPhotoUrl)) && (
                <div className="p-3.5 bg-emerald-50 rounded-sm border border-emerald-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      Photo Proof Anchored in Block
                    </span>
                    <code className="text-[9px] font-mono text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      hasPhotoProof: true
                    </code>
                  </div>
                  {donation.proofPhotoUrl && (
                    <div className="rounded-sm overflow-hidden border border-emerald-200 bg-slate-900">
                      <img
                        src={donation.proofPhotoUrl}
                        alt="Handover proof"
                        className="w-full max-h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedPhoto(donation.proofPhotoUrl!)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Verified footer */}
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Cryptographically verified & chained in immutable storage
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-border flex justify-end">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect"
              >
                Close Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-elevated border border-surface-border animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-sans font-bold text-slate-900">Delivery Handover Photo</span>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm hover:bg-surface-subtle transition-colors press-effect">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-900">
              <img src={selectedPhoto} alt="Delivery proof" className="w-full h-auto max-h-[65vh] object-contain mx-auto" />
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <code className="text-[10px] font-mono text-slate-400 bg-surface-subtle px-2 py-1 rounded-sm border border-surface-border">{donation.id}</code>
              <button onClick={() => setSelectedPhoto(null)} className="px-4 py-2 bg-slate-900 text-white text-xs font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
