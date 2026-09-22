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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Broadcast Announcements Banner */}
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* Public Hero Banner */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/30 border border-teal-300/30 text-xs text-teal-200 font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>Public Ledger Verified Childcare Needs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Direct, Audited Needs for Children in Care
          </h1>
          <p className="text-sm text-teal-100/90 mt-2.5 leading-relaxed">
            Every listed item is legally vetted, scored for demand authenticity, and cryptographically tracked from donor depot to verified child institution handover.
          </p>

          {onNavigateToVerify && (
            <div className="mt-5 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => onNavigateToVerify()}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Verify a Donation on Public Ledger &rarr;</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-teal-700/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10">
            <span className="text-[11px] text-teal-200 font-medium">Verified Sanctuaries</span>
            <p className="text-2xl font-bold font-mono text-white mt-0.5">
              {institutions.filter(i => i.verified).length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10">
            <span className="text-[11px] text-teal-200 font-medium">Open Verified Needs</span>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-0.5">
              {requirements.filter(r => r.status === 'VERIFIED').length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-teal-200 font-medium">Custody Ledger</span>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-0.5">
              100% On-Chain
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E7E8E2] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Keyword Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search needs, items, or orphanages..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
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
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
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
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
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
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full" />
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching requirements found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your locality, category, or search filters to view other verified childcare needs.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedUrgency('ALL');
              setSelectedLocality('ALL');
            }}
            className="px-4 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-xl text-xs font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequirements.map((req) => {
            const inst = verifiedInstMap.get(req.institutionId);
            const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));
            const remaining = Math.max(0, req.targetQuantity - req.fulfilledQuantity);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#E7E8E2] hover:border-teal-400 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.category}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.urgency === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : req.urgency === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.urgency}
                      </span>

                      <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{req.authenticityScore}% Score</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 mt-3 leading-snug">
                    {req.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                    {req.description}
                  </p>

                  {/* Institution Locality Card */}
                  {inst && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                      <Building2 className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{inst.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{inst.address}, {inst.city}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fulfillment Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="font-medium">Needed: <strong className="text-slate-900 font-mono">{remaining} {req.unit}</strong></span>
                      <span className="font-mono text-[11px] text-slate-500">{progress}% Fulfilled</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-700 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Donate CTA Buttons: UPI & Goods */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[100px]">
                    {req.id.slice(0, 14)}
                  </span>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleMonetaryClick(req)}
                      className="px-3 py-2 min-h-[40px] sm:min-h-[36px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1"
                      title="Pledge Monetary Contribution"
                    >
                      <span className="font-bold">₹</span>
                      <span>Contribute Funds</span>
                    </button>
                    <button
                      onClick={() => handleDonateClick(req)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 min-h-[40px] sm:min-h-[36px] bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all active:scale-95"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setPledgingReq(null); setPledgeSuccessId(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {pledgeSuccessId ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                  <PackageCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Donation Pledged Successfully!</h3>
                <p className="text-xs text-slate-600">
                  Consignment <span className="font-mono font-bold text-teal-800">{pledgeSuccessId}</span> has been entered onto the ledger and is awaiting courier dispatch.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left text-slate-600 space-y-1">
                  <p>• Genesis block sealed with SHA-256 hash.</p>
                  <p>• QR code generated for courier pickup authentication.</p>
                  <p>• Track live progress in your Donor Dashboard.</p>
                </div>
                <button
                  onClick={() => { setPledgingReq(null); setPledgeSuccessId(null); }}
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow transition-all"
                >
                  Close & View Consignments
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmPledge} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    Pledge Donation
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    {pledgingReq.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Destination: <strong className="text-slate-800">{pledgingReq.institutionName}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pledge Quantity ({pledgingReq.unit})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, pledgingReq.targetQuantity - pledgingReq.fulfilledQuantity)}
                    required
                    value={pledgeQuantity}
                    onChange={(e) => setPledgeQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono font-bold text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Needed to complete requirement: {pledgingReq.targetQuantity - pledgingReq.fulfilledQuantity} {pledgingReq.unit}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Depot / Collection Address
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. Adyar Depot, LB Road, Chennai 600020"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                  />
                </div>

                <div className="p-3 bg-teal-50/60 border border-teal-200/60 rounded-xl text-xs text-teal-900 space-y-1">
                  <p className="font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Cryptographic Chain-of-Custody:</span>
                  </p>
                  <p className="text-[11px] text-teal-800">
                    Your pledge will generate block #0 on the tamper-resistant ledger and enter the courier dispatch queue.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPledge}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmittingPledge ? 'Sealing on Ledger...' : 'Confirm & Commit Pledge'}
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

