import React, { useState, useEffect } from 'react';
import { User, Requirement } from '@caretrace/shared';
import { fetchPersonas, resetDatabase, useRealTimeEvents, getCurrentUser, clearAuthToken, loginUser } from './api/client';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PublicRequestBoard } from './pages/PublicRequestBoard';
import { DonorDashboard } from './pages/DonorDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { AgentPortal } from './pages/AgentPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { PublicLedgerExplorer } from './pages/PublicLedgerExplorer';
import { Bell, CheckCircle2, ShieldCheck, X, HeartHandshake, Building2, Truck, Lock, LogIn, UserPlus, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [personas, setPersonas] = useState<User[]>([]);
  const [currentPersona, setCurrentPersona] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeNavTab, setActiveNavTab] = useState<'PUBLIC_BOARD' | 'PORTAL' | 'VERIFY'>('PUBLIC_BOARD');
  const [verifyDonationId, setVerifyDonationId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'DONOR_LOGIN' | 'DONOR_REGISTER' | 'INSTITUTION_REGISTER'>('DONOR_LOGIN');
  const [authPromptText, setAuthPromptText] = useState<string | undefined>(undefined);
  const [pendingPledgeReq, setPendingPledgeReq] = useState<Requirement | null>(null);

  // Hook into real-time SSE stream from /api/events
  const { connected: sseConnected } = useRealTimeEvents((event) => {
    setRefreshKey((prev) => prev + 1);

    if (event.type === 'DONATION_STATUS_UPDATED') {
      setToastMessage({
        title: 'Real-Time Chain Update',
        body: event.data.message || `Donation ${event.data.donationId} status updated to ${event.data.status}`
      });
    } else if (event.type === 'DONATION_DELIVERED') {
      setToastMessage({
        title: '🎉 Delivery Confirmed on Ledger!',
        body: event.data.message || `Donation ${event.data.donationId} delivery authenticated.`
      });
    } else if (event.type === 'LEDGER_TAMPER_ALERT') {
      setToastMessage({
        title: '⚠️ Ledger Security Alert',
        body: `Tampering detected at Block #${event.data.tamperedBlockIndex}!`
      });
    } else if (event.type === 'INSTITUTION_REGISTERED') {
      setToastMessage({
        title: '🏛️ New Institution Registered',
        body: `${event.data.name} submitted for compliance accreditation review.`
      });
    } else if (event.type === 'INSTITUTION_VERIFIED') {
      setToastMessage({
        title: '✅ Institution Accredited',
        body: `${event.data.name} verified by Admin. Requirement posting unlocked!`
      });
    } else if (event.type === 'DATABASE_RESEEDED') {
      setToastMessage({
        title: 'Database Reset',
        body: 'Pristine demo dataset restored.'
      });
    } else if (event.type === 'ANNOUNCEMENT_CREATED') {
      const isUrgent = event.data.urgency === 'URGENT';
      setToastMessage({
        title: isUrgent ? '🚨 Urgent Platform Notice' : '📢 Platform Announcement',
        body: event.data.title || 'New broadcast notice posted.'
      });
    } else if (event.type === 'ANNOUNCEMENT_DISMISSED') {
      setToastMessage({
        title: '📢 Notice Updated',
        body: event.data.title ? `"${event.data.title}" was concluded.` : 'A broadcast notice was deactivated.'
      });
    }
  });

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load session or seeded personas on mount
  useEffect(() => {
    async function init() {
      try {
        const list = await fetchPersonas();
        setPersonas(list);

        // Check if there is an active JWT session
        const session = await getCurrentUser();
        if (session && session.user) {
          setCurrentPersona(session.user);
          setIsAuthenticated(true);
        } else {
          // Unauthenticated guest: do not default to Ajith R
          setCurrentPersona(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to initialize CareTrace session:', err);
      }
    }
    init();
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetDatabase();
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenAuth = (mode: 'DONOR_LOGIN' | 'DONOR_REGISTER' | 'INSTITUTION_REGISTER' = 'DONOR_LOGIN', prompt?: string) => {
    setAuthModalMode(mode);
    setAuthPromptText(prompt);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentPersona(user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setToastMessage({
      title: 'Authentication Successful',
      body: `Welcome, ${user.name} (${user.role.replace('_', ' ')})`
    });

    // Navigate straight to Operations Portal for ALL roles, including new DONOR accounts
    setActiveNavTab('PORTAL');
  };

  useEffect(() => {
    const syncFromUrl = () => {
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();

      const queryDonationId = search.get('id') || search.get('verify') || search.get('donationId');
      if (queryDonationId) {
        setVerifyDonationId(queryDonationId);
      }

      if (path.startsWith('/verify') || path.startsWith('/ledger') || hash === '#verify' || hash === '#ledger' || search.has('verify') || search.has('id')) {
        setActiveNavTab('VERIFY');
      } else if (path.startsWith('/portal') || hash === '#portal') {
        setActiveNavTab('PORTAL');
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const handleSelectNavTab = (tab: 'PUBLIC_BOARD' | 'PORTAL' | 'VERIFY') => {
    setActiveNavTab(tab);
    if (tab === 'VERIFY') {
      const url = verifyDonationId ? `/verify?id=${encodeURIComponent(verifyDonationId)}` : '/verify';
      window.history.pushState({}, '', url);
    } else if (tab === 'PORTAL') {
      window.history.pushState({}, '', '/portal');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSelectPersona = async (persona: User) => {
    try {
      const res = await loginUser(persona.email, 'caretrace123');
      setCurrentPersona(res.user);
      setIsAuthenticated(true);
    } catch {
      setCurrentPersona(persona);
      setIsAuthenticated(true);
    }
    handleSelectNavTab('PORTAL');
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setCurrentPersona(null);
    setPendingPledgeReq(null);
    handleSelectNavTab('PUBLIC_BOARD');
    setToastMessage({
      title: 'Signed Out',
      body: 'You are now viewing the public board as a guest.'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-slate-900 overflow-x-hidden w-full">
      {/* Navbar with Tab Switcher, Role Switcher, and Auth Buttons */}
      <Navbar
        personas={personas}
        currentPersona={currentPersona}
        onSelectPersona={handleSelectPersona}
        sseConnected={sseConnected}
        onResetDatabase={handleReset}
        isResetting={isResetting}
        activeNavTab={activeNavTab}
        onSelectNavTab={handleSelectNavTab}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />

      {/* Real-Time Live Push Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/50 flex items-start justify-between space-x-3 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-300">{toastMessage.title}</p>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug">{toastMessage.body}</p>
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeNavTab === 'VERIFY' ? (
          <PublicLedgerExplorer
            initialDonationId={verifyDonationId}
            onNavigateBack={() => handleSelectNavTab('PUBLIC_BOARD')}
          />
        ) : activeNavTab === 'PUBLIC_BOARD' ? (
          <PublicRequestBoard
            currentUser={currentPersona}
            isAuthenticated={isAuthenticated}
            refreshKey={refreshKey}
            onRequireAuth={(req) => {
              setPendingPledgeReq(req);
              handleOpenAuth('DONOR_LOGIN', `Sign in or register to pledge your donation for: "${req.title}"`);
            }}
            onPledgedSuccess={(donationId) => {
              handleSelectNavTab('PORTAL');
            }}
            onNavigateToVerify={(donationId) => {
              if (donationId) setVerifyDonationId(donationId);
              handleSelectNavTab('VERIFY');
            }}
          />
        ) : (
          <>
            {currentPersona ? (
              <>
                {currentPersona.role === 'DONOR' && (
                  <DonorDashboard
                    user={currentPersona}
                    refreshKey={refreshKey}
                    initialPledgeReq={pendingPledgeReq}
                    onClearPendingPledge={() => setPendingPledgeReq(null)}
                  />
                )}
                {currentPersona.role === 'INSTITUTION' && (
                  <InstitutionDashboard user={currentPersona} refreshKey={refreshKey} />
                )}
                {currentPersona.role === 'PICKUP_AGENT' && (
                  <AgentPortal user={currentPersona} refreshKey={refreshKey} />
                )}
                {currentPersona.role === 'ADMIN' && (
                  <AdminDashboard user={currentPersona} refreshKey={refreshKey} />
                )}
              </>
            ) : (
              /* Portal Landing for Unauthenticated Guests */
              <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>CareTrace Operations Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sign In or Select a Persona to Enter Portal
                  </h1>
                  <p className="text-sm text-slate-600 max-w-xl mx-auto">
                    Sign in to your registered donor account, register a childcare sanctuary, or select any demo role below for 1-click evaluation.
                  </p>
                </div>

                {/* Account Sign In & Registration Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                  <button
                    onClick={() => handleOpenAuth('DONOR_LOGIN')}
                    className="flex items-center justify-between p-4 bg-teal-800 hover:bg-teal-900 text-white rounded-2xl shadow-md transition-all group"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                        <LogIn className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Sign In</p>
                        <p className="text-xs text-teal-100/80">Access your donor or NGO dashboard</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-teal-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleOpenAuth('DONOR_REGISTER')}
                    className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl shadow-sm transition-all group"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Register as Donor</p>
                        <p className="text-xs text-slate-500">Create new verified contributor account</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 1-Tap Demo Personas Section */}
                <div className="pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Explore Instant Demo Personas</h2>
                      <p className="text-xs text-slate-500">Inspect the portal from any stakeholder perspective without credentials</p>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                      1-Tap Preview
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {personas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleSelectPersona(p);
                        }}
                        className="p-4 bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl text-left transition-all shadow-xs group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-800 transition-colors">
                            {p.role === 'DONOR' && <HeartHandshake className="w-4 h-4" />}
                            {p.role === 'INSTITUTION' && <Building2 className="w-4 h-4" />}
                            {p.role === 'PICKUP_AGENT' && <Truck className="w-4 h-4" />}
                            {p.role === 'ADMIN' && <Lock className="w-4 h-4" />}
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {p.role.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{p.email}</p>
                        <div className="mt-3 text-xs font-semibold text-teal-700 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Enter as {p.name.split(' ')[0]}</span>
                          <span>&rarr;</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthPromptText(undefined);
          setPendingPledgeReq(null);
        }}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        prefilledPromptText={authPromptText}
      />

      {/* Footer */}
      <footer className="border-t border-[#E7E8E2] bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-slate-800">CareTrace Platform</span>
            <span>— Tamper-Resistant Physical Donation Verification</span>
          </div>
          <p className="text-[11px] font-mono">SHA-256 Hash Chain • Zero Trust Handover</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
