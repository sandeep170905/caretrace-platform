import React, { useState, useEffect } from 'react';
import { Requirement, Institution, User, TaxExemptionReceipt } from '@caretrace/shared';
import { fetchRequirements, fetchInstitutions, createDonation } from '../api/client';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { PledgeMonetaryModal } from '../components/PledgeMonetaryModal';
import { TaxExemptionReceiptModal } from '../components/TaxExemptionReceiptModal';
import {
  Search,
  HeartHandshake,
  Building2,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  X,
  PackageCheck,
  SlidersHorizontal,
  TrendingUp,
  Zap,
  Clock,
  Calendar
} from 'lucide-react';

interface PublicRequestBoardProps {
  currentUser: User | null;
  isAuthenticated: boolean;
  onRequireAuth: (req: Requirement) => void;
  onPledgedSuccess?: (donationId: string) => void;
  onNavigateToVerify?: (donationId?: string) => void;
  refreshKey?: number;
}

const URGENCY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const categoryLabel: Record<string, string> = {
  ALL: 'All',
  FOOD: 'Food',
  CLOTHING: 'Clothing',
  MEDICINE: 'Healthcare',
  EDUCATION: 'Education',
  SUPPLIES: 'Supplies',
};

export const PublicRequestBoard: React.FC<PublicRequestBoardProps> = ({
  currentUser,
  isAuthenticated,
  onRequireAuth,
  onPledgedSuccess,
  onNavigateToVerify,
  refreshKey
}) => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');

  const [pledgingReq, setPledgingReq] = useState<Requirement | null>(null);
  const [pledgeQuantity, setPledgeQuantity] = useState<number>(10);
  const [pickupAddress, setPickupAddress] = useState<string>('Anna Nagar West Logistics Hub, Chennai 600040');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState<boolean>(false);
  const [pledgeSuccessId, setPledgeSuccessId] = useState<string | null>(null);

  const [monetaryRequirement, setMonetaryRequirement] = useState<Requirement | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<TaxExemptionReceipt | null>(null);

  const handleMonetaryClick = (req: Requirement) => {
    if (currentUser && isAuthenticated && (currentUser.role === 'DONOR' || currentUser.role === 'REVIEWER_DEMO')) {
      setMonetaryRequirement(req);
    } else {
      onRequireAuth(req);
    }
  };

  const handlePaymentSuccess = async (receipt: TaxExemptionReceipt) => {
    setMonetaryRequirement(null);
    setActiveReceipt(receipt);
    if (onPledgedSuccess) onPledgedSuccess(receipt.donationId);
    await loadData();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqs, insts] = await Promise.all([fetchRequirements(), fetchInstitutions()]);
      setRequirements(reqs);
      setInstitutions(insts);
    } catch (e) {
      console.error('Failed to load public requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [refreshKey]);

  const verifiedInstMap = new Map(institutions.filter(i => i.verified).map(i => [i.id, i]));

  const filteredRequirements = requirements
    .filter(req => {
      const inst = verifiedInstMap.get(req.institutionId);
      if (!inst) return false;
      if (req.status === 'FULFILLED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!req.title.toLowerCase().includes(q) && !req.description.toLowerCase().includes(q) && !(req.institutionName || inst.name).toLowerCase().includes(q)) return false;
      }
      if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
      if (selectedUrgency !== 'ALL' && req.urgency !== selectedUrgency) return false;
      if (selectedLocality !== 'ALL') {
        const loc = inst.city || inst.address;
        if (!loc.toLowerCase().includes(selectedLocality.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9));

  const handleDonateClick = (req: Requirement) => {
    if (currentUser && isAuthenticated && (currentUser.role === 'DONOR' || currentUser.role === 'REVIEWER_DEMO')) {
      setPledgingReq(req);
      setPledgeQuantity(Math.max(1, req.targetQuantity - req.fulfilledQuantity));
    } else {
      onRequireAuth(req);
    }
  };

  const handleConfirmPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgingReq || !currentUser) return;
    setIsSubmittingPledge(true);
    try {
      const res = await createDonation({
        donorId: currentUser.id,
        requirementId: pledgingReq.id,
        type: 'PHYSICAL_GOODS',
        items: [{ name: pledgingReq.title, quantity: Number(pledgeQuantity), unit: pledgingReq.unit }],
        pickupAddress
      });
      if (res.success) {
        setPledgeSuccessId(res.donation.id);
        if (onPledgedSuccess) onPledgedSuccess(res.donation.id);
        await loadData();
      }
    } catch (err) {
      console.error('Pledge submission error:', err);
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  const urgencyConfig = {
    CRITICAL: { dot: 'bg-rose-500', text: 'text-rose-700', label: 'Critical' },
    HIGH: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'High' },
    MEDIUM: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Medium' },
    LOW: { dot: 'bg-slate-300', text: 'text-slate-500', label: 'Routine' },
  };

  const featuredReq = filteredRequirements[0];
  const restReqs = filteredRequirements.slice(1);

  return (
    <div className="animate-fade-in pb-16">
      {/* Broadcast Announcements Banner */}
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* ── HERO ── Full-bleed, editorial layout, large number contrast */}
      <div className="relative overflow-hidden rounded-2xl gradient-hero text-white mb-8 mt-4">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
          {/* Left: editorial content block */}
          <div className="lg:col-span-8 px-8 py-10 sm:px-12 sm:py-14">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-sm bg-teal-400" />
              <span className="text-[11px] font-mono font-bold tracking-[0.12em] uppercase text-teal-300">
                Public Ledger — Verified Needs
              </span>
            </div>

            {/* Headline: push far beyond "safe" size */}
            <h1 className="font-display font-black text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.92] tracking-[-0.03em] text-white mb-6">
              Direct<br />
              <span className="text-teal-300">Audited</span><br />
              Needs.
            </h1>

            <p className="text-[15px] font-sans text-teal-100/80 max-w-lg leading-[1.6] mb-8">
              Every item is authenticity-scored, legally verified, and cryptographically
              tracked depot-to-doorstep for accredited child sanctuaries in Chennai.
            </p>

            {onNavigateToVerify && (
              <button
                type="button"
                onClick={() => onNavigateToVerify()}
                className="inline-flex items-center gap-2.5 px-5 py-3 bg-white text-teal-950 text-sm font-sans font-bold rounded-sm hover:bg-teal-50 transition-colors shadow-sm press-effect"
              >
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Verify a Donation
                <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
              </button>
            )}
          </div>

          {/* Right: stacked stats — dramatic number size contrast */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-teal-700/40 px-8 py-10 sm:px-10 sm:py-14 flex flex-col justify-between gap-8">
            <div>
              <p className="text-[11px] font-mono font-bold tracking-[0.1em] uppercase text-teal-400/80 mb-1">Verified Sanctuaries</p>
              <p className="text-[56px] font-display font-black leading-none tracking-[-0.03em] text-white">
                {institutions.filter(i => i.verified).length}
              </p>
            </div>
            <div className="h-px bg-teal-700/40" />
            <div>
              <p className="text-[11px] font-mono font-bold tracking-[0.1em] uppercase text-teal-400/80 mb-1">Open Verified Needs</p>
              <p className="text-[56px] font-display font-black leading-none tracking-[-0.03em] text-teal-300">
                {requirements.filter(r => r.status === 'VERIFIED').length}
              </p>
            </div>
            <div className="h-px bg-teal-700/40" />
            <div>
              <p className="text-[11px] font-mono font-bold tracking-[0.1em] uppercase text-teal-400/80 mb-2">Custody Ledger</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-emerald-400 animate-pulse" />
                <span className="text-sm font-mono font-bold text-emerald-300 tracking-wide">100% On-Chain</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── Segmented controls, not card */}
      <div className="mb-8">
        {/* Search + locality row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search needs, items, orphanages…"
              className="w-full pl-9 pr-4 py-2.5 text-sm font-sans bg-white border border-surface-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent placeholder:text-slate-400 text-slate-800 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="px-3 py-2.5 text-sm font-sans bg-white border border-surface-border rounded-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="ALL">All Localities</option>
              <option value="Tambaram">Tambaram</option>
              <option value="Ambattur">Ambattur</option>
              <option value="Adyar">Adyar</option>
              <option value="Velachery">Velachery</option>
              <option value="T. Nagar">T. Nagar</option>
              <option value="Anna Nagar">Anna Nagar</option>
              <option value="Porur">Porur</option>
              <option value="Perambur">Perambur</option>
              <option value="Sholinganallur">Sholinganallur</option>
              <option value="Guindy">Guindy</option>
              <option value="Mylapore">Mylapore</option>
              <option value="Kodambakkam">Kodambakkam</option>
              <option value="Avadi">Avadi</option>
              <option value="Pallavaram">Pallavaram</option>
            </select>
          </div>
        </div>

        {/* Category + urgency as pill toggles */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-1.5">
            {Object.entries(categoryLabel).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setSelectedCategory(val)}
                className={`px-3 py-1.5 text-[12px] font-sans font-bold rounded-sm transition-all press-effect ${
                  selectedCategory === val
                    ? 'bg-slate-900 text-white'
                    : 'bg-surface-subtle text-slate-600 hover:bg-surface-border hover:text-slate-900'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="w-px bg-surface-border" />

          <div className="flex items-center gap-1.5">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(u => {
              const cfg = u === 'ALL' ? null : urgencyConfig[u as keyof typeof urgencyConfig];
              return (
                <button
                  key={u}
                  onClick={() => setSelectedUrgency(u)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-sans font-bold rounded-sm transition-all press-effect ${
                    selectedUrgency === u
                      ? 'bg-slate-900 text-white'
                      : 'bg-surface-subtle text-slate-600 hover:bg-surface-border hover:text-slate-900'
                  }`}
                >
                  {cfg && <span className={`w-1.5 h-1.5 rounded-sm ${selectedUrgency === u ? 'bg-white' : cfg.dot}`} />}
                  {u === 'ALL' ? 'All Urgencies' : cfg!.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── NEEDS ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-sm animate-spin" />
            <span className="text-[11px] font-mono text-slate-400 tracking-wider uppercase">Loading verified needs</span>
          </div>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="py-24 text-center">
          <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-slate-800 mb-2">No matching requirements</h3>
          <p className="text-sm font-sans text-slate-500 mb-6">Reset your filters to view all verified childcare needs.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedUrgency('ALL'); setSelectedLocality('ALL'); }}
            className="px-4 py-2.5 bg-slate-900 text-white text-sm font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── FEATURED CARD: First / most urgent — full width, dominant ── */}
          {featuredReq && (() => {
            const inst = verifiedInstMap.get(featuredReq.institutionId);
            const progress = Math.min(100, Math.round((featuredReq.fulfilledQuantity / featuredReq.targetQuantity) * 100));
            const remaining = Math.max(0, featuredReq.targetQuantity - featuredReq.fulfilledQuantity);
            const urg = urgencyConfig[featuredReq.urgency as keyof typeof urgencyConfig] || urgencyConfig.LOW;

            return (
              <div className="relative overflow-hidden bg-white border border-surface-border rounded-2xl animate-fade-up">
                {/* Urgency stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${featuredReq.urgency === 'CRITICAL' ? 'bg-rose-500' : featuredReq.urgency === 'HIGH' ? 'bg-amber-500' : 'bg-slate-300'}`} />

                <div className="pl-6 pr-6 sm:pr-8 py-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Content */}
                  <div className="lg:col-span-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        <span className={`w-1.5 h-1.5 rounded-sm ${urg.dot}`} />
                        {urg.label} Priority
                      </span>
                      <span className="text-slate-200">·</span>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">{featuredReq.category}</span>
                      <span className="text-slate-200">·</span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700">
                        <ShieldCheck className="w-3 h-3" />
                        {featuredReq.authenticityScore}% Authentic
                      </span>
                      {featuredReq.urgency === 'CRITICAL' && (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-200">
                          <Zap className="w-2.5 h-2.5" />
                          Urgent
                        </span>
                      )}
                      {featuredReq.deadline && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            Target Date: {new Date(featuredReq.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight tracking-[-0.01em] mb-3">
                      {featuredReq.title}
                    </h2>

                    <p className="text-sm font-sans text-slate-500 leading-relaxed mb-4 max-w-2xl">
                      {featuredReq.description}
                    </p>

                    {inst && (
                      <div className="flex items-center gap-2 text-sm font-sans text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">{inst.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{inst.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Metrics + CTA */}
                  <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                    {/* Quantity emphasis */}
                    <div>
                      <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Still Needed</p>
                      <p className="text-4xl font-display font-black text-slate-900 leading-none tracking-[-0.02em]">
                        {remaining}
                        <span className="text-lg font-sans font-medium text-slate-400 ml-2">{featuredReq.unit}</span>
                      </p>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-slate-400">{progress}% fulfilled</span>
                        <span className="text-[11px] font-mono text-slate-400">{featuredReq.targetQuantity} total</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-subtle rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-teal-600 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMonetaryClick(featuredReq)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface-subtle border border-surface-border text-slate-700 text-xs font-sans font-bold rounded-sm hover:bg-surface-border transition-colors press-effect"
                      >
                        <span className="font-display text-sm">₹</span>
                        Fund
                      </button>
                      <button
                        onClick={() => handleDonateClick(featuredReq)}
                        className="flex-[2] flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Pledge Goods
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── COMPACT ROWS: Remaining requirements ── */}
          {restReqs.length > 0 && (
            <div className="border border-surface-border rounded-2xl overflow-hidden bg-white">
              {restReqs.map((req, i) => {
                const inst = verifiedInstMap.get(req.institutionId);
                const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));
                const remaining = Math.max(0, req.targetQuantity - req.fulfilledQuantity);
                const urg = urgencyConfig[req.urgency as keyof typeof urgencyConfig] || urgencyConfig.LOW;

                return (
                  <div
                    key={req.id}
                    className={`relative flex items-center gap-6 px-6 py-4 transition-colors hover:bg-surface-canvas ${i < restReqs.length - 1 ? 'border-b border-surface-border' : ''}`}
                  >
                    {/* Urgency dot */}
                    <div className={`w-1.5 h-1.5 rounded-sm shrink-0 ${urg.dot}`} />

                    {/* Category + title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{req.category}</span>
                        {req.urgency === 'CRITICAL' && (
                          <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 rounded-sm">Critical</span>
                        )}
                        {req.deadline && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 rounded-sm border border-amber-200">
                            <Calendar className="w-2.5 h-2.5 text-amber-600" />
                            Due: {new Date(req.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-sans font-bold text-slate-900 leading-snug truncate">{req.title}</p>
                      {inst && (
                        <p className="text-[11px] font-sans text-slate-500 mt-0.5 truncate">{inst.name} · {inst.city}</p>
                      )}
                    </div>

                    {/* Progress bar — minimal */}
                    <div className="hidden sm:block w-24 shrink-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400">{progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-surface-subtle rounded-sm overflow-hidden">
                        <div className="h-full bg-teal-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="hidden md:block text-right shrink-0">
                      <p className="text-base font-display font-black text-slate-900 leading-none">{remaining}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{req.unit} needed</p>
                    </div>

                    {/* Score */}
                    <span className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-emerald-700 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      {req.authenticityScore}%
                    </span>

                    {/* CTAs */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleMonetaryClick(req)}
                        className="px-2.5 py-2 bg-surface-subtle border border-surface-border text-slate-600 text-[11px] font-sans font-bold rounded-sm hover:bg-surface-border transition-colors press-effect"
                        title="Contribute Funds"
                      >
                        <span className="font-display">₹</span>
                      </button>
                      <button
                        onClick={() => handleDonateClick(req)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-[11px] font-sans font-bold rounded-sm hover:bg-slate-800 transition-colors press-effect"
                      >
                        <HeartHandshake className="w-3 h-3" />
                        Pledge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PLEDGE MODAL ── */}
      {pledgingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-elevated border border-surface-border relative max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-8">
              <button
                onClick={() => { setPledgingReq(null); setPledgeSuccessId(null); }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-sm hover:bg-surface-subtle transition-colors press-effect"
              >
                <X className="w-4 h-4" />
              </button>

              {pledgeSuccessId ? (
                <div className="text-center py-4 space-y-5">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center justify-center mx-auto">
                    <PackageCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Donation Pledged</h3>
                    <p className="text-sm font-sans text-slate-600 leading-relaxed">
                      Consignment <code className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-sm border border-teal-200">{pledgeSuccessId}</code> is sealed on the ledger.
                    </p>
                  </div>
                  <div className="text-left p-4 bg-surface-canvas border border-surface-border rounded-sm space-y-2">
                    {['Genesis block sealed with SHA-256 hash.', 'QR code generated for courier pickup.', 'Track live progress in your Donor Dashboard.'].map(msg => (
                      <p key={msg} className="flex items-center gap-2 text-xs font-sans text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {msg}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => { setPledgingReq(null); setPledgeSuccessId(null); }}
                    className="w-full py-3 bg-slate-900 text-white rounded-sm text-sm font-sans font-bold hover:bg-slate-800 transition-colors press-effect"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmPledge} className="space-y-6">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-700">Pledge Donation</span>
                    <h3 className="text-xl font-display font-bold text-slate-900 mt-2 leading-tight">{pledgingReq.title}</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {pledgingReq.institutionName}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans font-bold text-slate-700">
                      Pledge Quantity ({pledgingReq.unit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, pledgingReq.targetQuantity - pledgingReq.fulfilledQuantity)}
                      required
                      value={pledgeQuantity}
                      onChange={(e) => setPledgeQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 text-sm font-mono font-bold bg-surface-canvas border border-surface-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 transition-all"
                    />
                    <span className="text-[11px] font-sans text-slate-400">
                      Still needed: <strong className="text-slate-700">{pledgingReq.targetQuantity - pledgingReq.fulfilledQuantity} {pledgingReq.unit}</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-sans font-bold text-slate-700">Pickup Address</label>
                    <input
                      type="text"
                      required
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="e.g. Adyar Depot, LB Road, Chennai 600020"
                      className="w-full px-4 py-3 text-sm font-sans bg-surface-canvas border border-surface-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800 transition-all"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                    <p className="text-[11px] font-mono text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">Chain-of-Custody: </span>
                      Your pledge generates Block #0 on the SHA-256 tamper-resistant ledger and enters courier dispatch queue.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPledge}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-sm text-sm font-sans font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 press-effect flex justify-center items-center gap-2"
                  >
                    {isSubmittingPledge ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-sm animate-spin" />
                        Sealing on Ledger…
                      </>
                    ) : 'Confirm & Commit Pledge'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {monetaryRequirement && currentUser && (
        <PledgeMonetaryModal
          donorId={currentUser.id}
          requirement={monetaryRequirement}
          onClose={() => setMonetaryRequirement(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {activeReceipt && (
        <TaxExemptionReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
