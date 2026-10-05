import React, { useState, useEffect } from 'react';
import {
  User,
  Requirement,
  Donation,
  TaxExemptionReceipt,
  ProofOfDeliveryCertificate,
  formatIndianCurrency,
  formatRelativeTime
} from '@caretrace/shared';
import {
  loginUser,
  fetchRequirements,
  postRequirement,
  fetchDonations,
  fetchDonationDetail,
  createDonation,
  fetchMonetaryReceipt,
  fetchProofCertificate,
  clearAuthToken,
  getAuthToken,
  getCurrentUser
} from '../api/client';
import { PledgeMonetaryModal } from '../components/PledgeMonetaryModal';
import { TaxExemptionReceiptModal } from '../components/TaxExemptionReceiptModal';
import { ProofOfDeliveryModal } from '../components/ProofOfDeliveryModal';
import { ChainOfCustodyTimeline } from '../components/ChainOfCustodyTimeline';
import { PublicLedgerExplorer } from './PublicLedgerExplorer';
import {
  ShieldCheck,
  Lock,
  LogIn,
  LogOut,
  Calendar,
  Building2,
  HeartHandshake,
  FileCheck2,
  PackageCheck,
  Search,
  Plus,
  X,
  CheckCircle2,
  Check,
  ArrowRight,
  User as UserIcon,
  Layers,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';

interface BasePaperReviewPortalProps {
  onExitToMain?: () => void;
}

export const BasePaperReviewPortal: React.FC<BasePaperReviewPortalProps> = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('reviewer@demo.local');
  const [loginPassword, setLoginPassword] = useState('caretrace123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Active Tab: REQUIREMENTS | HISTORY | LEDGER
  const [activeTab, setActiveTab] = useState<'REQUIREMENTS' | 'HISTORY' | 'LEDGER'>('REQUIREMENTS');

  // Requirements State
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoadingReqs, setIsLoadingReqs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pledging Modals State
  const [monetaryReq, setMonetaryReq] = useState<Requirement | null>(null);
  const [goodsReq, setGoodsReq] = useState<Requirement | null>(null);
  const [goodsQty, setGoodsQty] = useState(10);
  const [goodsAddress, setGoodsAddress] = useState('Anna Nagar West, Chennai 600040');
  const [isSubmittingGoods, setIsSubmittingGoods] = useState(false);
  const [goodsSuccessReceipt, setGoodsSuccessReceipt] = useState<TaxExemptionReceipt | null>(null);

  // Post Requirement Modal (Institution Needs)
  const [isPostReqOpen, setIsPostReqOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<'FOOD' | 'CLOTHING' | 'MEDICINE' | 'SUPPLIES' | 'EDUCATION'>('FOOD');
  const [postUrgency, setPostUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [postQuantity, setPostQuantity] = useState(50);
  const [postUnit, setPostUnit] = useState('boxes');
  const [postDescription, setPostDescription] = useState('');
  const [postDeadline, setPostDeadline] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postSuccessMessage, setPostSuccessMessage] = useState<string | null>(null);

  // Donation History State
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonationDetail, setSelectedDonationDetail] = useState<any | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<TaxExemptionReceipt | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<ProofOfDeliveryCertificate | null>(null);

  // Ledger Verification initial ID
  const [verifyDonationId, setVerifyDonationId] = useState<string>('');

  // Auto-authenticate on mount if token exists
  useEffect(() => {
    async function checkSession() {
      setIsInitializing(true);
      try {
        const token = getAuthToken();
        if (token) {
          const session = await getCurrentUser();
          if (session && session.user) {
            // Guarantee display name is Sandeep
            const user = { ...session.user, name: 'Sandeep' };
            setCurrentUser(user);
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkSession();
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (currentUser) {
      loadRequirements();
      loadDonationHistory();
    }
  }, [currentUser]);

  const loadRequirements = async () => {
    setIsLoadingReqs(true);
    try {
      const data = await fetchRequirements({ status: 'VERIFIED' });
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setIsLoadingReqs(false);
    }
  };

  const loadDonationHistory = async () => {
    if (!currentUser) return;
    setIsLoadingHistory(true);
    try {
      const data = await fetchDonations({ donorId: currentUser.id });
      setDonations(data);
      if (data.length > 0 && !selectedDonationDetail) {
        const detail = await fetchDonationDetail(data[0].id);
        setSelectedDonationDetail(detail);
      }
    } catch (err) {
      console.error('Failed to load donation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await loginUser(loginEmail, loginPassword);
      if (res.success && res.user) {
        // Enforce user name to Sandeep
        const user = { ...res.user, name: 'Sandeep' };
        setCurrentUser(user);
      } else {
        setLoginError('Invalid credentials. Please verify and try again.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setSelectedDonationDetail(null);
  };

  // Submit Physical Goods Pledge
  const handleConfirmGoodsPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodsReq || !currentUser) return;
    setIsSubmittingGoods(true);
    try {
      const res = await createDonation({
        donorId: currentUser.id,
        requirementId: goodsReq.id,
        type: 'PHYSICAL_GOODS',
        items: [{ name: goodsReq.title, quantity: Number(goodsQty), unit: goodsReq.unit }],
        pickupAddress: goodsAddress
      });
      if (res.success && res.donation) {
        setGoodsReq(null);
        await loadRequirements();
        await loadDonationHistory();

        // Sample receipt generator
        const receipt: TaxExemptionReceipt = {
          receiptNumber: `80G-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          donationId: res.donation.id,
          amountInr: 10000,
          amountInWords: 'Ten Thousand Rupees Only',
          date: new Date().toISOString(),
          donorName: currentUser.name,
          donorEmail: currentUser.email,
          institutionName: res.donation.institutionName,
          institutionRegistrationNumber: 'TN-CH-NGO-2018-4491',
          institutionTaxId: 'AAACT2026F80G1',
          institutionAddress: 'Ambattur, Chennai 600058',
          requirementTitle: goodsReq.title,
          paymentMethod: 'IN_KIND',
          upiTransactionId: `TXN-${Date.now()}`,
          ledgerBlockHash: res.ledgerBlock?.blockHash || '630b11e7325ab90e...',
          ledgerBlockIndex: res.ledgerBlock?.index || 1,
          isDemoSample: true
        };
        setGoodsSuccessReceipt(receipt);
      }
    } catch (err) {
      console.error('Goods pledge error:', err);
    } finally {
      setIsSubmittingGoods(false);
    }
  };

  // Submit New Childcare Need
  const handlePostRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPost(true);
    try {
      const res = await postRequirement({
        institutionId: 'inst-anbu',
        category: postCategory,
        title: postTitle,
        targetQuantity: Number(postQuantity),
        unit: postUnit,
        urgency: postUrgency,
        description: postDescription,
        deadline: postDeadline ? new Date(postDeadline).toISOString() : undefined
      });
      if (res.success) {
        setPostSuccessMessage('Childcare need successfully audited and posted to the public ledger!');
        setTimeout(() => {
          setIsPostReqOpen(false);
          setPostSuccessMessage(null);
          setPostTitle('');
          setPostDescription('');
          setPostDeadline('');
          loadRequirements();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to post requirement:', err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const filteredRequirements = requirements.filter(req => {
    if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return req.title.toLowerCase().includes(q) || req.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Loading Screen during session check
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Initializing Secure Portal</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. STANDALONE UNLISTED LOGIN PAGE (When not signed in)
  // ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-7 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              CareTrace Verification System
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Base Research Paper Specification Interface
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="reviewer@demo.local"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-teal-900/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Clean footer */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 font-mono">
              Tamper-Evident SHA-256 Ledger Verification
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ISOLATED BASE PAPER LAYOUT (When signed in as Sandeep)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ── DEDICATED HEADER & NAVBAR (No shared chrome) ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                  CareTrace Verification
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Research Specification
                </span>
              </div>
            </div>

            {/* Center: Dedicated Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setActiveTab('REQUIREMENTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'REQUIREMENTS'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">Campaigns & Needs</span>
                <span className="sm:hidden">Needs</span>
              </button>

              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'HISTORY'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">Contributions & 80G Receipts</span>
                <span className="sm:hidden">History</span>
              </button>

              <button
                onClick={() => setActiveTab('LEDGER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'LEDGER'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                <span>Ledger Verification</span>
              </button>
            </nav>

            {/* Right: Account Name & Sign Out */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">Sandeep</p>
                  <p className="text-[10px] text-slate-400 font-mono">Verified Session</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* ── TAB 1: REQUIREMENTS / CAMPAIGNS ── */}
        {activeTab === 'REQUIREMENTS' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Verified Institutional Needs
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audited childcare requirements with target quantity goals and fulfillment deadlines
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPostReqOpen(true)}
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Childcare Need</span>
                </button>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search needs by title or description..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['ALL', 'FOOD', 'CLOTHING', 'MEDICINE', 'EDUCATION', 'SUPPLIES'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements Grid */}
            {isLoadingReqs ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-slate-400 uppercase">Loading verified needs...</span>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
                <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No matching requirements found</h3>
                <p className="text-xs text-slate-500 mt-1">Try resetting search filters or post a new need.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRequirements.map((req) => {
                  const remaining = Math.max(0, req.targetQuantity - req.fulfilledQuantity);
                  const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Meta Tags */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {req.category}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-emerald-700 flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{req.authenticityScore}% Authentic</span>
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                            {req.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {req.description}
                          </p>
                        </div>

                        {/* Goal & Deadline Info */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Target Goal:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {req.targetQuantity} {req.unit}
                            </span>
                          </div>

                          {req.deadline && (
                            <div className="flex justify-between items-center text-amber-900">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-amber-600" />
                                <span>Deadline:</span>
                              </span>
                              <span className="font-bold font-mono">
                                {new Date(req.deadline).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}

                          {/* Progress */}
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Progress: {progress}%</span>
                              <span>{remaining} {req.unit} left</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-600 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setMonetaryReq(req)}
                          className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                        >
                          <span className="font-mono text-sm">₹</span>
                          <span>Fund</span>
                        </button>
                        <button
                          onClick={() => {
                            setGoodsReq(req);
                            setGoodsQty(remaining || 10);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>Pledge</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MY CONTRIBUTIONS & HISTORY ── */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Donation History & Cryptographic Receipts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified records of physical goods pledges and direct monetary contributions for Sandeep
              </p>
            </div>

            {isLoadingHistory ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-slate-400 uppercase">Loading history...</span>
              </div>
            ) : donations.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No pledges or contributions recorded yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Switch to the "Campaigns & Needs" tab to pledge goods or fund an essential childcare requirement.
                </p>
                <button
                  onClick={() => setActiveTab('REQUIREMENTS')}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Browse Needs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Donations list */}
                <div className="lg:col-span-5 space-y-3">
                  {donations.map((d) => {
                    const isSelected = selectedDonationDetail?.donation?.id === d.id;
                    const isMonetary = d.type === 'FUNDS' || Boolean(d.monetaryAmountInr);

                    return (
                      <div
                        key={d.id}
                        onClick={async () => {
                          const detail = await fetchDonationDetail(d.id);
                          setSelectedDonationDetail(detail);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50/60 border-teal-600 ring-2 ring-teal-100 shadow-sm'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {d.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {d.status}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-slate-900 truncate">
                          {isMonetary ? formatIndianCurrency(d.monetaryAmountInr || 2500) : (d.items?.[0]?.name || d.requirementTitle)}
                        </p>

                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {d.institutionName || 'Anbu Illam Children Sanctuary'}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Verified'}</span>
                          <span className="text-teal-700 font-semibold flex items-center space-x-0.5">
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Selected Donation Details & Chain-of-Custody */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  {selectedDonationDetail ? (
                    <>
                      {/* Top Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                            Consignment Details
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 font-mono">
                            {selectedDonationDetail.donation.id}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const r = await fetchMonetaryReceipt(selectedDonationDetail.donation.id);
                              if (r) {
                                setActiveReceipt(r);
                              } else {
                                // Sample 80G receipt
                                setActiveReceipt({
                                  receiptNumber: `80G-${new Date().getFullYear()}-${selectedDonationDetail.donation.id.slice(-4)}`,
                                  donationId: selectedDonationDetail.donation.id,
                                  amountInr: selectedDonationDetail.donation.monetaryAmountInr || 10000,
                                  amountInWords: 'Ten Thousand Rupees Only',
                                  date: selectedDonationDetail.donation.createdAt || new Date().toISOString(),
                                  donorName: 'Sandeep',
                                  donorEmail: 'reviewer@demo.local',
                                  institutionName: selectedDonationDetail.donation.institutionName,
                                  institutionRegistrationNumber: 'TN-CH-NGO-2018-4491',
                                  institutionTaxId: 'AAACT2026F80G1',
                                  institutionAddress: 'Ambattur, Chennai 600058',
                                  requirementTitle: selectedDonationDetail.donation.requirementTitle || 'Essential Childcare Allocation',
                                  paymentMethod: selectedDonationDetail.donation.type === 'FUNDS' ? 'UPI' : 'IN_KIND',
                                  upiTransactionId: `TXN-${selectedDonationDetail.donation.id}`,
                                  ledgerBlockHash: selectedDonationDetail.blocks?.[0]?.blockHash || '46f26961b856cd9d2644...',
                                  ledgerBlockIndex: selectedDonationDetail.blocks?.[0]?.index || 1,
                                  isDemoSample: true
                                });
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold hover:bg-teal-100 transition-colors flex items-center space-x-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Section 80G Receipt</span>
                          </button>

                          <button
                            onClick={() => {
                              setVerifyDonationId(selectedDonationDetail.donation.id);
                              setActiveTab('LEDGER');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center space-x-1"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Verify Ledger</span>
                          </button>
                        </div>
                      </div>

                      {/* Walkable Chain of Custody */}
                      <ChainOfCustodyTimeline
                        donation={selectedDonationDetail.donation}
                        blocks={selectedDonationDetail.blocks}
                        onInspectCertificate={async () => {
                          const cert = await fetchProofCertificate(selectedDonationDetail.donation.id);
                          if (cert) setActiveCertificate(cert);
                        }}
                      />
                    </>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-xs text-slate-400">Select a contribution on the left to inspect its custody chain</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: LEDGER VERIFICATION ── */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-6">
            <PublicLedgerExplorer
              initialDonationId={verifyDonationId || 'CT-2026-7701'}
              onNavigateBack={() => setActiveTab('HISTORY')}
            />
          </div>
        )}
      </main>

      {/* ── MODALS ── */}

      {/* 1. Monetary Contribution Modal */}
      {monetaryReq && (
        <PledgeMonetaryModal
          donorId={currentUser.id}
          requirement={monetaryReq}
          onClose={() => setMonetaryReq(null)}
          onSuccess={(receipt) => {
            setMonetaryReq(null);
            setActiveReceipt(receipt);
            loadRequirements();
            loadDonationHistory();
          }}
        />
      )}

      {/* 2. Physical Goods Pledge Modal */}
      {goodsReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-up space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-lg text-slate-900">Pledge Physical Goods</h3>
              </div>
              <button onClick={() => setGoodsReq(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-800">{goodsReq.title}</p>
              <p className="text-[11px] text-slate-500">Beneficiary: {goodsReq.institutionName || 'Verified Sanctuary'}</p>
            </div>

            <form onSubmit={handleConfirmGoodsPledge} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pledge Quantity ({goodsReq.unit}):</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, goodsReq.targetQuantity - goodsReq.fulfilledQuantity)}
                  value={goodsQty}
                  onChange={(e) => setGoodsQty(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pickup Address / Hub Location:</label>
                <input
                  type="text"
                  value={goodsAddress}
                  onChange={(e) => setGoodsAddress(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGoodsReq(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGoods}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50"
                >
                  {isSubmittingGoods ? 'Anchoring...' : 'Confirm Pledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Section 80G Tax Exemption Modal */}
      {(activeReceipt || goodsSuccessReceipt) && (
        <TaxExemptionReceiptModal
          receipt={(activeReceipt || goodsSuccessReceipt)!}
          onClose={() => {
            setActiveReceipt(null);
            setGoodsSuccessReceipt(null);
          }}
        />
      )}

      {/* 4. Delivery Certificate Modal */}
      {activeCertificate && (
        <ProofOfDeliveryModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}

      {/* 5. Post Requirement Modal */}
      {isPostReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-up space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-lg text-slate-900">Post Institutional Childcare Need</h3>
              </div>
              <button onClick={() => setIsPostReqOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {postSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{postSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handlePostRequirement} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Requirement Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Boiled Rice & Groceries Allocation"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category:</label>
                    <select
                      value={postCategory}
                      onChange={(e: any) => setPostCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    >
                      <option value="FOOD">Food & Groceries</option>
                      <option value="CLOTHING">Clothing & Bedding</option>
                      <option value="MEDICINE">Medicine & Health</option>
                      <option value="EDUCATION">Education & Books</option>
                      <option value="SUPPLIES">Essential Supplies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Urgency:</label>
                    <select
                      value={postUrgency}
                      onChange={(e: any) => setPostUrgency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High Priority</option>
                      <option value="CRITICAL">Critical Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Quantity Goal:</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={postQuantity}
                      onChange={(e) => setPostQuantity(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Unit of Measure:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. bags, boxes, sets"
                      value={postUnit}
                      onChange={(e) => setPostUnit(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Campaign Deadline Date:</label>
                  <input
                    type="date"
                    value={postDeadline}
                    onChange={(e) => setPostDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Clinical / Need Description:</label>
                  <textarea
                    rows={2}
                    placeholder="Explain allocation rationale and children cohort..."
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPostReqOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPost || !postTitle}
                    className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmittingPost ? 'Posting...' : 'Post Need'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MINIMAL FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p className="font-mono text-[11px]">
          SHA-256 Merkle Chain • Cryptographic Zero-Trust Traceability
        </p>
      </footer>
    </div>
  );
};

export default BasePaperReviewPortal;
