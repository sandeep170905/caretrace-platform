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
  Play
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
          'inst-karunai': 'Lakshmi Narayanan (Director)',
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
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
        <DashboardSkeleton type="AGENT" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Field Agent Header */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/40 border border-amber-300/40 text-xs text-amber-100 font-medium mb-3">
            <Truck className="w-3.5 h-3.5 text-amber-200" />
            <span>Field Logistics & Custody Agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Logistics Portal: {user.name}
          </h1>
          <p className="text-xs text-amber-100/90 mt-1">
            Zone 4 Metro Logistics • Authenticate pickups & handovers directly on-chain
          </p>
        </div>

        {/* Floating Quick Scanner Launcher (Large Touch Target) */}
        <div className="mt-6 pt-6 border-t border-amber-500/40 grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          <button
            onClick={() => handleOpenScanner('PICKUP')}
            className="flex items-center justify-center space-x-3 p-4 bg-white text-slate-900 hover:bg-amber-50 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-normal text-slate-500">Scan at Donor Depot</span>
              <span className="text-sm font-bold">1-Click Pickup Scanner</span>
            </div>
          </button>

          <button
            onClick={() => handleOpenScanner('DELIVERY')}
            className="flex items-center justify-center space-x-3 p-4 bg-teal-800 text-white hover:bg-teal-900 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 border border-teal-600"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-teal-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-normal text-teal-200">Scan at Institution</span>
              <span className="text-sm font-bold">1-Click Delivery Scanner</span>
            </div>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consignment List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Active Courier Manifest ({donations.length})
            </h2>
          </div>

          <div className="space-y-3">
            {donations.map((d) => {
              const isSelected = activeDonation?.id === d.id;
              const isInTransit = d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP';
              const isConfirmed = d.status === 'CONFIRMED';

              return (
                <div
                  key={d.id}
                  onClick={() => setActiveDonation(d)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-amber-500 ring-2 ring-amber-100 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {d.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInTransit
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">{d.requirementTitle}</h3>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p className="flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                      <span className="truncate">From: {d.pickupAddress.split(',')[0]}</span>
                    </p>
                    <p className="flex items-center space-x-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      <span className="truncate">To: {d.institutionName}</span>
                    </p>
                  </div>

                  {/* Field Quick Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col text-[11px] font-mono text-slate-500">
                      <span>{d.items[0]?.quantity} {d.items[0]?.unit}</span>
                      <span className="text-[10px] text-slate-400 font-sans">{formatRelativeTime(d.pickupTimestamp || d.createdAt)}</span>
                    </div>

                    {d.status === 'PICKUP_SCHEDULED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenScanner('PICKUP');
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
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
                        className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Deliver & Scan
                      </button>
                    )}

                    {isConfirmed && (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
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
        <div className="lg:col-span-7 space-y-4">
          {activeDonation ? (
            <>
              <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Active Consignment #{activeDonation.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{activeDonation.requirementTitle}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Recipient</span>
                    <span className="text-xs font-bold text-slate-800">{activeDonation.institutionName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Updated {formatRelativeTime(activeDonation.updatedAt || activeDonation.createdAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Pickup Depot</span>
                    <p className="font-semibold text-slate-800 mt-1">{activeDonation.pickupAddress}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Donor: {activeDonation.donorName}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Destination Facility</span>
                    <p className="font-semibold text-slate-800 mt-1">{activeDonation.destinationAddress}</p>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Accredited Sanctuary</span>
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
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 mt-2">Select a consignment to view route telemetry</p>
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

