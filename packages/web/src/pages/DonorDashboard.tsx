import React, { useState, useEffect } from 'react';
import { User, Donation, Requirement, ProofOfDeliveryCertificate, TaxExemptionReceipt, formatIndianCurrency, formatRelativeTime } from '@caretrace/shared';
import {
  Heart,
  Package,
  Award,
  ChevronRight,
  Plus,
  ShieldCheck,
  Building,
  Truck,
  ExternalLink,
  Sparkles,
  FileCheck2,
  ArrowUpRight
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

  const [pledgeReq, setPledgeReq] = useState<Requirement | null>(null);
  const [pledgeQty, setPledgeQty] = useState<number>(20);
  const [monetaryRequirement, setMonetaryRequirement] = useState<Requirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'EXPLORE'>('TRACKING');
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [donationsList, reqsList] = await Promise.all([
        fetchDonations({ donorId: user.id }),
        fetchRequirements({ status: 'VERIFIED' })
      ]);
      setDonations(donationsList);
      setRequirements(reqsList);
      const activeDonation = donationsList.find(d => d.id === 'CT-2026-9042') || donationsList[0];
      if (activeDonation && !selectedDonation) {
        const detail = await fetchDonationDetail(activeDonation.id);
        setSelectedDonation(detail);
      } else if (selectedDonation) {
        const detail = await fetchDonationDetail(selectedDonation.donation.id);
        setSelectedDonation(detail);
      }
    } catch (err) {
      console.error('Failed to load donor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user.id, refreshKey]);

  useEffect(() => {
    if (initialPledgeReq) {
      setPledgeReq(initialPledgeReq);
      setPledgeQty(Math.max(1, initialPledgeReq.targetQuantity - initialPledgeReq.fulfilledQuantity));
      if (onClearPendingPledge) onClearPendingPledge();
    }
  }, [initialPledgeReq]);

  const handleSelectDonation = async (d: Donation) => {
    try {
      const detail = await fetchDonationDetail(d.id);
      setSelectedDonation(detail);
    } catch (e) { console.error(e); }
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
      const result = await createDonation({
        donorId: user.id,
        requirementId: pledgeReq.id,
        type: 'PHYSICAL_GOODS',
        items: [{ name: pledgeReq.title, quantity: Number(pledgeQty), unit: pledgeReq.unit }],
        pickupAddress: 'T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017'
      });
      if (result.success) {
        setPledgeReq(null);
        await loadData();
        const detail = await fetchDonationDetail(result.donation.id);
        setSelectedDonation(detail);
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

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

  const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
    MATCHED: { bg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', label: 'Matched' },
    PICKUP_SCHEDULED: { bg: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500', label: 'Pickup Scheduled' },
    PICKED_UP: { bg: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500', label: 'Picked Up' },
    IN_TRANSIT: { bg: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500 animate-pulse', label: 'In Transit' },
    DELIVERED: { bg: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500', label: 'Delivered' },
    CONFIRMED: { bg: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500', label: 'Confirmed' },
  };

  return (
    <div className="animate-fade-in pb-16">
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* ── DONOR HEADER ── Clean editorial, not a "card" ── */}
      <div className="relative overflow-hidden rounded-2xl gradient-hero text-white mb-8 mt-4">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
          {/* Welcome block */}
          <div className="lg:col-span-7 px-8 py-10 sm:px-12 sm:py-12">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 rounded-sm bg-teal-400" />
              <span className="text-[11px] font-mono font-bold tracking-[0.12em] uppercase text-teal-300">
                Donor Impact Portal
              </span>
            </div>
            <h1 className="font-display font-black text-[40px] sm:text-[52px] leading-[0.92] tracking-[-0.03em] text-white mb-4">
              Welcome,<br />{user.name.split(' ')[0]}.
            </h1>
            <p className="text-[14px] font-sans text-teal-100/80 max-w-md leading-relaxed">
              Every pledge you make is sealed into a cryptographic chain of custody.
              You receive mathematical proof when goods reach verified children in care.
            </p>
          </div>

          {/* Impact metrics — raw numbers, high contrast */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-teal-700/40 grid grid-cols-3 divide-x divide-teal-700/40">
            <div className="px-6 py-8 flex flex-col justify-center">
              <p className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-teal-400/80 mb-2">Delivered</p>
              <p className="text-[40px] font-display font-black leading-none tracking-[-0.02em] text-white">{totalDelivered}</p>
              <p className="text-[10px] font-mono text-emerald-400 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                Certified
              </p>
            </div>
            <div className="px-6 py-8 flex flex-col justify-center">
              <p className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-teal-400/80 mb-2">In Transit</p>
              <p className="text-[40px] font-display font-black leading-none tracking-[-0.02em] text-amber-300">{inTransitCount}</p>
              <p className="text-[10px] font-mono text-amber-400 mt-2 flex items-center gap-1">
                <Truck className="w-2.5 h-2.5" />
                Live track
              </p>
            </div>
            <div className="px-6 py-8 flex flex-col justify-center">
              <p className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-teal-400/80 mb-2">Sanctuaries</p>
              <p className="text-[40px] font-display font-black leading-none tracking-[-0.02em] text-white">{institutionsSupportedCount}</p>
              <p className="text-[10px] font-mono text-teal-400 mt-2 flex items-center gap-1">
                <Building className="w-2.5 h-2.5" />
                Supported
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── Minimal, underline style ── */}
      <div className="flex items-center justify-between border-b border-surface-border mb-8 pb-0">
        <div className="flex items-center gap-0">
          {(['TRACKING', 'EXPLORE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              className={`px-4 py-3 text-sm font-sans font-bold transition-all relative ${
                activeTab === tab
                  ? 'text-slate-900'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab === 'TRACKING' ? (
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Consignments
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-surface-subtle text-slate-600 border border-surface-border">{donations.length}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Donate
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-surface-subtle text-slate-600 border border-surface-border">{requirements.length}</span>
                </span>
              )}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleTabSwitch('EXPLORE')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect mb-3"
        >
          <Plus className="w-3.5 h-3.5" />
          New Donation
        </button>
      </div>

      {/* ── CONTENT ── */}
      {isTabSwitching ? (
        <DashboardSkeleton type="TAB_CONTENT" />
      ) : activeTab === 'TRACKING' ? (
        donations.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-slate-900 mb-2">No Consignments Yet</h3>
            <p className="text-sm font-sans text-slate-500 mb-6 max-w-sm mx-auto">
              Explore verified child sanctuaries to make your first cryptographically-tracked contribution.
            </p>
            <button
              onClick={() => setActiveTab('EXPLORE')}
              className="px-5 py-2.5 bg-slate-900 text-white text-sm font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect"
            >
              Browse Requirements
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── LEFT: Consignments list ── */}
            <div className="lg:col-span-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-sans font-bold text-slate-500 uppercase tracking-wider">
                  My Consignments
                </h2>
                <span className="text-[11px] font-mono text-slate-400">{donations.length} total</span>
              </div>

              <div className="border border-surface-border rounded-2xl overflow-hidden bg-white max-h-[680px] overflow-y-auto">
                {donations.map((d, i) => {
                  const isSelected = selectedDonation?.donation.id === d.id;
                  const isMonetary = d.type === 'FUNDS' || Boolean(d.monetaryAmountInr);
                  const sc = statusConfig[d.status] || statusConfig.MATCHED;

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDonation(d)}
                      className={`relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-all press-effect ${
                        i < donations.length - 1 ? 'border-b border-surface-border' : ''
                      } ${isSelected ? 'bg-slate-50' : 'hover:bg-surface-canvas'}`}
                    >
                      {/* Left accent */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-900" />}

                      <div className="flex-1 min-w-0">
                        {/* ID + status */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <code className="text-[10px] font-mono font-bold text-slate-800 bg-surface-subtle px-1.5 py-0.5 rounded-sm border border-surface-border">{d.id}</code>
                          {isMonetary ? (
                            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm border border-purple-200">
                              ₹ Monetary
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${sc.bg}`}>
                              <span className={`w-1 h-1 rounded-sm ${sc.dot}`} />
                              {sc.label}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-sans font-bold text-slate-900 leading-snug truncate">{d.requirementTitle}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-sans text-slate-500">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[160px]">{d.institutionName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono">{formatRelativeTime(d.createdAt)}</span>
                        </div>

                        {/* Amount or quantity */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-sans text-slate-600">
                            {isMonetary
                              ? <span className="font-mono font-bold">{formatIndianCurrency(d.monetaryAmountInr || d.items[0]?.estimatedValueInr || 0)}</span>
                              : d.items.map(it => `${it.quantity} ${it.unit}`).join(', ')
                            }
                          </span>
                          {isMonetary ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleInspectReceipt(d.id); }}
                              className="text-[10px] font-sans font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-white hover:bg-purple-50 px-2 py-1 rounded-sm border border-purple-200 transition-colors press-effect"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              80G
                            </button>
                          ) : d.status === 'CONFIRMED' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleInspectCertificate(d.id); }}
                              className="text-[10px] font-sans font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-white hover:bg-teal-50 px-2 py-1 rounded-sm border border-teal-200 transition-colors press-effect"
                            >
                              <Award className="w-3 h-3" />
                              Certificate
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 mt-1 shrink-0 transition-colors ${isSelected ? 'text-slate-800' : 'text-slate-300'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Detail panel ── */}
            <div className="lg:col-span-7 space-y-6">
              {selectedDonation ? (
                <div className="animate-fade-in">
                  {(() => {
                    const isSelectedMonetary = selectedDonation.donation.type === 'FUNDS' || Boolean(selectedDonation.donation.monetaryAmountInr);
                    const monetaryAmount = selectedDonation.donation.monetaryAmountInr || selectedDonation.donation.items[0]?.estimatedValueInr || 0;

                    return isSelectedMonetary ? (
                      /* ── Monetary detail ── */
                      <div className="bg-white border border-surface-border rounded-2xl overflow-hidden mb-6">
                        <div className="px-8 py-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-[11px] font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200">
                                {selectedDonation.donation.id}
                              </code>
                              <span className="text-[11px] font-mono text-purple-700">₹ Monetary</span>
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">
                              {selectedDonation.donation.requirementTitle}
                            </h3>
                            <p className="text-sm font-sans text-slate-500 mt-1">
                              Beneficiary: <strong className="text-slate-800">{selectedDonation.donation.institutionName}</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => handleInspectReceipt(selectedDonation.donation.id)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-800 text-white text-xs font-sans font-bold rounded-sm hover:bg-purple-900 transition-colors press-effect shrink-0"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            View 80G Receipt
                          </button>
                        </div>

                        <div className="px-8 py-6 bg-slate-900">
                          <p className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">Settled Contribution</p>
                          <p className="text-3xl font-display font-black text-white tracking-tight">{formatIndianCurrency(monetaryAmount)}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-mono text-emerald-400">Ledger Verified</span>
                            <span className="text-slate-600">·</span>
                            <code className="text-[10px] font-mono text-slate-400">
                              {selectedDonation.donation.upiTransactionId || 'TXN-2026-CONFIRMED'}
                            </code>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Physical consignment detail ── */
                      <div className="bg-white border border-surface-border rounded-2xl overflow-hidden mb-6">
                        <div className="px-8 py-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200">
                                {selectedDonation.donation.id}
                              </code>
                              <span className="text-[11px] font-mono text-slate-500">Physical Goods</span>
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">
                              {selectedDonation.donation.requirementTitle}
                            </h3>
                            <p className="text-sm font-sans text-slate-500 mt-1">
                              Destination: <strong className="text-slate-800">{selectedDonation.donation.institutionName}</strong>
                            </p>
                          </div>

                          {selectedDonation.qrDataUrl && (
                            <div className="flex items-center gap-4 bg-surface-canvas px-4 py-3 rounded-sm border border-surface-border shrink-0">
                              <img
                                src={selectedDonation.qrDataUrl}
                                alt="QR"
                                className="w-14 h-14 rounded-sm border border-surface-border bg-white p-0.5"
                              />
                              <div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Consignment QR</p>
                                <a
                                  href={selectedDonation.qrDataUrl}
                                  download={`CareTrace-${selectedDonation.donation.id}-QR.png`}
                                  className="text-[11px] font-sans font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
                                >
                                  Download <ArrowUpRight className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="px-8 py-4 flex flex-wrap gap-2">
                          {selectedDonation.donation.items.map((it: any, i: number) => (
                            <span key={i} className="text-xs font-sans font-bold text-slate-700 bg-surface-subtle border border-surface-border px-3 py-1.5 rounded-sm flex items-center gap-1.5">
                              {it.quantity} {it.unit} {it.name}
                              {it.estimatedValueInr && (
                                <span className="text-[10px] font-mono text-teal-700 bg-white px-1.5 py-0.5 rounded-sm border border-teal-100">
                                  ₹{Number(it.estimatedValueInr).toLocaleString('en-IN')}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Chain-of-Custody Timeline — signature component */}
                  <ChainOfCustodyTimeline
                    donation={selectedDonation.donation}
                    blocks={selectedDonation.blocks}
                    onInspectCertificate={() => handleInspectCertificate(selectedDonation.donation.id)}
                  />

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
                <div className="py-24 text-center">
                  <Package className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-base font-display font-bold text-slate-600">Select a consignment to view live tracking</p>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* ── EXPLORE TAB ── */
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Verified Requirements</h2>
              <p className="text-sm font-sans text-slate-500 mt-1">Authenticity-audited needs from registered Chennai child sanctuaries</p>
            </div>
            <a
              href="/requests"
              className="text-sm font-sans font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2 bg-surface-subtle hover:bg-surface-border px-4 py-2.5 rounded-sm border border-surface-border transition-colors press-effect shrink-0"
            >
              Public Board
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="border border-surface-border rounded-2xl overflow-hidden bg-white">
            {requirements.map((req, i) => {
              const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));
              const remaining = Math.max(0, req.targetQuantity - req.fulfilledQuantity);

              return (
                <div
                  key={req.id}
                  className={`relative flex items-center gap-6 px-6 py-4 transition-colors hover:bg-surface-canvas ${i < requirements.length - 1 ? 'border-b border-surface-border' : ''}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-sm shrink-0 ${req.urgency === 'CRITICAL' ? 'bg-rose-500' : req.urgency === 'HIGH' ? 'bg-amber-500' : 'bg-slate-300'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{req.category}</span>
                      {req.urgency === 'CRITICAL' && (
                        <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 rounded-sm">Critical</span>
                      )}
                    </div>
                    <p className="text-sm font-sans font-bold text-slate-900 leading-snug truncate">{req.title}</p>
                    <p className="text-[11px] font-sans text-slate-500 mt-0.5">{req.institutionName}</p>
                  </div>

                  <div className="hidden sm:block w-20 shrink-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-surface-subtle rounded-sm overflow-hidden">
                      <div className="h-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="hidden md:block text-right shrink-0">
                    <p className="text-base font-display font-black text-slate-900 leading-none">{remaining}</p>
                    <p className="text-[10px] font-mono text-slate-400">{req.unit}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setMonetaryRequirement(req)}
                      className="px-2.5 py-2 bg-surface-subtle border border-surface-border text-slate-600 text-[11px] font-bold rounded-sm hover:bg-surface-border transition-colors press-effect"
                      title="Fund"
                    >
                      <span className="font-display">₹</span>
                    </button>
                    <button
                      onClick={() => setPledgeReq(req)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect"
                    >
                      <Plus className="w-3 h-3" />
                      Goods
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pledge Modal */}
      {pledgeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-elevated border border-surface-border animate-slide-up relative">
            <h3 className="text-xl font-display font-bold text-slate-900 mb-1">Pledge Physical Goods</h3>
            <p className="text-sm font-sans text-slate-500 mb-6">
              For <strong className="text-slate-800">{pledgeReq.institutionName}</strong>
            </p>

            <div className="p-4 bg-surface-canvas border border-surface-border rounded-sm mb-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Requirement</p>
              <p className="text-sm font-sans font-bold text-slate-900">{pledgeReq.title}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold text-slate-700 mb-1.5">Quantity ({pledgeReq.unit})</label>
                <input
                  type="number"
                  min="1"
                  max={pledgeReq.targetQuantity - pledgeReq.fulfilledQuantity}
                  value={pledgeQty}
                  onChange={(e) => setPledgeQty(Number(e.target.value))}
                  className="w-full px-4 py-3 text-sm font-mono font-bold bg-surface-canvas border border-surface-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-bold text-slate-700 mb-1.5">Pickup Depot</label>
                <input
                  type="text"
                  readOnly
                  value="T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017"
                  className="w-full px-4 py-3 text-sm font-sans bg-surface-canvas border border-surface-border rounded-sm text-slate-500"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-[11px] font-mono text-slate-600 space-y-1.5">
                {['Donation ID & SHA-256 QR minted on pledge.', 'Block #0 sealed on tamper-resistant ledger.', 'Courier dispatched for authenticated pickup.'].map((s, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">{i + 1}.</span>
                    {s}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setPledgeReq(null)}
                className="px-4 py-2.5 text-sm font-sans font-bold text-slate-600 hover:text-slate-900 hover:bg-surface-subtle rounded-sm transition-colors press-effect"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDonation}
                disabled={isSubmitting || pledgeQty <= 0}
                className="px-5 py-2.5 text-sm font-sans font-bold bg-slate-900 text-white rounded-sm hover:bg-slate-800 transition-colors disabled:opacity-50 press-effect flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-sm animate-spin" />
                    Minting…
                  </>
                ) : 'Confirm & Generate QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {monetaryRequirement && (
        <PledgeMonetaryModal
          donorId={user.id}
          requirement={monetaryRequirement}
          onClose={() => setMonetaryRequirement(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      {activeReceipt && <TaxExemptionReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />}
      {certificate && <ProofOfDeliveryModal certificate={certificate} onClose={() => setCertificate(null)} />}
    </div>
  );
};
