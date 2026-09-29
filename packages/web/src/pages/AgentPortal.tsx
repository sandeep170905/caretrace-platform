import React, { useState, useEffect } from 'react';
import { User, Donation, formatRelativeTime } from '@caretrace/shared';
import {
  Truck,
  QrCode,
  MapPin,
  CheckCircle2,
  Building,
  ShieldCheck,
  Package,
  Search,
  UserCheck
} from 'lucide-react';
import { fetchDonations, scanPickup, scanDelivery } from '../api/client';
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
  const [filterMode, setFilterMode] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'IN_TRANSIT' | 'PICKUP_SCHEDULED' | 'CONFIRMED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const all = await fetchDonations();
      // Sort: IN_TRANSIT first, then PICKUP_SCHEDULED, then MATCHED, then CONFIRMED
      const sorted = [...all].sort((a, b) => {
        const priority: Record<string, number> = {
          IN_TRANSIT: 1,
          PICKED_UP: 2,
          PICKUP_SCHEDULED: 3,
          MATCHED: 4,
          CONFIRMED: 5
        };
        const pA = priority[a.status] || 9;
        const pB = priority[b.status] || 9;
        if (pA !== pB) return pA - pB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setDonations(sorted);

      // Select active donation
      if (!activeDonation) {
        const preferred =
          sorted.find(d => d.id === 'CT-2026-9042') ||
          sorted.find(d => d.status === 'IN_TRANSIT') ||
          sorted.find(d => d.status === 'PICKUP_SCHEDULED') ||
          sorted[0];
        if (preferred) setActiveDonation(preferred);
      } else {
        const refreshed = sorted.find(d => d.id === activeDonation.id);
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

  // Filter calculations
  const isAgentMatch = (d: Donation) =>
    (d.pickupAgentId && (d.pickupAgentId === user.id || d.pickupAgentId === 'user-agent-sakthivel')) ||
    (d.pickupAgentName && (d.pickupAgentName.toLowerCase().includes('sakthivel') || d.pickupAgentName === user.name));

  const assignedToMeCount = donations.filter(isAgentMatch).length;
  const inTransitCount = donations.filter(d => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP').length;
  const pickupCount = donations.filter(d => d.status === 'PICKUP_SCHEDULED').length;
  const confirmedCount = donations.filter(d => d.status === 'CONFIRMED').length;

  const filteredDonations = donations.filter(d => {
    // Mode filter
    if (filterMode === 'ASSIGNED_TO_ME') {
      if (!isAgentMatch(d)) return false;
    } else if (filterMode === 'IN_TRANSIT') {
      if (d.status !== 'IN_TRANSIT' && d.status !== 'PICKED_UP') return false;
    } else if (filterMode === 'PICKUP_SCHEDULED') {
      if (d.status !== 'PICKUP_SCHEDULED') return false;
    } else if (filterMode === 'CONFIRMED') {
      if (d.status !== 'CONFIRMED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = d.id.toLowerCase().includes(q);
      const matchTitle = (d.requirementTitle || '').toLowerCase().includes(q);
      const matchInst = (d.institutionName || '').toLowerCase().includes(q);
      const matchDonor = (d.donorName || '').toLowerCase().includes(q);
      const matchAddress = (d.pickupAddress || '').toLowerCase().includes(q);
      return matchId || matchTitle || matchInst || matchDonor || matchAddress;
    }

    return true;
  });

  if (isLoading && donations.length === 0) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
        <DashboardSkeleton type="AGENT" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Field Agent Header */}
      <div className="gradient-hero rounded-[2.5rem] p-8 sm:p-10 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-amber-600/30 blur-[100px] rounded-full rotate-12" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-sans font-bold tracking-wide text-amber-200 mb-4 shadow-sm">
            <Truck className="w-4 h-4 text-amber-300" />
            <span>Field Logistics & Custody Agent</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-2">
            Logistics Portal: {user.name}
          </h1>
          <p className="text-xs sm:text-sm font-sans font-medium text-amber-100/90">
            Chennai Metro Custody Chain • Real-time GPS Telemetry & Multi-party Smart Consignments
          </p>
        </div>

        {/* Floating Quick Scanner Launcher */}
        <div className="mt-8 pt-6 border-t border-amber-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <button
            onClick={() => handleOpenScanner('PICKUP')}
            className="flex items-center space-x-4 p-4 bg-white text-slate-900 hover:bg-surface-subtle rounded-2xl font-sans font-bold text-sm shadow-glass hover:shadow-card-hover transition-all press-effect hover-lift"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-0.5">Scan at Donor Depot</span>
              <span className="text-sm font-display font-bold text-slate-900">1-Click Pickup Scanner</span>
            </div>
          </button>

          <button
            onClick={() => handleOpenScanner('DELIVERY')}
            className="flex items-center space-x-4 p-4 gradient-primary text-white rounded-2xl font-sans font-bold text-sm shadow-glow-teal hover:shadow-card-hover transition-all press-effect hover-lift"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-sans font-bold text-teal-100 uppercase tracking-wider mb-0.5">Scan at Institution</span>
              <span className="text-sm font-display font-bold text-white">1-Click Delivery Scanner</span>
            </div>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in card-premium">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-sans font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-emerald-700 font-bold hover:underline px-3 py-1 bg-white rounded-lg border border-emerald-200 press-effect"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Work Orders Grid (Side-by-Side: Scrollable Manifest & Pinned Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Consignment List Column (5 Cols) with Scrollable Container */}
        <div className="lg:col-span-5 space-y-4">
          {/* Manifest Controls Header */}
          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-700">
                  Courier Manifest
                </h2>
              </div>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredDonations.length} of {donations.length}
              </span>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search consignment, item, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 placeholder-slate-400 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-surface-subtle text-slate-600 hover:bg-slate-200/70 border border-surface-border'
                }`}
              >
                All ({donations.length})
              </button>

              {assignedToMeCount > 0 && (
                <button
                  onClick={() => setFilterMode('ASSIGNED_TO_ME')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all flex items-center space-x-1 ${
                    filterMode === 'ASSIGNED_TO_ME'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>My Assigned ({assignedToMeCount})</span>
                </button>
              )}

              <button
                onClick={() => setFilterMode('IN_TRANSIT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all ${
                  filterMode === 'IN_TRANSIT'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-surface-subtle text-slate-600 hover:bg-slate-200/70 border border-surface-border'
                }`}
              >
                In Transit ({inTransitCount})
              </button>

              <button
                onClick={() => setFilterMode('PICKUP_SCHEDULED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all ${
                  filterMode === 'PICKUP_SCHEDULED'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-surface-subtle text-slate-600 hover:bg-slate-200/70 border border-surface-border'
                }`}
              >
                Pickup ({pickupCount})
              </button>

              <button
                onClick={() => setFilterMode('CONFIRMED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold transition-all ${
                  filterMode === 'CONFIRMED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-surface-subtle text-slate-600 hover:bg-slate-200/70 border border-surface-border'
                }`}
              >
                Delivered ({confirmedCount})
              </button>
            </div>
          </div>

          {/* Scrollable Manifest List Container */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1.5 custom-scrollbar">
            {filteredDonations.length === 0 ? (
              <div className="p-8 text-center bg-surface-card rounded-2xl border border-surface-border text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-sans font-medium">No consignments match this filter</p>
              </div>
            ) : (
              filteredDonations.map((d) => {
                const isSelected = activeDonation?.id === d.id;
                const isInTransit = d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP';
                const isConfirmed = d.status === 'CONFIRMED';
                const isPickupScheduled = d.status === 'PICKUP_SCHEDULED';

                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveDonation(d)}
                    className={`card-premium p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-200 shadow-md scale-[1.01]'
                        : 'bg-surface-card hover:border-amber-300 border-surface-border hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-surface-subtle border border-surface-border px-2 py-0.5 rounded shadow-sm">
                        {d.id}
                      </span>
                      <span
                        className={`text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInTransit
                            ? 'bg-amber-100 text-amber-800'
                            : isPickupScheduled
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-display font-bold text-slate-900 leading-snug line-clamp-1">
                      {d.requirementTitle}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs font-sans text-slate-600 p-2.5 bg-surface-subtle rounded-xl border border-surface-border">
                      <p className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                        <span className="truncate text-[11px] font-medium">From: {d.pickupAddress.split(',')[0]}</span>
                      </p>
                      <p className="flex items-center space-x-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span className="truncate text-[11px] font-medium">To: {d.institutionName}</span>
                      </p>
                    </div>

                    {/* Quick Consignment Summary & Action */}
                    <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center justify-between">
                      <div className="flex flex-col text-[11px] font-mono text-slate-500">
                        <span className="font-bold text-slate-700">
                          {d.items[0]?.quantity} {d.items[0]?.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {formatRelativeTime(d.pickupTimestamp || d.createdAt)}
                        </span>
                      </div>

                      {d.status === 'PICKUP_SCHEDULED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDonation(d);
                            handleOpenScanner('PICKUP');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-sans font-bold shadow-sm transition-all press-effect"
                        >
                          Verify Pickup
                        </button>
                      )}

                      {isInTransit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDonation(d);
                            handleOpenScanner('DELIVERY');
                          }}
                          className="px-3 py-1.5 gradient-primary text-white rounded-lg text-xs font-sans font-bold shadow-sm transition-all press-effect"
                        >
                          Deliver & Scan
                        </button>
                      )}

                      {isConfirmed && (
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pinned Telemetry & Map Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-20 self-start animate-fade-in">
          {activeDonation ? (
            <>
              {/* Active Consignment Card */}
              <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-sm card-premium">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-border gap-2">
                  <div>
                    <span className="text-[10px] font-sans uppercase font-bold tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded shadow-sm border border-amber-200 mb-1 inline-block">
                      Active Consignment #{activeDonation.id}
                    </span>
                    <h3 className="text-lg font-display font-bold text-slate-900 leading-tight">
                      {activeDonation.requirementTitle}
                    </h3>
                  </div>

                  <div className="sm:text-right bg-surface-subtle p-2.5 rounded-xl border border-surface-border self-start sm:self-auto">
                    <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Destination</span>
                    <span className="text-xs font-sans font-bold text-slate-800 block">{activeDonation.institutionName}</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      Updated {formatRelativeTime(activeDonation.updatedAt || activeDonation.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs font-sans">
                  <div className="p-3 bg-surface-subtle rounded-xl border border-surface-border">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 mb-1">
                      <MapPin className="w-3 h-3 text-teal-700" />
                      <span>Pickup Depot</span>
                    </span>
                    <p className="font-bold text-slate-800 leading-snug">{activeDonation.pickupAddress}</p>
                    <span className="text-[10px] font-medium text-slate-500 mt-1.5 block bg-white px-1.5 py-0.5 rounded border border-surface-border w-fit shadow-sm">
                      Donor: <strong className="text-slate-700">{activeDonation.donorName}</strong>
                    </span>
                  </div>

                  <div className="p-3 bg-surface-subtle rounded-xl border border-surface-border">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 mb-1">
                      <Building className="w-3 h-3 text-emerald-700" />
                      <span>Destination Shelter</span>
                    </span>
                    <p className="font-bold text-slate-800 leading-snug">{activeDonation.destinationAddress}</p>
                    <span className="text-[10px] font-bold text-emerald-800 mt-1.5 block bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit shadow-sm flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Accredited Child-Care Sanctuary</span>
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
            <div className="bg-surface-card rounded-2xl p-12 text-center border border-surface-border shadow-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-surface-subtle rounded-2xl flex items-center justify-center mb-4 border border-surface-border shadow-inner">
                <Truck className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 mb-1">Select a Consignment</h3>
              <p className="text-xs font-sans text-slate-500 max-w-xs mx-auto">
                Tap on any manifest item to view detailed telemetry, routing coordinates, and action scanning tools.
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
