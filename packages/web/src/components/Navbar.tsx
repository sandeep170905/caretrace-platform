import React, { useState, useEffect } from 'react';
import { User } from '@caretrace/shared';
import {
  ShieldCheck,
  RefreshCw,
  Radio,
  UserCheck,
  HeartHandshake,
  Building2,
  Truck,
  Lock,
  Globe,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  X,
  ChevronRight,
  Check
} from 'lucide-react';

interface NavbarProps {
  personas: User[];
  currentPersona: User | null;
  onSelectPersona: (persona: User) => void;
  sseConnected: boolean;
  onResetDatabase: () => void;
  isResetting: boolean;
  activeNavTab: 'PUBLIC_BOARD' | 'PORTAL' | 'VERIFY';
  onSelectNavTab: (tab: 'PUBLIC_BOARD' | 'PORTAL' | 'VERIFY') => void;
  onOpenAuthModal: (mode?: 'DONOR_LOGIN' | 'DONOR_REGISTER' | 'INSTITUTION_REGISTER') => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  personas,
  currentPersona,
  onSelectPersona,
  sseConnected,
  onResetDatabase,
  isResetting,
  activeNavTab,
  onSelectNavTab,
  onOpenAuthModal,
  onLogout,
  isAuthenticated
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DONOR':
        return <HeartHandshake className="w-4 h-4 text-teal-600" />;
      case 'INSTITUTION':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'PICKUP_AGENT':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'ADMIN':
        return <Lock className="w-4 h-4 text-purple-600" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'DONOR':
        return 'pill-teal';
      case 'INSTITUTION':
        return 'pill-emerald';
      case 'PICKUP_AGENT':
        return 'pill-amber';
      case 'ADMIN':
        return 'pill-slate';
      default:
        return 'pill-slate';
    }
  };

  const handleMobileNavClick = (tab: 'PUBLIC_BOARD' | 'PORTAL' | 'VERIFY') => {
    onSelectNavTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleMobilePersonaClick = (persona: User) => {
    onSelectPersona(persona);
    onSelectNavTab('PORTAL');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 glass-solid shadow-sm border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name (Always visible on all viewports) */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0 press-effect hover-lift"
            onClick={() => handleMobileNavClick('PUBLIC_BOARD')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-glow-teal flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900">CareTrace</span>
                <span className="text-[9px] sm:text-[10px] font-sans font-semibold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full pill-teal">
                  Verifiable Ledger
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block font-sans">Tamper-Proof Childcare Donation Logistics</p>
            </div>
          </div>

          {/* Desktop Primary View Switcher: Public Board vs Verify a Donation vs Platform Portal */}
          <div className="hidden md:flex items-center bg-surface-subtle p-1 rounded-xl border border-surface-border text-xs font-sans font-semibold shadow-inner">
            <button
              onClick={() => onSelectNavTab('PUBLIC_BOARD')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeNavTab === 'PUBLIC_BOARD'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>Public Needs Board</span>
            </button>
            <button
              onClick={() => onSelectNavTab('VERIFY')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeNavTab === 'VERIFY'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Verify a Donation</span>
            </button>
            <button
              onClick={() => onSelectNavTab('PORTAL')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeNavTab === 'PORTAL'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-700" />
              <span>Operations Portal</span>
            </button>
          </div>

          {/* Desktop Right Controls: Role Switcher & Auth Actions */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
            {/* Live SSE Status */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium border ${
                sseConnected
                  ? 'pill-emerald'
                  : 'pill-amber'
              }`}
              title={sseConnected ? 'Real-time WebSocket/SSE connected' : 'Connecting to live events stream...'}
            >
              <Radio className={`w-3 h-3 ${sseConnected ? 'text-emerald-600 animate-pulse-soft' : 'text-amber-500'}`} />
              <span className="hidden lg:inline">{sseConnected ? 'Live Updates' : 'Connecting'}</span>
            </div>

            {/* Instant Demo Role Switcher */}
            <div className="hidden lg:flex items-center bg-surface-subtle p-1 rounded-xl border border-surface-border">
              {personas.map((persona) => {
                const isActive = currentPersona?.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      onSelectPersona(persona);
                      onSelectNavTab('PORTAL');
                    }}
                    title={`Switch demo role to ${persona.name} (${persona.role})`}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{getRoleIcon(persona.role)}</span>
                    <span className="truncate max-w-[80px] xl:max-w-none">{persona.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Auth Action: Login / Register OR Logged In Account Badge */}
            {isAuthenticated && currentPersona ? (
              <div className="flex items-center space-x-2 animate-fade-in">
                <div className="hidden xl:flex items-center space-x-2 pl-2 border-l border-surface-border">
                  <div className="text-right">
                    <p className="text-xs font-sans font-bold text-slate-800 leading-tight">{currentPersona.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-sans font-medium ${getRoleBadge(currentPersona.role)}`}>
                      {currentPersona.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200 press-effect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 animate-fade-in">
                <button
                  onClick={() => onOpenAuthModal('DONOR_LOGIN')}
                  className="flex items-center space-x-1 px-4 py-2 text-xs font-sans font-semibold text-white gradient-primary rounded-xl shadow-glow-teal hover-lift transition-all press-effect"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('INSTITUTION_REGISTER')}
                  className="hidden lg:flex items-center space-x-1 px-3 py-1.5 text-xs font-sans font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-surface-subtle border border-surface-border rounded-xl shadow-sm hover-lift transition-all press-effect"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register NGO</span>
                </button>
              </div>
            )}

            {/* Quick Demo Reset Button */}
            <button
              onClick={onResetDatabase}
              disabled={isResetting}
              title="Reset demo data to pristine initial state"
              className="flex items-center space-x-1 p-2 text-xs text-slate-600 hover:text-teal-800 bg-white hover:bg-slate-50 border border-surface-border rounded-xl transition-colors shadow-sm disabled:opacity-50 press-effect hover-lift"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>

          {/* Mobile Right Controls: Reset Button & Hamburger Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Compact SSE Connection Indicator */}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full border ${
                sseConnected
                  ? 'pill-emerald'
                  : 'pill-amber'
              }`}
              title={sseConnected ? 'Real-time SSE Connected' : 'Connecting...'}
            >
              <Radio className={`w-3 h-3 ${sseConnected ? 'text-emerald-600 animate-pulse-soft' : 'text-amber-500'}`} />
            </div>

            {/* Reset Demo Data Button on Mobile */}
            <button
              onClick={onResetDatabase}
              disabled={isResetting}
              title="Reset demo dataset"
              className="p-2.5 text-slate-600 hover:text-teal-800 bg-surface-subtle border border-surface-border rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors disabled:opacity-50 press-effect"
              aria-label="Reset demo dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-teal-600' : ''}`} />
            </button>

            {/* Hamburger Menu Toggle (Thumb-friendly >= 44px target) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-slate-900 bg-surface-subtle hover:bg-slate-200 border border-surface-border rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 press-effect"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900 stroke-[2.5]" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-md z-30 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer / Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed top-16 inset-x-0 bg-white border-b border-surface-border shadow-elevated z-40 md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto animate-slide-up"
          role="dialog"
          aria-label="Mobile Navigation Menu"
        >
          <div className="p-4 sm:p-5 space-y-5 max-w-md mx-auto">
            {/* Section 1: Primary Navigation */}
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                Navigation Views
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleMobileNavClick('PUBLIC_BOARD')}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-all press-effect ${
                    activeNavTab === 'PUBLIC_BOARD'
                      ? 'bg-teal-50 text-teal-950 font-bold border border-teal-200 shadow-sm'
                      : 'text-slate-700 hover:bg-surface-subtle border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${activeNavTab === 'PUBLIC_BOARD' ? 'gradient-primary text-white shadow-glow-teal' : 'bg-slate-100 text-slate-600'}`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm block font-sans">Public Needs Board</span>
                      <span className="text-[11px] text-slate-500 font-sans font-normal">Browse verified childcare requirements</span>
                    </div>
                  </div>
                  {activeNavTab === 'PUBLIC_BOARD' && (
                    <Check className="w-4 h-4 text-teal-700 stroke-[3]" />
                  )}
                </button>

                <button
                  onClick={() => handleMobileNavClick('VERIFY')}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-all press-effect ${
                    activeNavTab === 'VERIFY'
                      ? 'bg-teal-50 text-teal-950 font-bold border border-teal-200 shadow-sm'
                      : 'text-slate-700 hover:bg-surface-subtle border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${activeNavTab === 'VERIFY' ? 'gradient-primary text-white shadow-glow-teal' : 'bg-slate-100 text-slate-600'}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm block font-sans">Verify a Donation</span>
                      <span className="text-[11px] text-slate-500 font-sans font-normal">Inspect SHA-256 chain of custody</span>
                    </div>
                  </div>
                  {activeNavTab === 'VERIFY' && (
                    <Check className="w-4 h-4 text-teal-700 stroke-[3]" />
                  )}
                </button>

                <button
                  onClick={() => handleMobileNavClick('PORTAL')}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-all press-effect ${
                    activeNavTab === 'PORTAL'
                      ? 'bg-teal-50 text-teal-950 font-bold border border-teal-200 shadow-sm'
                      : 'text-slate-700 hover:bg-surface-subtle border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${activeNavTab === 'PORTAL' ? 'gradient-primary text-white shadow-glow-teal' : 'bg-slate-100 text-slate-600'}`}>
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm block font-sans">Operations Portal</span>
                      <span className="text-[11px] text-slate-500 font-sans font-normal">Active role dashboard & consignments</span>
                    </div>
                  </div>
                  {activeNavTab === 'PORTAL' && (
                    <Check className="w-4 h-4 text-teal-700 stroke-[3]" />
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Demo Role Switcher */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">
                  Demo Persona Switcher
                </span>
                <span className="text-[10px] pill-teal px-2 py-0.5 rounded-full border font-sans font-semibold">
                  1-Tap Role Test
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {personas.map((persona) => {
                  const isActive = currentPersona?.id === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => handleMobilePersonaClick(persona)}
                      className={`p-3 rounded-xl text-left border min-h-[56px] flex flex-col justify-between transition-all press-effect ${
                        isActive
                          ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-200 shadow-sm'
                          : 'bg-surface-canvas hover:bg-surface-subtle border-surface-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-1 rounded-md bg-white border border-surface-border">
                          {getRoleIcon(persona.role)}
                        </span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                        )}
                      </div>
                      <div className="mt-1.5">
                        <p className="text-xs font-sans font-bold text-slate-900 truncate">{persona.name}</p>
                        <p className="text-[10px] text-slate-500 font-sans font-medium truncate capitalize">
                          {persona.role.replace('_', ' ').toLowerCase()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Auth & Profile */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                Account & Access
              </span>
              {isAuthenticated && currentPersona ? (
                <div className="space-y-3">
                  <div className="p-3 bg-surface-canvas rounded-xl border border-surface-border flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-sans font-bold text-slate-900">{currentPersona.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{currentPersona.email}</p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-sans font-semibold mt-1 ${getRoleBadge(currentPersona.role)}`}>
                        {currentPersona.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-sans font-bold shadow-sm flex items-center justify-center space-x-2 transition-colors press-effect"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of CareTrace</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuthModal('DONOR_LOGIN');
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 gradient-primary text-white rounded-xl text-xs font-sans font-bold shadow-glow-teal flex items-center justify-center space-x-2 transition-all press-effect"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuthModal('INSTITUTION_REGISTER');
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-surface-subtle text-slate-700 border border-surface-border rounded-xl text-xs font-sans font-bold shadow-sm flex items-center justify-center space-x-2 transition-all press-effect"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register Childcare Institution (NGO)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 4: System Information */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1 pb-1">
              <div className="flex items-center space-x-2">
                <Radio className={`w-3.5 h-3.5 ${sseConnected ? 'text-emerald-600 animate-pulse-soft' : 'text-amber-500'}`} />
                <span className="text-[11px] font-sans font-medium">
                  {sseConnected ? 'SSE Live Stream Active' : 'Connecting to SSE...'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">SHA-256 Ledger</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

