import React, { useState } from 'react';
import { User, Institution } from '@caretrace/shared';
import { loginUser, registerDonor, registerInstitution } from '../api/client';
import {
  X,
  Lock,
  HeartHandshake,
  Building2,
  Mail,
  KeyRound,
  User as UserIcon,
  Phone,
  FileText,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'DONOR_LOGIN' | 'DONOR_REGISTER' | 'INSTITUTION_REGISTER';
  prefilledPromptText?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'DONOR_LOGIN',
  prefilledPromptText
}) => {
  const [mode, setMode] = useState<'DONOR_LOGIN' | 'DONOR_REGISTER' | 'INSTITUTION_REGISTER'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Donor fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Institution fields
  const [directorName, setDirectorName] = useState('');
  const [instName, setInstName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Chennai');
  const [postalCode, setPostalCode] = useState('600001');
  const [capacity, setCapacity] = useState('50');
  const [childrenCount, setChildrenCount] = useState('40');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser(email, password);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await registerDonor({ name, email, password, phone });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstitutionRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await registerInstitution({
        directorName,
        email,
        password,
        phone,
        institutionName: instName,
        registrationNumber: regNumber,
        taxId,
        address,
        city,
        postalCode,
        capacity: Number(capacity),
        currentChildrenCount: Number(childrenCount),
        description
      });
      setSuccessMsg('Institution registered! Accreditation pending Admin review.');
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Institution registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser(demoEmail, 'caretrace123');
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Access & Verification</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {mode === 'DONOR_LOGIN' && 'Sign In to CareTrace'}
            {mode === 'DONOR_REGISTER' && 'Create Donor Account'}
            {mode === 'INSTITUTION_REGISTER' && 'Register Childcare Sanctuary'}
          </h2>
          {prefilledPromptText ? (
            <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 font-medium">
              {prefilledPromptText}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'DONOR_LOGIN' && 'Sign in to pledge donations, track custodial transit, and inspect verifiable ledger blocks.'}
              {mode === 'DONOR_REGISTER' && 'Join CareTrace to transparently track physical donations with cryptographic chain-of-custody.'}
              {mode === 'INSTITUTION_REGISTER' && 'Accredit your orphanage or childcare shelter to receive verified physical supplies.'}
            </p>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('DONOR_LOGIN'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'DONOR_LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Donor Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('DONOR_REGISTER'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'DONOR_REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Donor
          </button>
          <button
            type="button"
            onClick={() => { setMode('INSTITUTION_REGISTER'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'INSTITUTION_REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register NGO
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-900 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form 1: Donor Login */}
        {mode === 'DONOR_LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ajith@caretrace.org or your email"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In with Credentials'}
            </button>
          </form>
        )}

        {/* Form 2: Donor Register */}
        {mode === 'DONOR_REGISTER' && (
          <form onSubmit={handleDonorRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Raman"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (for Pickup Coordination)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98409 88776"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Register as Verifiable Donor'}
            </button>
          </form>
        )}

        {/* Form 3: Institution Register */}
        {mode === 'INSTITUTION_REGISTER' && (
          <form onSubmit={handleInstitutionRegister} className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs mb-2">
              <span className="font-bold block">Accreditation Protocol:</span>
              New institutions are provisionally created as <strong>Unverified</strong> and sent to Admin Sandeep's queue for compliance review before publishing requirements.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Director Full Name</label>
                <input
                  type="text"
                  required
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="e.g. Dr. Meenakshi Sundaram"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@ashanivas.org"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98411 22334"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Institution Legal Name</label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="e.g. Asha Nivas Children Home"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Govt Registration / 80G License</label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="TN-CH-NGO-2026-9901"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tax ID / PAN</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="12AA-TN-8829104"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Facility Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 Velachery Main Road"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="600042"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Children in Care</label>
                <input
                  type="number"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brief Sanctuary Mission & Care Scope</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive residential care, nutrition, and schooling for disadvantaged youth in Chennai."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Submitting Registration...' : 'Submit Accreditation Requisition'}
            </button>
          </form>
        )}

        {/* Quick Demo Personas 1-Click Login Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              1-Click Demo Personas
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Password: caretrace123
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ajith@caretrace.org')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-left transition-colors flex items-center space-x-2"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                AR
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-800 text-[11px]">Ajith R</p>
                <p className="text-[10px] text-slate-500">Donor</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('director@karunaikarangal.org')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-colors flex items-center space-x-2"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                AK
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-800 text-[11px]">Akash Kumar</p>
                <p className="text-[10px] text-slate-500">Institution</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('agent.sakthivel@caretrace.org')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-colors flex items-center space-x-2"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                SS
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-800 text-[11px]">Sakthivel S</p>
                <p className="text-[10px] text-slate-500">Courier</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('sandeep@caretrace.org')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 text-left transition-colors flex items-center space-x-2"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                SR
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-800 text-[11px]">Sandeep R</p>
                <p className="text-[10px] text-slate-500">Admin</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

