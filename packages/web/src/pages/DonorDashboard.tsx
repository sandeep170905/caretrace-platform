import React, { useState, useEffect } from 'react';
import { User, Donation, Requirement, ProofOfDeliveryCertificate, TaxExemptionReceipt, formatIndianCurrency, formatRelativeTime } from '@caretrace/shared';
import {
  Heart,
  Package,
  Award,
  ChevronRight,
  Plus,
  QrCode,
  ShieldCheck,
  Building,
  Truck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  FileCheck2,
  Receipt
} from 'lucide-react';
import {
  fetchDonations,
  fetchDonationDetail,
  fetchRequirements,
  createDonation,
  fetchProofCertificate,
  fetchMonetaryReceipt
} from '../api/client';
import { ChainOfCustodyTimeline } from '../components/ChainOfCustodyTimeline';
import { LiveTransitMap } from '../components/LiveTransitMap';
import { ProofOfDeliveryModal } from '../components/ProofOfDeliveryModal';
import { PledgeMonetaryModal } from '../components/PledgeMonetaryModal';
import { TaxExemptionReceiptModal } from '../components/TaxExemptionReceiptModal';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

interface DonorDashboardProps {
  user: User;
  refreshKey?: number;
  initialPledgeReq?: Requirement | null;
  onClearPendingPledge?: () => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  user,
  refreshKey,
  initialPledgeReq,
  onClearPendingPledge
}) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [certificate, setCertificate] = useState<ProofOfDeliveryCertificate | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<TaxExemptionReceipt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Donation Modals State
  const [pledgeReq, setPledgeReq] = useState<Requirement | null>(null);
  const [pledgeQty, setPledgeQty] = useState<number>(20);
  const [monetaryRequirement, setMonetaryRequirement] = useState<Requirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [donationsList, reqsList] = await Promise.all([
        fetchDonations({ donorId: user.id }),
        fetchRequirements({ status: 'VERIFIED' })
      ]);
      setDonations(donationsList);
      setRequirements(reqsList);

      // Default select the active in-transit donation CT-2026-9042 if available
      const activeDonation = donationsList.find(d => d.id === 'CT-2026-9042') || donationsList[0];
      if (activeDonation && !selectedDonation) {
        const detail = await fetchDonationDetail(activeDonation.id);
        setSelectedDonation(detail);
      } else if (selectedDonation) {
        // Refresh selected donation details
        const detail = await fetchDonationDetail(selectedDonation.donation.id);
        setSelectedDonation(detail);
      }
    } catch (err) {
      console.error('Failed to load donor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id, refreshKey]);

  useEffect(() => {
    if (initialPledgeReq) {
      setPledgeReq(initialPledgeReq);
      setPledgeQty(Math.max(1, initialPledgeReq.targetQuantity - initialPledgeReq.fulfilledQuantity));
      if (onClearPendingPledge) {
        onClearPendingPledge();
      }
    }
  }, [initialPledgeReq]);

  const handleSelectDonation = async (d: Donation) => {
    try {
      const detail = await fetchDonationDetail(d.id);
      setSelectedDonation(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInspectCertificate = async (donationId: string) => {
    const cert = await fetchProofCertificate(donationId);
    if (cert) setCertificate(cert);
  };

  const handleInspectReceipt = async (donationId: string) => {
    const r = await fetchMonetaryReceipt(donationId);
    if (r) setActiveReceipt(r);
  };

  const handlePaymentSuccess = async (receipt: TaxExemptionReceipt) => {
    setMonetaryRequirement(null);
    setActiveReceipt(receipt);
    await loadData();
    const detail = await fetchDonationDetail(receipt.donationId);
    if (detail) setSelectedDonation(detail);
  };


  const handleCreateDonation = async () => {
    if (!pledgeReq) return;
    setIsSubmitting(true);
    try {
      const payload = {
        donorId: user.id,
        requirementId: pledgeReq.id,
        type: 'PHYSICAL_GOODS',
        items: [
          {
            name: pledgeReq.title,
            quantity: Number(pledgeQty),
            unit: pledgeReq.unit
          }
        ],
        pickupAddress: 'T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017'
      };

      const result = await createDonation(payload);
      if (result.success) {
        setPledgeReq(null);
        await loadData();
        const detail = await fetchDonationDetail(result.donation.id);
        setSelectedDonation(detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Dashboard Sub-Tab: 'TRACKING' (default) vs 'EXPLORE' (quick donate)
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'EXPLORE'>('TRACKING');
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);

  const handleTabSwitch = (newTab: 'TRACKING' | 'EXPLORE') => {
    if (newTab === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(newTab);
    setTimeout(() => setIsTabSwitching(false), 180);
  };

  const totalDelivered = donations.filter(d => d.status === 'CONFIRMED').length;
  const inTransitCount = donations.filter(d => ['PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length;
  const institutionsSupportedCount = new Set(donations.map(d => d.institutionId).filter(Boolean)).size;

  if (isLoading && donations.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in pb-16">
        <AnnouncementBanner refreshKey={refreshKey} />
        <DashboardSkeleton type="DONOR" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Broadcast Announcements Banner */}
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* Donor Welcome & Impact Header */}
      <div className="gradient-hero rounded-[2.5rem] p-8 sm:p-12 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-teal-600/30 blur-[100px] rounded-full rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-xs font-sans font-bold tracking-wide text-teal-200 mb-5 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Verified Donor Impact Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight mb-4">
            Welcome back, {user.name}
          </h1>
          <p className="text-base font-sans text-teal-100/90 leading-relaxed max-w-xl">
            Every donation you pledge is tracked through a cryptographic chain of custody. You have direct proof when goods reach the children in verified care.
          </p>
        </div>

        {/* Impact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 pt-8 border-t border-teal-700/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-teal-200/90 block mb-1.5">Consignments Delivered</span>
            <p className="text-4xl font-display font-bold text-white mb-2">{totalDelivered}</p>
            <span className="text-[11px] font-sans font-medium text-emerald-300 flex items-center space-x-1.5 bg-emerald-950/40 px-2 py-1 rounded w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Ledger Certified</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-teal-200/90 block mb-1.5">Active In-Transit</span>
            <p className="text-4xl font-display font-bold text-amber-300 mb-2">{inTransitCount}</p>
            <span className="text-[11px] font-sans font-medium text-amber-200 flex items-center space-x-1.5 bg-amber-950/40 px-2 py-1 rounded w-fit">
              <Truck className="w-3.5 h-3.5" />
              <span>Live Courier Tracking</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-teal-200/90 block mb-1.5">Institutions Supported</span>
            <p className="text-4xl font-display font-bold text-white mb-2">{institutionsSupportedCount}</p>
            <span className="text-[11px] font-sans font-medium text-teal-200 flex items-center space-x-1.5 bg-teal-950/40 px-2 py-1 rounded w-fit">
              <Building className="w-3.5 h-3.5" />
              <span>Accredited Child Shelters</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center space-x-2 bg-surface-subtle p-1.5 rounded-2xl border border-surface-border overflow-x-auto max-w-full shadow-inner">
          <button
            onClick={() => handleTabSwitch('TRACKING')}
            className={`px-5 py-2.5 rounded-xl text-sm font-sans font-bold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'TRACKING'
                ? 'bg-surface-card text-teal-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 text-teal-700" />
            <span>My Consignments & Tracking</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shadow-sm ml-1">
              {donations.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('EXPLORE')}
            className={`px-5 py-2.5 rounded-xl text-sm font-sans font-bold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'EXPLORE'
                ? 'bg-surface-card text-teal-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Fulfill Needs & Donate</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 border border-slate-300 shadow-sm ml-1">
              {requirements.length}
            </span>
          </button>
        </div>

        {activeTab === 'TRACKING' ? (
          <button
            onClick={() => handleTabSwitch('EXPLORE')}
            className="px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-sans font-bold shadow-glow-teal transition-all flex items-center space-x-2 self-start sm:self-center hover-lift press-effect"
          >
            <Plus className="w-4 h-4" />
            <span>New Donation</span>
          </button>
        ) : (
          <span className="text-sm font-sans font-medium text-slate-500 italic bg-surface-subtle px-4 py-2 rounded-xl border border-surface-border">
            Select a verified requirement below to pledge goods or simulated funds
          </span>
        )}
      </div>

      {/* Main Content Area based on active tab with smooth skeleton transition */}
      {isTabSwitching ? (
        <DashboardSkeleton type="TAB_CONTENT" />
      ) : activeTab === 'TRACKING' ? (
        donations.length === 0 ? (
          <div className="bg-surface-card rounded-[2rem] p-16 text-center border border-surface-border shadow-sm">
            <div className="w-20 h-20 bg-surface-subtle rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-surface-border">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-2xl font-display font-bold text-slate-900 mb-3">No Consignments Yet</p>
            <p className="text-sm font-sans text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              You have not pledged any physical goods or monetary donations yet. Explore verified child sanctuaries to make your first contribution.
            </p>
            <button
              onClick={() => setActiveTab('EXPLORE')}
              className="px-6 py-3 gradient-primary text-white rounded-xl text-sm font-sans font-bold shadow-glow-teal hover-lift transition-all press-effect"
            >
              Browse Verified Requirements
            </button>
          </div>
        ) : (
          /* Main Split View: Left = My Donations, Right = Active Donation Deep Tracking */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: My Consignments List (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-bold text-slate-900 flex items-center space-x-2.5">
                  <Package className="w-5 h-5 text-teal-700" />
                  <span>My Tracked Consignments</span>
                </h2>
                <span className="text-xs font-mono font-medium text-slate-500 bg-surface-subtle px-2.5 py-1 rounded-lg border border-surface-border shadow-sm">
                  {donations.length} total
                </span>
              </div>

          <div className="space-y-4 pr-1 max-h-[800px] overflow-y-auto pb-4 custom-scrollbar">
            {donations.map((d, i) => {
              const isSelected = selectedDonation?.donation.id === d.id;
              const isDelivered = d.status === 'CONFIRMED';
              const isMonetary = d.type === 'FUNDS' || Boolean(d.monetaryAmountInr);

              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectDonation(d)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer animate-fade-up press-effect ${
                    isSelected
                      ? 'bg-surface-card border-teal-500 ring-4 ring-teal-50 shadow-card-hover transform scale-[1.02]'
                      : 'bg-surface-canvas hover:bg-surface-subtle border-surface-border shadow-sm hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-surface-border shadow-sm">{d.id}</span>
                        {isMonetary ? (
                          <>
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 flex items-center space-x-1 shadow-sm">
                              <span className="font-bold font-display text-sm">₹</span>
                              <span>MONETARY</span>
                            </span>
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                              SETTLED
                            </span>
                          </>
                        ) : (
                          <span
                            className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm border ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {d.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-sans font-bold text-slate-900 mt-2 leading-snug pr-2">{d.requirementTitle}</h3>
                      <div className="text-xs font-sans font-medium text-slate-500 mt-1.5 flex items-center space-x-2">
                        <p className="flex items-center space-x-1.5 bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{d.institutionName}</span>
                        </p>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400 font-mono">{formatRelativeTime(d.createdAt)}</span>
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-teal-50' : 'bg-surface-subtle'}`}>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'}`} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs font-sans">
                    {isMonetary ? (
                      <span className="text-slate-800 font-bold font-mono text-sm bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                        {formatIndianCurrency(d.monetaryAmountInr || d.items[0]?.estimatedValueInr || 0)}
                        <span className="text-slate-500 font-sans font-medium ml-1.5 text-[11px] bg-white px-1.5 py-0.5 rounded">Direct Fund Transfer</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium">
                        {d.items.map(i => `${i.quantity} ${i.unit}`).join(', ')}
                      </span>
                    )}

                    {isMonetary ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectReceipt(d.id);
                        }}
                        className="text-[11px] font-sans font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1.5 bg-white hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors shadow-sm press-effect"
                      >
                        <FileCheck2 className="w-4 h-4 text-purple-600" />
                        <span>80G Receipt</span>
                      </button>
                    ) : isDelivered ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectCertificate(d.id);
                        }}
                        className="text-[11px] font-sans font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1.5 bg-white hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors shadow-sm press-effect"
                      >
                        <Award className="w-4 h-4 text-teal-600" />
                        <span>Certificate</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Tracking & Detail Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDonation ? (
            <div className="animate-fade-in">
              {(() => {
                const isSelectedMonetary = selectedDonation.donation.type === 'FUNDS' || Boolean(selectedDonation.donation.monetaryAmountInr);
                const monetaryAmount = selectedDonation.donation.monetaryAmountInr || selectedDonation.donation.items[0]?.estimatedValueInr || 0;

                return isSelectedMonetary ? (
                  /* Monetary Contribution Header Card */
                  <div className="bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-elevated card-premium mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-surface-border">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 shadow-sm">
                            {selectedDonation.donation.id}
                          </span>
                          <span className="text-xs font-sans font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 flex items-center space-x-1 shadow-sm">
                            <span className="font-display text-sm">₹</span>
                            <span>MONETARY CONTRIBUTION</span>
                          </span>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mt-2 leading-tight">
                          {selectedDonation.donation.requirementTitle}
                        </h3>
                        <p className="text-sm font-sans text-slate-600 mt-1 flex items-center space-x-1.5">
                          <span>Beneficiary:</span> <strong className="text-slate-800 bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">{selectedDonation.donation.institutionName}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleInspectReceipt(selectedDonation.donation.id)}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-xl text-sm font-sans font-bold shadow-md hover:shadow-lg flex items-center space-x-2 transition-all self-start sm:self-center hover-lift press-effect"
                      >
                        <FileCheck2 className="w-4.5 h-4.5 text-purple-200" />
                        <span>View 80G Tax Receipt</span>
                      </button>
                    </div>

                    <div className="mt-5 p-6 rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-teal-300 text-[10px] font-sans font-bold uppercase tracking-widest block mb-1">
                          Settled Contribution
                        </span>
                        <span className="text-3xl font-display font-bold mt-1 block tracking-wide">
                          {formatIndianCurrency(monetaryAmount)}
                        </span>
                        <span className="text-xs font-sans font-medium text-teal-100/80 italic block mt-1.5">
                          Direct Monetary Contribution Settled
                        </span>
                      </div>
                      <div className="text-sm sm:text-right space-y-1.5 border-t sm:border-t-0 border-teal-700/60 pt-4 sm:pt-0">
                        <span className="text-teal-300 text-[10px] font-sans font-bold uppercase tracking-widest block">Settlement Status</span>
                        <span className="inline-flex items-center space-x-1.5 text-emerald-300 font-sans font-bold bg-emerald-950/40 px-2 py-1 rounded">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Ledger Verified</span>
                        </span>
                        <p className="text-xs font-mono font-medium text-teal-200/80 bg-black/20 px-2 py-1 rounded border border-white/10 mt-1 inline-block">
                          Ref: {selectedDonation.donation.upiTransactionId || 'TXN-2026-CONFIRMED'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Physical Delivery Consignment Header Card */
                  <div className="bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-elevated card-premium mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-surface-border">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-bold text-teal-900 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 shadow-sm">
                            {selectedDonation.donation.id}
                          </span>
                          <span className="text-xs font-sans font-bold text-slate-600 bg-surface-subtle px-2.5 py-1 rounded-full border border-surface-border shadow-sm">Physical Delivery Consignment</span>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mt-2 leading-tight">
                          {selectedDonation.donation.requirementTitle}
                        </h3>
                        <p className="text-sm font-sans text-slate-600 mt-1 flex items-center space-x-1.5">
                          <span>Destination:</span> <strong className="text-slate-800 bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">{selectedDonation.donation.institutionName}</strong>
                        </p>
                      </div>

                      {/* QR Code Quick View */}
                      {selectedDonation.qrDataUrl && (
                        <div className="flex items-center space-x-4 bg-surface-canvas p-3 rounded-2xl border border-surface-border shadow-inner">
                          <img
                            src={selectedDonation.qrDataUrl}
                            alt="Donation QR Code"
                            className="w-20 h-20 rounded-xl border border-surface-border bg-white shadow-sm p-1"
                          />
                          <div className="text-left pr-2">
                            <span className="text-[10px] font-sans text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Consignment QR</span>
                            <span className="text-xs font-sans text-teal-800 font-bold block mb-1.5">Scan at Handover</span>
                            <a
                              href={selectedDonation.qrDataUrl}
                              download={`CareTrace-${selectedDonation.donation.id}-QR.png`}
                              className="text-[10px] font-sans font-bold text-white bg-teal-700 hover:bg-teal-800 px-2 py-1 rounded transition-colors inline-flex items-center shadow-sm press-effect"
                            >
                              Download QR
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items detail */}
                    <div className="mt-5 flex flex-wrap gap-2.5 text-sm font-sans">
                      {selectedDonation.donation.items.map((it: any, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-surface-subtle border border-surface-border text-slate-800 font-bold rounded-xl flex items-center space-x-1.5 shadow-sm">
                          <span>{it.quantity} {it.unit} {it.name}</span>
                          {it.estimatedValueInr && (
                            <span className="text-teal-700 font-mono bg-white px-1.5 py-0.5 rounded border border-teal-100 ml-1">
                              (₹{Number(it.estimatedValueInr).toLocaleString('en-IN')})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Chain of Custody Timeline Component */}
              <ChainOfCustodyTimeline
                donation={selectedDonation.donation}
                blocks={selectedDonation.blocks}
                onInspectCertificate={() => handleInspectCertificate(selectedDonation.donation.id)}
              />

              {/* Live Transit Map (Only for physical road courier delivery) */}
              {selectedDonation.donation.type !== 'FUNDS' && !selectedDonation.donation.monetaryAmountInr && (
                <div className="mt-6">
                <LiveTransitMap
                  donation={selectedDonation.donation}
                  initialTelemetry={selectedDonation.telemetry}
                  onStatusAdvanced={loadData}
                />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-card rounded-[2rem] p-16 text-center border border-surface-border shadow-sm flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-surface-subtle rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-surface-border">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-xl font-display font-bold text-slate-800">Select a consignment to view live tracking</p>
            </div>
          )}
        </div>
      </div>
    )
  ) : (
        /* EXPLORE / FULFILL NEEDS TAB VIEW */
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-sm card-premium">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Verified Childcare Requirements to Fulfill</h2>
              <p className="text-sm font-sans text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                Authenticity-audited requirements posted by registered and verified child sanctuaries in Chennai
              </p>
            </div>
            <a
              href="/requests"
              className="text-sm font-sans font-bold text-teal-800 hover:text-teal-900 flex items-center space-x-2 self-start sm:self-center bg-teal-50 hover:bg-teal-100 px-5 py-2.5 rounded-xl border border-teal-200 transition-colors shadow-sm press-effect hover-lift shrink-0"
            >
              <span>Explore Public Board</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requirements.map((req, i) => (
              <div
                key={req.id}
                className={`card-premium p-6 border border-surface-border hover:border-teal-300 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between bg-surface-card rounded-2xl animate-fade-up stagger-${(i % 6) + 1}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-surface-subtle text-slate-600 border border-surface-border shadow-sm">
                      {req.category}
                    </span>
                    <span
                      className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                        req.urgency === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : req.urgency === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {req.urgency} Urgency
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">{req.title}</h3>
                  <p className="text-sm font-sans text-slate-600 mt-2 line-clamp-2 leading-relaxed">{req.description}</p>

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-sans font-medium text-slate-700">
                      <span>Target Needed</span>
                      <span className="font-bold">
                        {req.fulfilledQuantity} / {req.targetQuantity} {req.unit}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden border border-surface-border/50 shadow-inner">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (req.fulfilledQuantity / req.targetQuantity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-surface-border flex items-center justify-between gap-3">
                  <div className="text-[11px] font-sans font-bold text-slate-500 truncate max-w-[110px] bg-surface-subtle px-2 py-1 rounded border border-surface-border">
                    {req.institutionName}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setMonetaryRequirement(req)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-sans font-bold shadow-sm transition-colors flex items-center space-x-1.5 press-effect hover-lift"
                      title="Pledge Monetary Contribution"
                    >
                      <span className="font-display font-bold text-sm">₹</span>
                      <span>Funds</span>
                    </button>
                    <button
                      onClick={() => setPledgeReq(req)}
                      className="px-3 py-2 gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal flex items-center space-x-1.5 press-effect hover-lift transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Goods</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pledge Donation Modal */}
      {pledgeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevated border border-surface-border animate-slide-up card-premium relative">
            <h3 className="text-2xl font-display font-bold text-slate-900">Pledge Physical Donation</h3>
            <p className="text-sm font-sans text-slate-500 mt-1">
              Fulfilling demand for <strong className="text-slate-800 bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">{pledgeReq.institutionName}</strong>
            </p>

            <div className="mt-5 p-4 rounded-xl bg-teal-50 border border-teal-200 shadow-sm">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-teal-800 block mb-1">Selected Requirement</span>
              <p className="text-sm font-sans font-bold text-teal-950">{pledgeReq.title}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold text-slate-700 mb-1.5">
                  Pledge Quantity ({pledgeReq.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={pledgeReq.targetQuantity - pledgeReq.fulfilledQuantity}
                  value={pledgeQty}
                  onChange={(e) => setPledgeQty(Number(e.target.value))}
                  className="w-full px-4 py-3 text-sm font-sans bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold text-slate-900 shadow-inner transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-slate-700 mb-1.5">
                  Pickup Logistics Depot:
                </label>
                <input
                  type="text"
                  readOnly
                  value="T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017"
                  className="w-full px-4 py-3 text-sm font-sans bg-surface-canvas border border-surface-border rounded-xl text-slate-600 font-medium shadow-inner"
                />
              </div>

              <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border text-xs font-sans text-slate-600 space-y-2 shadow-inner">
                <span className="font-bold text-slate-800 block flex items-center space-x-1.5"><ShieldCheck className="w-4 h-4 text-teal-600"/> <span>Ledger Process:</span></span>
                <p className="flex items-start space-x-2"><span className="text-teal-600 font-bold">1.</span> <span>Unique Donation ID & cryptographic QR code will be minted.</span></p>
                <p className="flex items-start space-x-2"><span className="text-teal-600 font-bold">2.</span> <span>First checkpoint block will be sealed on the SHA-256 ledger.</span></p>
                <p className="flex items-start space-x-2"><span className="text-teal-600 font-bold">3.</span> <span>Dispatch courier will be assigned for authenticated pickup.</span></p>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setPledgeReq(null)}
                className="px-5 py-2.5 text-sm font-sans font-bold text-slate-600 hover:text-slate-900 hover:bg-surface-subtle rounded-xl transition-colors press-effect"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDonation}
                disabled={isSubmitting || pledgeQty <= 0}
                className="px-6 py-2.5 text-sm font-sans font-bold gradient-primary text-white rounded-xl shadow-glow-teal hover-lift transition-all disabled:opacity-50 press-effect flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Minting...</span>
                  </>
                ) : 'Confirm & Generate QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monetary Contribution Pledge Modal */}
      {monetaryRequirement && (
        <PledgeMonetaryModal
          donorId={user.id}
          requirement={monetaryRequirement}
          onClose={() => setMonetaryRequirement(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Section 80G Tax Exemption Receipt Modal */}
      {activeReceipt && (
        <TaxExemptionReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Proof of Delivery Certificate Modal */}
      {certificate && (
        <ProofOfDeliveryModal
          certificate={certificate}
          onClose={() => setCertificate(null)}
        />
      )}
    </div>
  );
};
