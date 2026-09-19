import React from 'react';
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
  UserPlus
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
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'INSTITUTION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PICKUP_AGENT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E8E2] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectNavTab('PUBLIC_BOARD')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">CareTrace</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Verifiable Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Tamper-Proof Childcare Donation Logistics</p>
            </div>
          </div>

          {/* Primary View Switcher: Public Board vs Verify a Donation vs Platform Portal */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onSelectNavTab('PUBLIC_BOARD')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeNavTab === 'PUBLIC_BOARD'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
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
                  : 'text-slate-600 hover:text-slate-900'
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
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-700" />
              <span>Operations Portal</span>
            </button>
          </div>

          {/* Right Controls: Role Switcher & Auth Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live SSE Status */}
            <div
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                sseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={sseConnected ? 'Real-time WebSocket/SSE connected' : 'Connecting to live events stream...'}
            >
              <Radio className={`w-3 h-3 ${sseConnected ? 'text-emerald-600 animate-pulse' : 'text-amber-500'}`} />
              <span className="hidden lg:inline">{sseConnected ? 'Live Updates' : 'Connecting'}</span>
            </div>

            {/* Instant Demo Role Switcher (Kept intact per prompt instructions) */}
            <div className="hidden sm:flex items-center bg-[#F3F4F0] p-1 rounded-xl border border-[#E7E8E2]">
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
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{getRoleIcon(persona.role)}</span>
                    <span className="truncate max-w-[80px] md:max-w-none">{persona.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Auth Action: Login / Register OR Logged In Account Badge */}
            {isAuthenticated && currentPersona ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{currentPersona.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getRoleBadge(currentPersona.role)}`}>
                      {currentPersona.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onOpenAuthModal('DONOR_LOGIN')}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl shadow-sm transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('INSTITUTION_REGISTER')}
                  className="hidden md:flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
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
              className="flex items-center space-x-1 p-2 text-xs text-slate-600 hover:text-teal-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
