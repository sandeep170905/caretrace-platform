import React, { useState, useEffect } from 'react';
import { User, Requirement } from '@caretrace/shared';
import { fetchPersonas, resetDatabase, useRealTimeEvents, getCurrentUser, clearAuthToken } from './api/client';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PublicRequestBoard } from './pages/PublicRequestBoard';
import { DonorDashboard } from './pages/DonorDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { AgentPortal } from './pages/AgentPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { PublicLedgerExplorer } from './pages/PublicLedgerExplorer';
import { Bell, CheckCircle2, ShieldCheck, X } from 'lucide-react';

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
        } else if (list.length > 0 && !currentPersona) {
          // Default to Ajith R (Donor) for quick role-switcher demo access
          setCurrentPersona(list[0]);
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

    // If an institution registered or logged in, navigate straight to operations portal
    if (user.role === 'INSTITUTION' || user.role === 'ADMIN' || user.role === 'PICKUP_AGENT') {
      setActiveNavTab('PORTAL');
    }
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

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    if (personas.length > 0) {
      setCurrentPersona(personas[0]);
    }
    handleSelectNavTab('PUBLIC_BOARD');
    setToastMessage({
      title: 'Logged Out',
      body: 'You are now viewing the public board as a guest.'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-slate-900">
      {/* Navbar with Tab Switcher, Role Switcher, and Auth Buttons */}
      <Navbar
        personas={personas}
        currentPersona={currentPersona}
        onSelectPersona={(persona) => {
          setCurrentPersona(persona);
          handleSelectNavTab('PORTAL');
        }}
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
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/50 flex items-start justify-between space-x-3 animate-slide-up">
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
                  <DonorDashboard user={currentPersona} refreshKey={refreshKey} />
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
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full" />
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
