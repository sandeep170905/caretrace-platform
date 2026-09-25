import React, { useState } from 'react';
import { Donation, LedgerBlock, formatRelativeTime, formatSmartTimestamp } from '@caretrace/shared';
import {
  Check,
  CircleDot,
  FileCheck2,
  HeartHandshake,
  QrCode,
  Truck,
  Building,
  Award,
  ExternalLink,
  X,
  Hash,
  Clock,
  User,
  ShieldCheck,
  Camera
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
  {
    id: 'REQUIREMENT_VERIFIED',
    title: 'Requirement Verified',
    subtitle: 'Authenticity score audited & NGO verified',
    eventType: 'REQUIREMENT_AUTHENTICATED',
    icon: FileCheck2
  },
  {
    id: 'MATCHED',
    title: 'Donation Matched',
    subtitle: 'Consignment created & QR code generated',
    eventType: 'DONATION_MATCHED',
    icon: HeartHandshake
  },
  {
    id: 'PICKED_UP',
    title: 'Picked Up',
    subtitle: 'Agent scanned QR at origin location',
    eventType: 'PICKUP_VERIFIED',
    icon: QrCode
  },
  {
    id: 'IN_TRANSIT',
    title: 'In Transit',
    subtitle: 'Simulated corridor route tracking active',
    eventType: 'IN_TRANSIT_CHECKPOINT',
    icon: Truck
  },
  {
    id: 'DELIVERED',
    title: 'Delivered',
    subtitle: 'Handover QR scanned at childcare institution',
    eventType: 'DELIVERY_CONFIRMED',
    icon: Building
  },
  {
    id: 'CONFIRMED',
    title: 'Confirmed Handover',
    subtitle: 'Recipient signature & immutable ledger proof sealed',
    eventType: 'DELIVERY_CONFIRMED',
    icon: Award
  }
];

const MONETARY_STEPS: StepDefinition[] = [
  {
    id: 'REQUIREMENT_VERIFIED',
    title: 'Requirement Verified',
    subtitle: 'Audited requirement & verified sanctuary account',
    eventType: 'REQUIREMENT_AUTHENTICATED',
    icon: FileCheck2
  },
  {
    id: 'MONETARY_CONFIRMED',
    title: 'Direct Contribution Settled',
    subtitle: 'Cryptographic monetary contribution recorded & allocated',
    eventType: 'MONETARY_DONATION_CONFIRMED',
    icon: HeartHandshake
  },
  {
    id: 'RECEIPT_SEALED',
    title: '80G Receipt Sealed',
    subtitle: 'Cryptographic SHA-256 block anchored on immutable ledger',
    eventType: 'MONETARY_DONATION_CONFIRMED',
    icon: Award
  }
];

