import React, { useState, useEffect } from 'react';
import { User, Donation, LedgerBlock, formatRelativeTime } from '@caretrace/shared';
import {
  Truck,
  QrCode,
  MapPin,
  CheckCircle2,
  Navigation,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  Building,
  ShieldCheck,
  Zap,
  Play,
  Package
} from 'lucide-react';
import { fetchDonations, scanPickup, scanDelivery, stepTransitSimulation } from '../api/client';
import { TactileQRScanner } from '../components/TactileQRScanner';
import { LiveTransitMap } from '../components/LiveTransitMap';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

interface AgentPortalProps {
  user: User;
  refreshKey?: number;
}

export const AgentPortal: React.FC<AgentPortalProps> = ({ user, refreshKey }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const all = await fetchDonations();
      // Agent handles active logistics
      setDonations(all);
      // Select in-transit or scheduled donation
      const pending = all.find(d => d.id === 'CT-2026-9042') || all.find(d => d.status !== 'CONFIRMED') || all[0];
      if (pending && !activeDonation) setActiveDonation(pending);
      else if (activeDonation) {
        const refreshed = all.find(d => d.id === activeDonation.id);
        if (refreshed) setActiveDonation(refreshed);
      }
    } catch (e) {
      console.error('Failed to load agent consignments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [user.id, refreshKey]);

  const handleOpenScanner = (mode: 'PICKUP' | 'DELIVERY') => {
    setScanMode(mode);
    setIsScannerOpen(true);
  };

  const handleScanSuccess = async (scannedPayload: string) => {
    setIsProcessing(true);
    try {
      let donationId = scannedPayload;
      try {
        const parsed = JSON.parse(scannedPayload);
        if (parsed.donationId) donationId = parsed.donationId;
      } catch (e) {}

      if (scanMode === 'PICKUP') {
        const res = await scanPickup(donationId, user.id, 'Physical consignment verified against manifest.');
        if (res.success) {
          setStatusMessage(`Pickup authenticated for ${donationId}! Sealed to ledger block #${res.ledgerBlock.index}.`);
        }
      } else {
        const targetDonation = donations.find(d => d.id === donationId);
        const INSTITUTION_DIRECTORS: Record<string, string> = {
          'inst-karunai': 'Akash Kumar (Director)',
          'inst-anbu': 'Sister V. Shanthi (Director)',
          'inst-nanban': 'K. Venkatesh (Director)'
        };
        const resolvedRecipient =
          (targetDonation?.institutionId && INSTITUTION_DIRECTORS[targetDonation.institutionId]) ||
          (targetDonation?.institutionName ? `${targetDonation.institutionName} (Director)` : 'Authorized Institution Director');

        const res = await scanDelivery({
          qrPayload: donationId,
          recipientName: resolvedRecipient,
          signature: `DIGITAL_SIG:${user.name.toUpperCase().replace(/\s+/g, '_')}_FIELD_COURIER`,
          notes: `Handover verified and completed at ${targetDonation?.institutionName || 'institution dock'}.`,
          actorId: user.id
        });
        if (res.success) {
          setStatusMessage(`Delivery confirmed for ${donationId}! Sealed to ledger block #${res.ledgerBlock.index}.`);
        }
      }
      await loadDonations();
    } catch (e) {
      console.error('Scan processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingPickups = donations.filter(d => d.status === 'PICKUP_SCHEDULED');
  const inTransitConsignments = donations.filter(d => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP');
  const completedConsignments = donations.filter(d => d.status === 'CONFIRMED');

  if (isLoading && donations.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
        <DashboardSkeleton type="AGENT" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Field Agent Header */}
      <div className="gradient-hero rounded-[2.5rem] p-8 sm:p-12 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-amber-600/30 blur-[100px] rounded-full rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-sans font-bold tracking-wide text-amber-200 mb-5 shadow-sm">
            <Truck className="w-4 h-4 text-amber-300" />
            <span>Field Logistics & Custody Agent</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight mb-3">
            Logistics Portal: {user.name}
          </h1>
          <p className="text-sm font-sans font-medium text-amber-100/90">
            Zone 4 Metro Logistics • Authenticate pickups & handovers directly on-chain
          </p>
        </div>

        {/* Floating Quick Scanner Launcher (Large Touch Target) */}
        <div className="mt-10 pt-8 border-t border-amber-700/60 grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
          <button
            onClick={() => handleOpenScanner('PICKUP')}
            className="flex items-center justify-center space-x-4 p-5 bg-white text-slate-900 hover:bg-surface-subtle rounded-2xl font-sans font-bold text-sm shadow-glass hover:shadow-card-hover transition-all press-effect hover-lift"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">Scan at Donor Depot</span>
              <span className="text-base font-display font-bold text-slate-900">1-Click Pickup Scanner</span>
            </div>
          </button>

          <button
            onClick={() => handleOpenScanner('DELIVERY')}
            className="flex items-center justify-center space-x-4 p-5 gradient-primary text-white rounded-2xl font-sans font-bold text-sm shadow-glow-teal hover:shadow-card-hover transition-all press-effect hover-lift"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-sans font-bold text-teal-100 uppercase tracking-wider mb-1">Scan at Institution</span>
              <span className="text-base font-display font-bold text-white">1-Click Delivery Scanner</span>
            </div>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in card-premium">
          <div className="flex items-center space-x-3 text-sm font-sans font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-emerald-700 font-bold hover:underline px-3 py-1.5 bg-white rounded-lg border border-emerald-200 press-effect"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Consignment List (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-slate-700">
              Active Courier Manifest ({donations.length})
            </h2>
          </div>

          <div className="space-y-4">
            {donations.map((d, i) => {
              const isSelected = activeDonation?.id === d.id;
              const isInTransit = d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP';
              const isConfirmed = d.status === 'CONFIRMED';

              return (
                <div
                  key={d.id}
                  onClick={() => setActiveDonation(d)}
                  className={`card-premium p-5 rounded-2xl border transition-all duration-300 cursor-pointer animate-fade-up stagger-${(i % 6) + 1} ${
                    isSelected
                      ? 'bg-amber-50/40 border-amber-400 ring-4 ring-amber-100/50 shadow-elevated scale-[1.02]'
                      : 'bg-surface-card hover:border-amber-300 border-surface-border hover:shadow-card-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-surface-subtle border border-surface-border px-2.5 py-1 rounded shadow-sm">
                      {d.id}
                    </span>
                    <span
                      className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInTransit
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-slate-900 mt-2 leading-snug">{d.requirementTitle}</h3>

                  <div className="mt-4 space-y-2 text-xs font-sans text-slate-600 p-3 bg-surface-subtle rounded-xl border border-surface-border shadow-inner">
                    <p className="flex items-center space-x-2 truncate">
                      <MapPin className="w-4 h-4 text-teal-700 flex-shrink-0" />
                      <span className="truncate font-medium">From: {d.pickupAddress.split(',')[0]}</span>
                    </p>
                    <p className="flex items-center space-x-2 truncate">
                      <Building className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span className="truncate font-medium">To: {d.institutionName}</span>
                    </p>
                  </div>

                  {/* Field Quick Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-surface-border flex items-center justify-between">
                    <div className="flex flex-col text-[11px] font-mono text-slate-500">
                      <span className="font-bold text-slate-700">{d.items[0]?.quantity} {d.items[0]?.unit}</span>
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5">{formatRelativeTime(d.pickupTimestamp || d.createdAt)}</span>
                    </div>

                    {d.status === 'PICKUP_SCHEDULED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenScanner('PICKUP');
                        }}
                        className="px-4 py-2 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-sans font-bold shadow-md hover:shadow-lg flex items-center justify-center transition-all press-effect hover-lift"
                      >
                        Verify Pickup
                      </button>
                    )}

                    {isInTransit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenScanner('DELIVERY');
                        }}
                        className="px-4 py-2 min-h-[44px] gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal flex items-center justify-center transition-all press-effect hover-lift"
                      >
                        Deliver & Scan
                      </button>
                    )}

                    {isConfirmed && (
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail / Transit Telemetry (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 animate-fade-in">
          {activeDonation ? (
            <>
              <div className="bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-sm card-premium">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-surface-border gap-4">
                  <div>
                    <span className="text-[10px] font-sans uppercase font-bold tracking-widest text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md shadow-sm border border-amber-200 mb-2 inline-block">
                      Active Consignment #{activeDonation.id}
                    </span>
                    <h3 className="text-xl font-display font-bold text-slate-900 mt-2 leading-tight">{activeDonation.requirementTitle}</h3>
                  </div>

                  <div className="sm:text-right bg-surface-subtle p-3 rounded-xl border border-surface-border self-start sm:self-auto">
                    <span className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider block mb-1">Recipient</span>
                    <span className="text-sm font-sans font-bold text-slate-800 block">{activeDonation.institutionName}</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">Updated {formatRelativeTime(activeDonation.updatedAt || activeDonation.createdAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm font-sans">
                  <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border shadow-inner">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pickup Depot</span>
                    </span>
                    <p className="font-bold text-slate-800 leading-relaxed">{activeDonation.pickupAddress}</p>
                    <span className="text-xs font-medium text-slate-500 mt-2 block bg-white px-2 py-1 rounded border border-surface-border w-fit shadow-sm">
                      Donor: <strong className="text-slate-700">{activeDonation.donorName}</strong>
                    </span>
                  </div>

                  <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border shadow-inner">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                      <Building className="w-3.5 h-3.5" />
                      <span>Destination Facility</span>
                    </span>
                    <p className="font-bold text-slate-800 leading-relaxed">{activeDonation.destinationAddress}</p>
                    <span className="text-xs font-bold text-emerald-800 mt-2 block bg-emerald-50 px-2 py-1 rounded border border-emerald-200 w-fit shadow-sm flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Accredited Sanctuary</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Transit Map with Step Simulation */}
              <LiveTransitMap
                donation={activeDonation}
                onStatusAdvanced={loadDonations}
              />
            </>
          ) : (
            <div className="bg-surface-card rounded-[2rem] p-16 text-center border border-surface-border shadow-sm flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-surface-subtle rounded-3xl flex items-center justify-center mb-6 border border-surface-border shadow-inner">
                <Truck className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Select a Consignment</h3>
              <p className="text-sm font-sans text-slate-500 max-w-xs mx-auto">
                Tap on any manifest item to view detailed telemetry, routing information, and action scanning tools.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tactile QR Scanner Modal */}
      {isScannerOpen && (
        <TactileQRScanner
          title={scanMode === 'PICKUP' ? 'Scan Consignment QR at Pickup' : 'Scan Consignment QR at Handover'}
          subtitle={
            scanMode === 'PICKUP'
              ? 'Point camera at donor package to verify custody handover'
              : 'Point camera at package in presence of childcare institution director'
          }
          quickScanDonations={donations
            .filter(d => (scanMode === 'PICKUP' ? d.status === 'PICKUP_SCHEDULED' : d.status !== 'CONFIRMED'))
            .map(d => ({
              id: d.id,
              title: `${d.requirementTitle} (${d.items[0]?.quantity || ''} ${d.items[0]?.unit || ''})`,
              payload: d.id
            }))}
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};

