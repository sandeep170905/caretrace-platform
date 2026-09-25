import React, { useState, useEffect } from 'react';
import { Requirement, Institution, User, TaxExemptionReceipt } from '@caretrace/shared';
import { fetchRequirements, fetchInstitutions, createDonation } from '../api/client';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { PledgeMonetaryModal } from '../components/PledgeMonetaryModal';
import { TaxExemptionReceiptModal } from '../components/TaxExemptionReceiptModal';
import {
  Search,
  Filter,
  HeartHandshake,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
  PackageCheck
} from 'lucide-react';

interface PublicRequestBoardProps {
  currentUser: User | null;
  isAuthenticated: boolean;
  onRequireAuth: (req: Requirement) => void;
  onPledgedSuccess?: (donationId: string) => void;
  onNavigateToVerify?: (donationId?: string) => void;
  refreshKey?: number;
}

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

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');

  // Pledge modal state
  const [pledgingReq, setPledgingReq] = useState<Requirement | null>(null);
  const [pledgeQuantity, setPledgeQuantity] = useState<number>(10);
  const [pickupAddress, setPickupAddress] = useState<string>('Anna Nagar West Logistics Hub, Chennai 600040');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState<boolean>(false);
  const [pledgeSuccessId, setPledgeSuccessId] = useState<string | null>(null);

  // Monetary contribution state
  const [monetaryRequirement, setMonetaryRequirement] = useState<Requirement | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<TaxExemptionReceipt | null>(null);

  const handleMonetaryClick = (req: Requirement) => {
    if (currentUser && isAuthenticated && currentUser.role === 'DONOR') {
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
      const [reqs, insts] = await Promise.all([
        fetchRequirements(),
        fetchInstitutions()
      ]);
      setRequirements(reqs);
      setInstitutions(insts);
    } catch (e) {
      console.error('Failed to load public requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Verified institutions map
  const verifiedInstMap = new Map(institutions.filter(i => i.verified).map(i => [i.id, i]));

  // Get distinct localities from verified institutions
  const localities = Array.from(
    new Set(
      institutions
        .filter(i => i.verified)
        .map(i => i.city || i.address.split(',').pop()?.trim())
        .filter(Boolean)
    )
  );

  // Filter open, verified requirements from verified institutions
  const filteredRequirements = requirements.filter(req => {
    const inst = verifiedInstMap.get(req.institutionId);
    // Requirement must belong to a verified institution and not be fulfilled
    if (!inst) return false;
    if (req.status === 'FULFILLED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = req.title.toLowerCase().includes(q);
      const matchDesc = req.description.toLowerCase().includes(q);
      const matchInst = (req.institutionName || inst.name).toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchInst) return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL' && req.category !== selectedCategory) {
      return false;
    }

    // Urgency filter
    if (selectedUrgency !== 'ALL' && req.urgency !== selectedUrgency) {
      return false;
    }

    // Locality filter
    if (selectedLocality !== 'ALL') {
      const instLocality = inst.city || inst.address;
      if (!instLocality.toLowerCase().includes(selectedLocality.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const handleDonateClick = (req: Requirement) => {
    // If user is already authenticated as a Donor, open pledge modal
    if (currentUser && isAuthenticated && currentUser.role === 'DONOR') {
      setPledgingReq(req);
      setPledgeQuantity(Math.max(1, req.targetQuantity - req.fulfilledQuantity));
    } else {
      // Guest or unauthenticated persona: trigger login/registration prompt
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
        items: [
          {
            name: pledgingReq.title,
            quantity: Number(pledgeQuantity),
            unit: pledgingReq.unit
          }
        ],
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

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Broadcast Announcements Banner */}
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* Asymmetric Hero Banner (Teal / Emerald Gradient Direction) */}
      <div className="relative overflow-hidden rounded-[2.5rem] gradient-hero text-white shadow-elevated border border-teal-700/50">
        <div className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-teal-400/25 blur-[100px] rounded-full rotate-12" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[80%] bg-emerald-400/20 blur-[80px] rounded-full" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 p-8 sm:p-12 lg:pr-6">
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-300/30 text-xs font-sans font-bold tracking-wide text-teal-200 mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>Public Ledger Verified Childcare Needs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.1] mb-5 text-white">
              Direct, Audited Needs for Children in Care
            </h1>
            
            <p className="text-base sm:text-lg font-sans text-teal-100/90 mb-8 max-w-xl leading-relaxed">
              Every listed item is legally vetted, scored for demand authenticity, and cryptographically tracked from donor depot to verified child institution handover.
            </p>

            {onNavigateToVerify && (
              <button
                type="button"
                onClick={() => onNavigateToVerify()}
                className="inline-flex items-center space-x-2.5 px-6 py-3.5 bg-white hover:bg-teal-50 text-teal-950 font-sans font-bold text-sm rounded-xl transition-all shadow-glass press-effect hover-lift"
              >
                <ShieldCheck className="w-4.5 h-4.5 text-teal-800" />
                <span>Verify a Donation on Public Ledger</span>
                <ArrowRight className="w-4 h-4 ml-1 text-teal-700" />
              </button>
            )}
          </div>
          
          <div className="lg:col-span-5 p-8 sm:p-12 lg:pl-8 flex flex-col justify-center h-full border-t lg:border-t-0 lg:border-l border-teal-700/50 bg-teal-950/20 backdrop-blur-md">
            <div className="space-y-6">
              <div className="group">
                <span className="text-xs font-sans font-bold uppercase tracking-widest text-teal-200/90 block mb-1.5">Verified Sanctuaries</span>
                <p className="text-4xl font-display font-bold text-white group-hover:text-teal-200 transition-colors">
                  {institutions.filter(i => i.verified).length}
                </p>
              </div>
              
              <div className="w-full h-px bg-teal-700/60" />
              
              <div className="group">
                <span className="text-xs font-sans font-bold uppercase tracking-widest text-teal-200/90 block mb-1.5">Open Verified Needs</span>
                <p className="text-4xl font-display font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                  {requirements.filter(r => r.status === 'VERIFIED').length}
                </p>
              </div>
              
              <div className="w-full h-px bg-teal-700/60" />
              
              <div className="group">
                <span className="text-xs font-sans font-bold uppercase tracking-widest text-teal-200/90 block mb-1.5">Custody Ledger</span>
                <p className="text-2xl sm:text-3xl font-display font-bold text-amber-300 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>100% On-Chain</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Keyword Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search needs, items, or orphanages..."
              className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 text-xs font-sans bg-surface-canvas border border-surface-border rounded-xl font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm cursor-pointer hover:border-teal-300 transition-all"
            >
              <option value="ALL">All Categories</option>
              <option value="FOOD">Food & Nutrition</option>
              <option value="CLOTHING">Clothing & Bedding</option>
              <option value="MEDICINE">Healthcare & Medicine</option>
              <option value="EDUCATION">Education & Books</option>
              <option value="SUPPLIES">Sanitary & Shelter</option>
            </select>

            {/* Urgency */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="px-4 py-2.5 text-xs font-sans bg-surface-canvas border border-surface-border rounded-xl font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm cursor-pointer hover:border-teal-300 transition-all"
            >
              <option value="ALL">All Urgencies</option>
              <option value="CRITICAL">Critical Need</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Routine / Low</option>
            </select>

            {/* Locality */}
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="px-4 py-2.5 text-xs font-sans bg-surface-canvas border border-surface-border rounded-xl font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm cursor-pointer hover:border-teal-300 transition-all"
            >
              <option value="ALL">All Localities</option>
              <option value="Tambaram">Tambaram</option>
              <option value="Ambattur">Ambattur</option>
              <option value="Anna Nagar">Anna Nagar</option>
              <option value="T. Nagar">T. Nagar</option>
              <option value="Poonamallee">Poonamallee</option>
              {localities.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Needs Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full" />
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-16 text-center border border-surface-border shadow-sm space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-display font-bold text-slate-800">No matching requirements found</h3>
          <p className="text-sm font-sans text-slate-500 max-w-sm mx-auto">
            Try resetting your locality, category, or search filters to view other verified childcare needs.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedUrgency('ALL');
              setSelectedLocality('ALL');
            }}
            className="px-5 py-2.5 bg-surface-subtle text-teal-800 hover:bg-teal-50 hover:text-teal-900 border border-surface-border rounded-xl text-xs font-sans font-bold transition-colors shadow-sm press-effect mt-2"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequirements.map((req, i) => {
            const inst = verifiedInstMap.get(req.institutionId);
            const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));
            const remaining = Math.max(0, req.targetQuantity - req.fulfilledQuantity);

            return (
              <div
                key={req.id}
                className={`card-premium p-6 flex flex-col justify-between animate-fade-up bg-surface-card border border-surface-border rounded-2xl hover:border-teal-300 hover:shadow-card-hover transition-all duration-300 stagger-${(i % 6) + 1}`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-sans uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-surface-subtle text-slate-600 border border-surface-border shadow-sm">
                      {req.category}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-full shadow-sm ${
                          req.urgency === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : req.urgency === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {req.urgency}
                      </span>

                      <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{req.authenticityScore}% Score</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">
                    {req.title}
                  </h3>
                  <p className="text-sm font-sans text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>

                  {/* Institution Locality Card */}
                  {inst && (
                    <div className="mt-5 p-3.5 bg-surface-canvas rounded-xl border border-surface-border flex items-start space-x-3 shadow-inner">
                      <Building2 className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                      <div className="truncate">
                        <p className="text-sm font-sans font-bold text-slate-800 truncate">{inst.name}</p>
                        <p className="text-xs font-sans font-medium text-slate-500 flex items-center space-x-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{inst.address}, {inst.city}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fulfillment Progress */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-sans text-slate-600">
                      <span className="font-medium">Needed: <strong className="text-slate-900 font-mono font-bold">{remaining} {req.unit}</strong></span>
                      <span className="font-mono font-bold text-[11px] text-teal-700">{progress}% Fulfilled</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-subtle rounded-full overflow-hidden border border-surface-border/50 shadow-inner">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Donate CTA Buttons: UPI & Goods */}
                <div className="mt-6 pt-5 border-t border-surface-border flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-slate-400 font-mono truncate max-w-[90px] bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                    {req.id.slice(0, 14)}
                  </span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleMonetaryClick(req)}
                      className="px-3.5 py-2 min-h-[40px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-sans font-bold shadow-sm transition-colors flex items-center space-x-1.5 press-effect hover-lift"
                      title="Pledge Monetary Contribution"
                    >
                      <span className="font-display font-bold text-sm">₹</span>
                      <span>Contribute Funds</span>
                    </button>
                    <button
                      onClick={() => handleDonateClick(req)}
                      className="flex items-center space-x-1.5 px-4 py-2 min-h-[40px] gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal hover-lift transition-all press-effect"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Pledge Goods</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pledge Donation Modal */}
      {pledgingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevated border border-surface-border relative max-h-[90vh] overflow-y-auto animate-slide-up card-premium">
            <button
              onClick={() => { setPledgingReq(null); setPledgeSuccessId(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-surface-subtle transition-colors press-effect"
            >
              <X className="w-5 h-5" />
            </button>

            {pledgeSuccessId ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <PackageCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900">Donation Pledged Successfully!</h3>
                <p className="text-sm font-sans text-slate-600 leading-relaxed">
                  Consignment <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">{pledgeSuccessId}</span> has been entered onto the ledger and is awaiting courier dispatch.
                </p>
                <div className="p-4 bg-surface-subtle border border-surface-border rounded-xl text-xs font-sans text-left text-slate-600 space-y-2 shadow-inner">
                  <p className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Genesis block sealed with SHA-256 hash.</span></p>
                  <p className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>QR code generated for courier pickup authentication.</span></p>
                  <p className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Track live progress in your Donor Dashboard.</span></p>
                </div>
                <button
                  onClick={() => { setPledgingReq(null); setPledgeSuccessId(null); }}
                  className="w-full py-3 mt-2 gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal hover-lift transition-all press-effect"
                >
                  Close & View Consignments
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmPledge} className="space-y-5">
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shadow-sm">
                    Pledge Donation
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mt-3">
                    {pledgingReq.title}
                  </h3>
                  <p className="text-sm font-sans text-slate-500 mt-1 flex items-center space-x-1.5">
                    <span>Destination:</span> <Building2 className="w-4 h-4 text-slate-400" /> <strong className="text-slate-800">{pledgingReq.institutionName}</strong>
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
                    className="w-full px-4 py-3 text-sm bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold text-slate-900 shadow-inner transition-all"
                  />
                  <span className="text-[11px] font-sans font-medium text-slate-500 mt-1 block">
                    Needed to complete requirement: <strong className="text-slate-700">{pledgingReq.targetQuantity - pledgingReq.fulfilledQuantity} {pledgingReq.unit}</strong>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-slate-700">
                    Pickup Depot / Collection Address
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. Adyar Depot, LB Road, Chennai 600020"
                    className="w-full px-4 py-3 text-sm font-sans bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800 font-medium shadow-inner transition-all"
                  />
                </div>

                <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-950 space-y-2 shadow-sm">
                  <p className="font-sans font-bold flex items-center space-x-1.5 text-teal-900">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700" />
                    <span>Cryptographic Chain-of-Custody:</span>
                  </p>
                  <p className="text-[11px] font-sans font-medium text-teal-800/90 leading-relaxed pl-6">
                    Your pledge will generate block #0 on the tamper-resistant ledger and enter the courier dispatch queue.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPledge}
                  className="w-full py-3.5 gradient-primary text-white rounded-xl text-sm font-sans font-bold shadow-glow-teal hover-lift transition-all disabled:opacity-50 press-effect flex justify-center items-center space-x-2"
                >
                  {isSubmittingPledge ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sealing on Ledger...</span>
                    </>
                  ) : 'Confirm & Commit Pledge'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Monetary Contribution Pledge Modal */}
      {monetaryRequirement && currentUser && (
        <PledgeMonetaryModal
          donorId={currentUser.id}
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
    </div>
  );
};