export const ChainOfCustodyTimeline: React.FC<ChainOfCustodyTimelineProps> = ({
  donation,
  blocks = [],
  onInspectCertificate
}) => {
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const isMonetary = donation.type === 'FUNDS' || Boolean(donation.monetaryAmountInr);
  const steps = isMonetary ? MONETARY_STEPS : TIMELINE_STEPS;

  // Compute status index
  const getStepStatus = (stepIndex: number): 'COMPLETED' | 'ACTIVE' | 'PENDING' => {
    if (isMonetary) {
      return 'COMPLETED'; // Monetary donations are settled & sealed on confirmation
    }

    let currentActiveIdx = 1; // Default matched
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

  // Find corresponding ledger block for a step
  const getBlockForStep = (stepIndex: number): LedgerBlock | undefined => {
    if (isMonetary) {
      if (stepIndex === 0) return blocks[0];
      return blocks.find(b => b.eventType === 'MONETARY_DONATION_CONFIRMED') || blocks[blocks.length - 1];
    }
    if (stepIndex === 0) return blocks[0]; // Genesis / req
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
    if (block) {
      return formatRelativeTime(block.timestamp, { includeTime: true });
    }
    if (stepIndex === 1) {
      return formatRelativeTime(donation.createdAt, { includeTime: true });
    }
    if (stepIndex === 2 && donation.pickupTimestamp) {
      return formatRelativeTime(donation.pickupTimestamp, { includeTime: true });
    }
    if (stepIndex >= 4 && donation.deliveryTimestamp) {
      return formatRelativeTime(donation.deliveryTimestamp, { includeTime: true });
    }
    return null;
  };

  return (
    <div className="bg-surface-card rounded-2xl p-6 border border-surface-border card-premium shadow-card animate-fade-up">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
            <span>Chain-of-Custody Timeline</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-surface-subtle text-slate-700 border border-surface-border">
              {donation.id}
            </span>
          </h3>
          <p className="text-xs font-sans text-slate-500 mt-1">
            Cryptographic SHA-256 Ledger • Click any completed step to inspect raw block
          </p>
        </div>

        {donation.status === 'CONFIRMED' && onInspectCertificate && (
          <button
            onClick={onInspectCertificate}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-sans font-semibold transition-colors hover-lift press-effect shadow-sm"
          >
            <Award className="w-4 h-4 text-teal-700" />
            <span>View Certificate</span>
          </button>
        )}
      </div>

      {/* Horizontal on Desktop, Vertical on Mobile */}
      <div className="relative">
        <div className={`hidden lg:grid ${isMonetary ? 'lg:grid-cols-3' : 'lg:grid-cols-6'} gap-2 relative`}>
          {/* Connector Line Background */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-surface-border -z-0 rounded-full" />

          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            const block = getBlockForStep(idx);
            const actor = getStepActor(idx);
            const timestamp = getStepTimestamp(idx);

            const isClickable = status === 'COMPLETED' && block;

            return (
              <div
                key={step.id}
                onClick={() => isClickable && setSelectedBlock(block!)}
                className={`flex flex-col items-center text-center relative z-10 group ${
                  isClickable ? 'cursor-pointer hover-lift' : ''
                }`}
              >
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    status === 'COMPLETED'
                      ? 'bg-teal-700 text-white shadow-glow-teal group-hover:scale-110'
                      : status === 'ACTIVE'
                      ? 'bg-amber-500 text-white animate-pulse-soft shadow-glow-amber'
                      : 'bg-surface-subtle text-slate-400 border-2 border-surface-border'
                  }`}
                >
                  {status === 'COMPLETED' ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : status === 'ACTIVE' ? (
                    <CircleDot className="w-5 h-5 animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4 opacity-50" />
                  )}
                </div>

                {/* Title & Details */}
                <div className="mt-3">
                  <p
                    className={`text-xs font-sans font-bold ${
                      status === 'COMPLETED'
                        ? 'text-teal-900'
                        : status === 'ACTIVE'
                        ? 'text-amber-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </p>

                  {timestamp && (
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{timestamp}</p>
                  )}

                  {actor && status !== 'PENDING' && (
                    <p className="text-[10px] text-slate-600 truncate max-w-[120px] mx-auto mt-0.5 font-sans font-medium">
                      by {actor}
                    </p>
                  )}

                  {status === 'COMPLETED' && block && (
                    <span className="inline-flex items-center space-x-0.5 text-[9px] font-mono font-medium text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded mt-1.5 border border-teal-200 group-hover:border-teal-400 transition-colors shadow-sm">
                      <span>#{block.index}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}

                  {donation.proofPhotoUrl && (step.id === 'DELIVERED' || step.id === 'CONFIRMED') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(donation.proofPhotoUrl!);
                      }}
                      className="mt-2 flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 text-[9px] font-sans font-bold mx-auto transition-colors press-effect"
                      title="Inspect handover photo proof"
                    >
                      <Camera className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Photo Proof</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Vertical View for Mobile / Tablet */}
        <div className="lg:hidden space-y-6 relative pl-4">
          <div className="absolute top-4 bottom-4 left-8 w-0.5 bg-surface-border -z-0" />

          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            const block = getBlockForStep(idx);
            const actor = getStepActor(idx);
            const timestamp = getStepTimestamp(idx);
            const isClickable = status === 'COMPLETED' && block;

            return (
              <div
                key={step.id}
                onClick={() => isClickable && setSelectedBlock(block!)}
                className={`flex items-start space-x-4 relative z-10 ${isClickable ? 'cursor-pointer hover-lift group' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                    status === 'COMPLETED'
                      ? 'bg-teal-700 text-white shadow-glow-teal group-hover:scale-110'
                      : status === 'ACTIVE'
                      ? 'bg-amber-500 text-white animate-pulse-soft shadow-glow-amber'
                      : 'bg-surface-subtle text-slate-400 border-2 border-surface-border'
                  }`}
                >
                  {status === 'COMPLETED' ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : status === 'ACTIVE' ? (
                    <CircleDot className="w-4 h-4 animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4 opacity-50" />
                  )}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-sans font-bold ${
                        status === 'COMPLETED'
                          ? 'text-teal-900'
                          : status === 'ACTIVE'
                          ? 'text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    {timestamp && (
                      <span className="text-[11px] font-mono text-slate-500">{timestamp}</span>
                    )}
                  </div>

                  <p className="text-xs font-sans text-slate-500 mt-0.5">{step.subtitle}</p>

                  {actor && status !== 'PENDING' && (
                    <p className="text-xs font-sans font-medium text-slate-600 mt-0.5">Actor: {actor}</p>
                  )}

                  {status === 'COMPLETED' && block && (
                    <div className="mt-2 inline-flex items-center space-x-1 text-xs font-mono font-medium text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 group-hover:border-teal-300 transition-colors shadow-sm">
                      <span>Ledger Block #{block.index}</span>
                      <span className="text-slate-400 font-normal">({block.blockHash.slice(0, 10)}...)</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </div>
                  )}

                  {donation.proofPhotoUrl && (step.id === 'DELIVERED' || step.id === 'CONFIRMED') && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(donation.proofPhotoUrl!);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-sans font-bold transition-colors press-effect shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Handover Photo Evidence</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger Block Detail Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-elevated border border-surface-border animate-slide-up card-premium">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold font-mono text-sm shadow-inner">
                  #{selectedBlock.index}
                </div>
                <div>
                  <h4 className="text-lg font-display font-bold text-slate-900">Ledger Block Details</h4>
                  <p className="text-xs font-sans text-slate-500 font-medium">{selectedBlock.eventType}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-surface-subtle transition-colors press-effect"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs font-sans">
              <div>
                <span className="text-slate-500 font-bold flex items-center space-x-1.5 mb-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  <span>SHA-256 Block Hash</span>
                </span>
                <p className="font-mono text-[11px] bg-surface-canvas p-2.5 rounded-xl border border-surface-border text-slate-800 break-all select-all shadow-inner">
                  {selectedBlock.blockHash}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold mb-1.5 block">Previous Block Hash</span>
                <p className="font-mono text-[11px] bg-surface-canvas p-2.5 rounded-xl border border-surface-border text-slate-700 break-all select-all shadow-inner">
                  {selectedBlock.previousHash}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-canvas rounded-xl border border-surface-border shadow-sm">
                  <span className="text-slate-500 font-bold flex items-center space-x-1.5 mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Actor</span>
                  </span>
                  <p className="font-bold text-slate-800 text-sm">{selectedBlock.actorName}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{selectedBlock.actorRole}</p>
                </div>

                <div className="p-3 bg-surface-canvas rounded-xl border border-surface-border shadow-sm">
                  <span className="text-slate-500 font-bold flex items-center space-x-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timestamp</span>
                  </span>
                  <p className="font-bold text-slate-800 text-sm">
                    {formatSmartTimestamp(selectedBlock.timestamp)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {formatRelativeTime(selectedBlock.timestamp)}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold mb-1.5 block">Checkpoint Summary</span>
                <p className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 text-teal-900 font-bold shadow-sm">
                  {selectedBlock.details}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold mb-1.5 block">Payload Hash</span>
                <p className="font-mono text-[11px] bg-surface-canvas p-2 rounded-lg border border-surface-border text-slate-700 break-all shadow-inner">
                  {selectedBlock.payloadHash}
                </p>
              </div>

              {(selectedBlock.payload?.hasPhotoProof || selectedBlock.payload?.photoAttached || (selectedBlock.eventType === 'DELIVERY_CONFIRMED' && donation.proofPhotoUrl)) && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-bold flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Delivery Photo Proof Anchored</span>
                    </span>
                    <span className="text-[10px] pill-emerald font-mono font-bold px-2 py-0.5 rounded-full">
                      hasPhotoProof: true
                    </span>
                  </div>
                  {donation.proofPhotoUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-slate-900 shadow-inner">
                      <img
                        src={donation.proofPhotoUrl}
                        alt="Handover proof"
                        className="w-full max-h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedPhoto(donation.proofPhotoUrl!)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-3 text-xs text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cryptographically verified & chained in immutable storage</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-border flex justify-end">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-5 py-2.5 gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal hover-lift transition-all press-effect"
              >
                Close Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-surface-card rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-elevated border border-surface-border overflow-hidden animate-scale-in card-premium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center space-x-2.5">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span className="text-lg font-display font-bold text-slate-900">Delivery Handover Photo Proof</span>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-surface-subtle transition-colors press-effect"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 rounded-2xl overflow-hidden border border-surface-border bg-slate-900 flex items-center justify-center shadow-inner">
              <img
                src={selectedPhoto}
                alt="Delivery proof"
                className="w-full h-auto max-h-[65vh] object-contain mx-auto"
              />
            </div>
            <div className="mt-4 flex justify-between items-center text-[11px] text-slate-500 font-sans font-medium">
              <span className="font-mono bg-surface-subtle px-2 py-1 rounded-md border border-surface-border">{donation.id}</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2.5 gradient-primary text-white rounded-xl text-xs font-bold shadow-glow-teal hover-lift transition-all press-effect"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

