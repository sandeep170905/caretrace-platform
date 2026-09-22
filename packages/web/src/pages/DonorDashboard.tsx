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
      <div className="space-y-6 animate-fade-in">
        <AnnouncementBanner refreshKey={refreshKey} />
        <DashboardSkeleton type="DONOR" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Broadcast Announcements Banner */}
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* Donor Welcome & Impact Header */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 text-xs text-teal-200 font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Verified Donor Impact Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-teal-100/90 mt-2 leading-relaxed">
            Every donation you pledge is tracked through a cryptographic chain of custody. You have direct proof when goods reach the children in verified care.
          </p>
        </div>

        {/* Impact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-teal-700/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-teal-200 font-medium">Consignments Delivered</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{totalDelivered}</p>
            <span className="text-[11px] text-emerald-300 flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Ledger Certified</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-teal-200 font-medium">Active In-Transit</span>
            <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{inTransitCount}</p>
            <span className="text-[11px] text-teal-200 flex items-center space-x-1 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Courier Tracking</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-teal-200 font-medium">Institutions Supported</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{institutionsSupportedCount}</p>
            <span className="text-[11px] text-teal-200 flex items-center space-x-1 mt-0.5">
              <Building className="w-3.5 h-3.5" />
              <span>Accredited Child Shelters</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2 bg-slate-100/90 p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => handleTabSwitch('TRACKING')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'TRACKING'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-teal-700" />
            <span>My Consignments & Tracking</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
              {donations.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('EXPLORE')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'EXPLORE'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Fulfill Needs & Donate</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
              {requirements.length}
            </span>
          </button>
        </div>

        {activeTab === 'TRACKING' ? (
          <button
            onClick={() => handleTabSwitch('EXPLORE')}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Donation</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 italic">
            Select a verified requirement below to pledge goods or simulated funds
          </span>
        )}
      </div>

      {/* Main Content Area based on active tab with smooth skeleton transition */}
      {isTabSwitching ? (
        <DashboardSkeleton type="TAB_CONTENT" />
      ) : activeTab === 'TRACKING' ? (
        donations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-800 mt-3">No Consignments Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have not pledged any physical goods or monetary donations yet. Explore verified child sanctuaries to make your first contribution.
            </p>
            <button
              onClick={() => setActiveTab('EXPLORE')}
              className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Browse Verified Requirements
            </button>
          </div>
        ) : (
          /* Main Split View: Left = My Donations, Right = Active Donation Deep Tracking */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: My Consignments List (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-teal-700" />
                  <span>My Tracked Consignments</span>
                </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {donations.length} total
            </span>
          </div>

          <div className="space-y-3">
            {donations.map((d) => {
              const isSelected = selectedDonation?.donation.id === d.id;
              const isDelivered = d.status === 'CONFIRMED';
              const isMonetary = d.type === 'FUNDS' || Boolean(d.monetaryAmountInr);

              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectDonation(d)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-teal-600 ring-2 ring-teal-100 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">{d.id}</span>
                        {isMonetary ? (
                          <>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center space-x-1">
                              <span className="font-bold">₹</span>
                              <span>MONETARY</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              SETTLED
                            </span>
                          </>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDelivered
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {d.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1">{d.requirementTitle}</h3>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                        <p className="flex items-center space-x-1">
                          <Building className="w-3 h-3" />
                          <span>{d.institutionName}</span>
                        </p>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400 font-sans">{formatRelativeTime(d.createdAt)}</span>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 mt-1 ${isSelected ? 'text-teal-700' : ''}`} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isMonetary ? (
                      <span className="text-slate-700 font-semibold font-mono">
                        {formatIndianCurrency(d.monetaryAmountInr || d.items[0]?.estimatedValueInr || 0)}
                        <span className="text-slate-400 font-normal ml-1 text-[11px]">Direct Fund Transfer</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {d.items.map(i => `${i.quantity} ${i.unit}`).join(', ')}
                      </span>
                    )}

                    {isMonetary ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectReceipt(d.id);
                        }}
                        className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>80G Receipt</span>
                      </button>
                    ) : isDelivered ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectCertificate(d.id);
                        }}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
                      >
                        <Award className="w-3.5 h-3.5" />
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
            <>
              {(() => {
                const isSelectedMonetary = selectedDonation.donation.type === 'FUNDS' || Boolean(selectedDonation.donation.monetaryAmountInr);
                const monetaryAmount = selectedDonation.donation.monetaryAmountInr || selectedDonation.donation.items[0]?.estimatedValueInr || 0;

                return isSelectedMonetary ? (
                  /* Monetary Contribution Header Card */
                  <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                            {selectedDonation.donation.id}
                          </span>
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 flex items-center space-x-1">
                            <span>₹</span>
                            <span>MONETARY CONTRIBUTION</span>
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                          {selectedDonation.donation.requirementTitle}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Beneficiary: <span className="font-medium text-slate-800">{selectedDonation.donation.institutionName}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleInspectReceipt(selectedDonation.donation.id)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all self-start sm:self-center"
                      >
                        <FileCheck2 className="w-4 h-4 text-teal-200" />
                        <span>View 80G Tax Receipt</span>
                      </button>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-teal-300 text-[10px] uppercase tracking-wider font-bold block">
                          Settled Contribution
                        </span>
                        <span className="text-2xl font-black font-mono mt-0.5 block">
                          {formatIndianCurrency(monetaryAmount)}
                        </span>
                        <span className="text-[11px] text-teal-100/90 italic block mt-0.5">
                          Direct Monetary Contribution Settled
                        </span>
                      </div>
                      <div className="text-xs sm:text-right space-y-0.5 border-t sm:border-t-0 border-teal-700/60 pt-2 sm:pt-0">
                        <span className="text-teal-300 text-[10px] block">Settlement Status</span>
                        <span className="inline-flex items-center space-x-1 text-emerald-300 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Ledger Verified</span>
                        </span>
                        <p className="text-[10px] font-mono text-teal-200/80">
                          Ref: {selectedDonation.donation.upiTransactionId || 'TXN-2026-CONFIRMED'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Physical Delivery Consignment Header Card */
                  <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {selectedDonation.donation.id}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Physical Delivery Consignment</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                          {selectedDonation.donation.requirementTitle}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Destination: <span className="font-medium">{selectedDonation.donation.institutionName}</span>
                        </p>
                      </div>

                      {/* QR Code Quick View */}
                      {selectedDonation.qrDataUrl && (
                        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <img
                            src={selectedDonation.qrDataUrl}
                            alt="Donation QR Code"
                            className="w-16 h-16 rounded-lg border border-slate-200 bg-white"
                          />
                          <div className="text-left">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Consignment QR</span>
                            <span className="text-[11px] text-teal-800 font-semibold block">Scan at Handover</span>
                            <a
                              href={selectedDonation.qrDataUrl}
                              download={`CareTrace-${selectedDonation.donation.id}-QR.png`}
                              className="text-[10px] text-teal-700 hover:underline inline-flex items-center mt-0.5"
                            >
                              Download QR
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items detail */}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {selectedDonation.donation.items.map((it: any, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 font-medium rounded-lg flex items-center space-x-1">
                          <span>{it.quantity} {it.unit} {it.name}</span>
                          {it.estimatedValueInr && (
                            <span className="text-teal-700 font-mono font-semibold">
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
                <LiveTransitMap
                  donation={selectedDonation.donation}
                  initialTelemetry={selectedDonation.telemetry}
                  onStatusAdvanced={loadData}
                />
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 mt-2">Select a consignment to view live tracking</p>
            </div>
          )}
        </div>
      </div>
    )
  ) : (
        /* EXPLORE / FULFILL NEEDS TAB VIEW */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">Verified Childcare Requirements to Fulfill</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authenticity-audited requirements posted by registered and verified child sanctuaries in Chennai
              </p>
            </div>
            <a
              href="/requests"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1.5 self-start sm:self-center bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors"
            >
              <span>Explore Public Board</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-[#E7E8E2] hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {req.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        req.urgency === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : req.urgency === 'HIGH'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      {req.urgency} Urgency
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{req.description}</p>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Target Needed</span>
                      <span>
                        {req.fulfilledQuantity} / {req.targetQuantity} {req.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-700 rounded-full"
                        style={{ width: `${Math.min(100, (req.fulfilledQuantity / req.targetQuantity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 truncate max-w-[120px]">
                    {req.institutionName}
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => setMonetaryRequirement(req)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
                      title="Pledge Monetary Contribution"
                    >
                      <span className="font-bold">₹</span>
                      <span>Contribute Funds</span>
                    </button>
                    <button
                      onClick={() => setPledgeReq(req)}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pledge Goods</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Pledge Physical Donation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fulfilling demand for <span className="font-medium text-slate-800">{pledgeReq.institutionName}</span>
            </p>

            <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200">
              <span className="text-[10px] uppercase font-bold text-teal-800">Selected Requirement</span>
              <p className="text-xs font-semibold text-teal-950 mt-0.5">{pledgeReq.title}</p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pledge Quantity ({pledgeReq.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={pledgeReq.targetQuantity - pledgeReq.fulfilledQuantity}
                  value={pledgeQty}
                  onChange={(e) => setPledgeQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pickup Logistics Depot:
                </label>
                <input
                  type="text"
                  readOnly
                  value="T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Ledger Process:</span>
                <p>1. Unique Donation ID & cryptographic QR code will be minted.</p>
                <p>2. First checkpoint block will be sealed on the SHA-256 ledger.</p>
                <p>3. Dispatch courier will be assigned for authenticated pickup.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setPledgeReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDonation}
                disabled={isSubmitting || pledgeQty <= 0}
                className="px-5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Minting Consignment...' : 'Confirm & Generate QR'}
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
