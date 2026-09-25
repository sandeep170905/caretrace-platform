import React, { useState, useEffect, useMemo } from 'react';
import { User, Institution, Requirement, Donation, ProofOfDeliveryCertificate, RequirementScorer, ScoringResult, formatRelativeTime } from '@caretrace/shared';
import {
  Building2,
  Package,
  QrCode,
  Plus,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ArrowDownLeft,
  Users,
  Edit3,
  XCircle,
  Check,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import {
  fetchInstitutions,
  fetchRequirements,
  fetchDonations,
  postRequirement,
  updateRequirement,
  closeRequirement,
  scanDelivery,
  fetchProofCertificate
} from '../api/client';
import { TactileQRScanner } from '../components/TactileQRScanner';
import { ProofOfDeliveryModal } from '../components/ProofOfDeliveryModal';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

interface InstitutionDashboardProps {
  user: User;
  refreshKey?: number;
}

const generateSamplePhoto = (id: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 440;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 640, 440);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.6, '#047857');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 440);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 640; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 440); ctx.stroke();
    }
    for (let j = 0; j < 440; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(640, j); ctx.stroke();
    }

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('CARETRACE OFFICIAL PROOF OF HANDOVER', 32, 44);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 70, 560, 300);
    ctx.fillRect(40, 70, 560, 300);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📦 Consignment Inspected & Accepted', 320, 150);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText(`Consignment ID: ${id}`, 320, 190);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ecfdf5';
    ctx.fillText(`Handover Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 320, 230);
    ctx.fillText('Recipient: Accredited Sanctuary Staff', 320, 260);

    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('CRYPTOGRAPHIC PROOF ATTACHED • ANCHORED TO SHA-256 LEDGER BLOCK', 40, 410);

    return canvas.toDataURL('image/jpeg', 0.85);
  }
  return '';
};

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ user, refreshKey }) => {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [incomingDonations, setIncomingDonations] = useState<Donation[]>([]);
  const [completedDonations, setCompletedDonations] = useState<Donation[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ProofOfDeliveryCertificate | null>(null);
  const [activeTab, setActiveTab] = useState<'DELIVERIES' | 'REQUIREMENTS' | 'CERTIFICATES'>('DELIVERIES');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTabSwitching, setIsTabSwitching] = useState<boolean>(false);

  const handleTabSwitch = (tab: 'DELIVERIES' | 'REQUIREMENTS' | 'CERTIFICATES') => {
    if (tab === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabSwitching(false), 180);
  };

  // New Requirement Form State
  const [isNewReqOpen, setIsNewReqOpen] = useState<boolean>(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState<'FOOD' | 'CLOTHING' | 'MEDICINE' | 'SUPPLIES' | 'EDUCATION'>('FOOD');
  const [reqQuantity, setReqQuantity] = useState(50);
  const [reqUnit, setReqUnit] = useState('boxes');
  const [reqUrgency, setReqUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [reqDescription, setReqDescription] = useState('');
  const [scoringFeedback, setScoringFeedback] = useState<any | null>(null);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Real-time authenticity/fraud score calculated dynamically as institution edits requirement
  const liveScoring: ScoringResult | null = useMemo(() => {
    if (!institution) return null;
    return RequirementScorer.evaluateRequirement(
      {
        title: reqTitle,
        category: reqCategory,
        urgency: reqUrgency,
        targetQuantity: Number(reqQuantity) || 0,
        unit: reqUnit,
        description: reqDescription,
        documents: []
      },
      institution,
      requirements.filter(r => r.institutionId === institution.id).length
    );
  }, [institution, reqTitle, reqCategory, reqUrgency, reqQuantity, reqUnit, reqDescription, requirements]);

  // Handover confirmation modal
  const [pendingHandoverDonationId, setPendingHandoverDonationId] = useState<string | null>(null);
  const [handoverRecipientName, setHandoverRecipientName] = useState(user.name);
  const [handoverNotes, setHandoverNotes] = useState('Physical consignment inspected and approved in full.');
  const [handoverPhoto, setHandoverPhoto] = useState<string | null>(null);
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);
  const [handoverSuccessBanner, setHandoverSuccessBanner] = useState<string | null>(null);

  // Edit Requirement State
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<'FOOD' | 'CLOTHING' | 'MEDICINE' | 'SUPPLIES' | 'EDUCATION'>('FOOD');
  const [editQuantity, setEditQuantity] = useState(50);
  const [editUnit, setEditUnit] = useState('units');
  const [editUrgency, setEditUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdatingReq, setIsUpdatingReq] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const institutions = await fetchInstitutions();
      // Match user's institution or default to Sunrise
      const currentInst = institutions.find(i => i.id === user.institutionId) || institutions[0];
      setInstitution(currentInst);

      if (currentInst) {
        const [reqs, allDonations] = await Promise.all([
          fetchRequirements({ institutionId: currentInst.id }),
          fetchDonations()
        ]);

        setRequirements(reqs);

        // Filter donations destined for this institution
        const incoming = allDonations.filter(
          d => d.institutionId === currentInst.id && d.status !== 'CONFIRMED'
        );
        const completed = allDonations.filter(
          d => d.institutionId === currentInst.id && d.status === 'CONFIRMED'
        );

        setIncomingDonations(incoming);
        setCompletedDonations(completed);
      }
    } catch (e) {
      console.error('Failed to load institution data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id, refreshKey]);

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;
    setIsSubmittingReq(true);
    setScoringFeedback(null);

    try {
      const payload = {
        institutionId: institution.id,
        category: reqCategory,
        title: reqTitle,
        targetQuantity: Number(reqQuantity),
        unit: reqUnit,
        urgency: reqUrgency,
        description: reqDescription,
        documents: []
      };

      const result = await postRequirement(payload);
      if (result.success) {
        setScoringFeedback(result.scoring);
        setTimeout(() => {
          setIsNewReqOpen(false);
          setScoringFeedback(null);
          setReqTitle('');
          setReqDescription('');
          loadData();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to post requirement:', err);
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleOpenEditModal = (req: Requirement) => {
    setEditingReq(req);
    setEditTitle(req.title);
    setEditCategory(req.category);
    setEditQuantity(req.targetQuantity);
    setEditUnit(req.unit);
    setEditUrgency(req.urgency);
    setEditDescription(req.description);
  };

  const handleUpdateRequirementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq) return;
    setIsUpdatingReq(true);
    try {
      await updateRequirement(editingReq.id, {
        title: editTitle,
        category: editCategory,
        targetQuantity: Number(editQuantity),
        unit: editUnit,
        urgency: editUrgency,
        description: editDescription
      });
      setEditingReq(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update requirement:', err);
    } finally {
      setIsUpdatingReq(false);
    }
  };

  const handleCloseRequirement = async (id: string) => {
    try {
      await closeRequirement(id);
      await loadData();
    } catch (err) {
      console.error('Failed to close requirement:', err);
    }
  };

  const handleScanSuccess = (payload: string) => {
    setIsScannerOpen(false);
    // Extract ID if JSON payload or direct string
    let donationId = payload;
    try {
      const parsed = JSON.parse(payload);
      if (parsed.donationId) donationId = parsed.donationId;
    } catch (e) {}

    setPendingHandoverDonationId(donationId);
    setHandoverPhoto(null);
  };

  const handleConfirmDelivery = async () => {
    if (!pendingHandoverDonationId) return;
    setIsConfirmingHandover(true);

    try {
      const res = await scanDelivery({
        qrPayload: pendingHandoverDonationId,
        recipientName: handoverRecipientName,
        signature: `DIGITAL_SIG:${handoverRecipientName.toUpperCase().replace(/\s+/g, '_')}_AUTHENTICATED`,
        notes: handoverNotes,
        photoUrl: handoverPhoto || undefined,
        actorId: user.id
      });

      if (res.success) {
        setHandoverSuccessBanner(`Donation ${pendingHandoverDonationId} sealed on ledger! Proof of delivery certificate minted.`);
        setPendingHandoverDonationId(null);
        setHandoverPhoto(null);
        await loadData();
        if (res.certificate) {
          setSelectedCertificate(res.certificate);
        }
      }
    } catch (err) {
      console.error('Handover confirmation failed:', err);
    } finally {
      setIsConfirmingHandover(false);
    }
  };

  const handleViewCert = async (donationId: string) => {
    const cert = await fetchProofCertificate(donationId);
    if (cert) setSelectedCertificate(cert);
  };

  if (isLoading && !institution) {
    return (
      <div className="space-y-8 animate-fade-in pb-16">
        <AnnouncementBanner refreshKey={refreshKey} />
        <DashboardSkeleton type="INSTITUTION" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Broadcast Announcements Banner */}
      <AnnouncementBanner refreshKey={refreshKey} />

      {/* Institution Banner */}
      <div className="gradient-hero rounded-[2.5rem] p-8 sm:p-12 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-emerald-600/30 blur-[100px] rounded-full rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-sans font-bold tracking-wide text-emerald-200 mb-5 shadow-sm">
            <Building2 className="w-4 h-4 text-emerald-300" />
            <span>Accredited Childcare Sanctuary Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight mb-3">
            {institution?.name || "Anbu Illam Children's Sanctuary"}
          </h1>
          <p className="text-sm font-sans font-medium text-emerald-100/90 flex items-center space-x-2">
            <span className="font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-white/10">Lic: {institution?.registrationNumber}</span> 
            <span>•</span>
            <span>{institution?.address}, {institution?.city}</span>
          </p>
        </div>

        {/* Institution Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-10 pt-8 border-t border-emerald-700/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-emerald-200/90 block mb-1.5">Children in Care</span>
            <p className="text-4xl font-display font-bold text-white mb-2">
              {institution?.currentChildrenCount} <span className="text-lg font-sans font-medium text-emerald-300">/ {institution?.capacity}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-emerald-200/90 block mb-1.5">Trust Rating</span>
            <p className="text-4xl font-display font-bold text-emerald-300 mb-2">{institution?.trustScore}%</p>
            <span className="text-[11px] font-sans font-medium text-emerald-200 flex items-center space-x-1.5 bg-emerald-950/40 px-2 py-1 rounded w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity Verified</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-emerald-200/90 block mb-1.5">Incoming Deliveries</span>
            <p className="text-4xl font-display font-bold text-amber-300 mb-2">{incomingDonations.length}</p>
            <span className="text-[11px] font-sans font-medium text-emerald-200 bg-amber-950/40 text-amber-200 px-2 py-1 rounded w-fit inline-block">
              En Route via Courier
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-glass">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-emerald-200/90 block mb-1.5">Ledger Confirmed</span>
            <p className="text-4xl font-display font-bold text-white mb-2">{completedDonations.length}</p>
            <span className="text-[11px] font-sans font-medium text-emerald-200 bg-emerald-950/40 px-2 py-1 rounded w-fit inline-block">
              Sealed Receipts
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {handoverSuccessBanner && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in card-premium">
          <div className="flex items-center space-x-3 text-sm font-sans font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{handoverSuccessBanner}</span>
          </div>
          <button
            onClick={() => setHandoverSuccessBanner(null)}
            className="text-xs text-emerald-700 font-bold hover:underline px-3 py-1.5 bg-white rounded-lg border border-emerald-200 press-effect"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center space-x-2 bg-surface-subtle p-1.5 rounded-2xl border border-surface-border overflow-x-auto max-w-full shadow-inner">
          <button
            onClick={() => handleTabSwitch('DELIVERIES')}
            className={`px-5 py-2.5 rounded-xl text-sm font-sans font-bold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'DELIVERIES'
                ? 'bg-surface-card text-teal-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-teal-700" />
            <span>Active Deliveries & Handover</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border shadow-sm ml-1 ${
              incomingDonations.length > 0
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-200 text-slate-700 border-slate-300'
            }`}>
              {incomingDonations.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('REQUIREMENTS')}
            className={`px-5 py-2.5 rounded-xl text-sm font-sans font-bold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'REQUIREMENTS'
                ? 'bg-surface-card text-teal-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 text-teal-700" />
            <span>Requirements & Needs</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shadow-sm ml-1">
              {requirements.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('CERTIFICATES')}
            className={`px-5 py-2.5 rounded-xl text-sm font-sans font-bold transition-all flex items-center space-x-2 shrink-0 min-h-[44px] ${
              activeTab === 'CERTIFICATES'
                ? 'bg-surface-card text-teal-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-teal-700" />
            <span>Verified Certificates</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 border border-slate-300 shadow-sm ml-1">
              {completedDonations.length}
            </span>
          </button>
        </div>

        {/* Dynamic Contextual Action Button */}
        {activeTab === 'DELIVERIES' && (
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-sans font-bold shadow-glow-teal hover-lift transition-all self-start sm:self-center press-effect"
          >
            <QrCode className="w-4.5 h-4.5" />
            <span>Scan Handover QR</span>
          </button>
        )}

        {activeTab === 'REQUIREMENTS' && (
          <button
            onClick={() => {
              if (institution?.verified) setIsNewReqOpen(true);
            }}
            disabled={!institution?.verified}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-sans font-bold shadow-sm transition-all self-start sm:self-center ${
              institution?.verified
                ? 'gradient-primary text-white cursor-pointer hover-lift shadow-glow-teal press-effect'
                : 'bg-surface-subtle text-slate-400 cursor-not-allowed border border-surface-border'
            }`}
          >
            <Plus className="w-4.5 h-4.5" />
            <span>{!institution?.verified ? 'Posting Locked' : 'Post New Requirement'}</span>
          </button>
        )}
      </div>

      {/* Main Tab Panels with Smooth Skeleton Transition */}
      {isTabSwitching ? (
        <DashboardSkeleton type="TAB_CONTENT" />
      ) : (
        <>
          {/* Section 1: Incoming Consignments & Handover QR Scan */}
          {activeTab === 'DELIVERIES' && (
        <div className="bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-sm space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-border">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2.5">
                <ArrowDownLeft className="w-5 h-5 text-teal-700" />
                <span>Incoming Deliveries Awaiting Handover Confirmation</span>
              </h2>
              <p className="text-sm font-sans text-slate-500 mt-1">
                Inspect incoming courier shipments and authenticate arrival via QR scan
              </p>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center space-x-2 px-5 py-2.5 gradient-primary text-white rounded-xl text-sm font-sans font-bold shadow-glow-teal hover-lift transition-all press-effect"
            >
              <QrCode className="w-4.5 h-4.5" />
              <span>Scan Handover QR</span>
            </button>
          </div>

        {incomingDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomingDonations.map((d, i) => (
              <div
                key={d.id}
                className={`card-premium p-6 rounded-2xl bg-amber-50/40 border border-amber-200 flex flex-col justify-between hover:shadow-card-hover transition-all animate-fade-up stagger-${(i % 6) + 1}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                      {d.id}
                    </span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shadow-sm">
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-lg font-display font-bold text-slate-900 mt-2 leading-snug">{d.requirementTitle}</h4>
                  <p className="text-xs font-sans text-slate-600 mt-1.5 flex items-center space-x-1.5">
                    <span>Donor:</span> <strong className="font-bold bg-white px-1.5 py-0.5 rounded border border-amber-100">{d.donorName}</strong>
                  </p>

                  <div className="mt-4 p-3 bg-white rounded-xl border border-amber-100 text-sm font-sans shadow-inner">
                    <span className="text-slate-500 font-bold block mb-1">Consignment Items:</span>
                    <p className="font-bold text-slate-800">
                      {d.items.map(it => `${it.quantity} ${it.unit} ${it.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] font-sans font-bold text-slate-500 bg-white px-2 py-1 rounded border border-amber-100 truncate max-w-[140px]">
                    Courier: {d.pickupAgentName || 'Sakthivel S'}
                  </span>
                  <button
                    onClick={() => {
                      setPendingHandoverDonationId(d.id);
                    }}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-sans font-bold shadow-sm flex items-center justify-center space-x-1.5 press-effect hover-lift transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-subtle rounded-2xl flex items-center justify-center mx-auto mb-4 border border-surface-border">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-display font-bold text-slate-700">No incoming deliveries</p>
            <p className="text-sm font-sans text-slate-500 mt-1">All consignments have been scanned and authenticated.</p>
          </div>
        )}
      </div>
      )}


      {/* Section 2: Posted Institutional Requirements */}
      {activeTab === 'REQUIREMENTS' && (
        <div className="bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-sm space-y-5 animate-fade-in card-premium">
        {institution && !institution.verified && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl flex items-start space-x-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-sans font-bold text-amber-950">Accreditation Pending Admin Verification</h4>
              <p className="text-xs font-sans text-amber-800 mt-1 leading-relaxed">
                Institution <strong>{institution.name}</strong> (License: <code className="font-mono bg-amber-100 px-1 rounded">{institution.registrationNumber}</code>) is unverified. Legal accreditation must be approved by Compliance Admin before requirement postings can be published.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-border">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2.5">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              <span>Authenticity-Audited Requirements</span>
            </h2>
            <p className="text-sm font-sans text-slate-500 mt-1">
              Requirements evaluated by the CareTrace automated rule-based scoring engine
            </p>
          </div>

          <button
            onClick={() => {
              if (institution?.verified) setIsNewReqOpen(true);
            }}
            disabled={!institution?.verified}
            title={!institution?.verified ? 'Accreditation approval required to post requirements' : 'Post requirement'}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-sans font-bold shadow-sm transition-all ${
              institution?.verified
                ? 'gradient-primary text-white cursor-pointer hover-lift shadow-glow-teal press-effect'
                : 'bg-surface-subtle text-slate-400 cursor-not-allowed border border-surface-border'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{!institution?.verified ? 'Posting Locked' : 'Post New Requirement'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((req, i) => {
            const isApproved = req.status === 'VERIFIED' || req.status === 'FULFILLED';
            const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));

            return (
              <div
                key={req.id}
                className={`card-premium p-6 rounded-2xl border border-surface-border bg-surface-card hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between hover:shadow-card-hover animate-fade-up stagger-${(i % 6) + 1}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-surface-subtle text-slate-700 shadow-sm">
                      {req.category}
                    </span>
                    <span
                      className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                        req.status === 'FULFILLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'VERIFIED'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-slate-900 mt-2 leading-snug">{req.title}</h3>
                  <p className="text-sm font-sans text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{req.description}</p>

                  {/* Authenticity Score Badge */}
                  <div className="mt-4 p-3 bg-surface-subtle rounded-xl border border-surface-border flex items-center justify-between text-xs font-sans shadow-inner">
                    <span className="text-slate-600 font-bold">Authenticity Score:</span>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded shadow-sm border ${
                        req.authenticityScore >= 75
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : req.authenticityScore >= 60
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {req.authenticityScore}/100
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-sans font-medium text-slate-600 mb-1.5">
                      <span>Fulfilled:</span>
                      <span className="font-bold text-slate-800">
                        {req.fulfilledQuantity} / {req.targetQuantity} {req.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-subtle border border-surface-border/50 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${req.status === 'FULFILLED' ? 'bg-emerald-600' : 'bg-teal-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-surface-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatRelativeTime(req.createdAt)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(req)}
                      className="px-3 py-1.5 bg-surface-subtle hover:bg-white text-slate-700 rounded-lg text-xs font-sans font-bold border border-surface-border flex items-center space-x-1.5 transition-colors shadow-sm press-effect"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    {req.status !== 'FULFILLED' && (
                      <button
                        onClick={() => handleCloseRequirement(req.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-sans font-bold border border-rose-200 flex items-center space-x-1.5 transition-colors shadow-sm press-effect"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Close</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Section 3: Completed Receipts & Delivery Proofs */}
      {activeTab === 'CERTIFICATES' && (
        <div className="bg-surface-card rounded-[2rem] p-6 sm:p-8 border border-surface-border shadow-sm space-y-5 animate-fade-in card-premium">
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-teal-700" />
            <span>Ledger-Confirmed Handover Proofs</span>
          </h2>

          <div className="divide-y divide-surface-border">
            {completedDonations.map((d) => (
              <div key={d.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-subtle/50 px-2 rounded-xl transition-colors">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-white border border-surface-border px-2 py-0.5 rounded shadow-sm">{d.id}</span>
                    <span className="text-sm font-sans text-slate-700 font-bold">{d.requirementTitle}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-sans font-medium text-slate-500">
                      Delivered {formatRelativeTime(d.deliveryTimestamp || d.updatedAt, { includeTime: true })}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-slate-600 text-[10px] font-sans font-bold">Digital Signature:</span>
                      <span className="font-mono font-bold text-[10px] tracking-tight">{d.recipientSignature}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewCert(d.id)}
                  className="self-start sm:self-auto px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-sans font-bold border border-teal-200 flex items-center space-x-1.5 shadow-sm press-effect"
                >
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>View Certificate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      {/* Post New Requirement Modal */}
      {isNewReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-elevated border border-surface-border max-h-[90vh] overflow-y-auto animate-slide-up card-premium custom-scrollbar">
            <h3 className="text-2xl font-display font-bold text-slate-900">Post Institutional Childcare Need</h3>
            <p className="text-sm font-sans text-slate-500 mt-1">
              The submission will be evaluated live by the CareTrace fraud & demand scoring engine.
            </p>

            <form onSubmit={handleCreateRequirement} className="mt-6 space-y-4 text-sm font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Requirement Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Bags Ponni Boiled Rice & Toor Dal"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Category:</label>
                  <select
                    value={reqCategory}
                    onChange={(e: any) => setReqCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-medium"
                  >
                    <option value="FOOD">Food & Nutrition</option>
                    <option value="CLOTHING">Clothing & Wear</option>
                    <option value="MEDICINE">Medical & First Aid</option>
                    <option value="SUPPLIES">Bedding & Hygiene</option>
                    <option value="EDUCATION">Education & Toys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Urgency:</label>
                  <select
                    value={reqUrgency}
                    onChange={(e: any) => setReqUrgency(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Quantity Needed:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Unit of Measure:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. boxes, jackets, sets"
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Clinical / Need Description:</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this allocation is requested and for which age cohort..."
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                />
              </div>

              {liveScoring && (
                <div className={`p-4 rounded-2xl border transition-all shadow-sm ${
                  liveScoring.score >= 80
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : liveScoring.score >= 60
                    ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                    : 'bg-rose-50/90 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 font-sans font-bold text-sm">
                      <ShieldCheck className={`w-4.5 h-4.5 ${
                        liveScoring.score >= 80 ? 'text-emerald-600' : liveScoring.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                      }`} />
                      <span>Live Authenticity & Fraud Risk Preview</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${
                      liveScoring.score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : liveScoring.score >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {liveScoring.score}/100 • {liveScoring.riskLevel} Risk
                    </span>
                  </div>

                  {/* Real-time score meter bar */}
                  <div className="w-full h-2 bg-white/50 border border-black/5 rounded-full overflow-hidden my-3 shadow-inner">
                    <div
                      className={`h-full transition-all duration-300 ease-out ${
                        liveScoring.score >= 80 ? 'bg-emerald-600' : liveScoring.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${liveScoring.score}%` }}
                    />
                  </div>

                  {/* Dynamic Rule Feedback / Detected Anomalies */}
                  {liveScoring.flags.length > 0 ? (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-rose-200/60 text-xs font-sans font-medium">
                      {liveScoring.flags.map((flag, idx) => (
                        <p key={idx} className="flex items-start space-x-2 text-rose-800">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                          <span>{flag.message}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-sans font-bold text-emerald-800 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Claim matches registered capacity ({institution?.capacity || 48} children). Direct verified donor listing!</span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsNewReqOpen(false)}
                  className="px-5 py-2.5 font-sans font-bold text-slate-600 hover:text-slate-900 hover:bg-surface-subtle rounded-xl transition-colors press-effect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq || !reqTitle}
                  className="px-6 py-2.5 font-sans font-bold gradient-primary text-white rounded-xl shadow-glow-teal hover-lift transition-all disabled:opacity-50 press-effect"
                >
                  {isSubmittingReq ? 'Auditing Request...' : 'Audit & Post Need'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-elevated border border-surface-border max-h-[90vh] overflow-y-auto animate-slide-up card-premium custom-scrollbar">
            <h3 className="text-2xl font-display font-bold text-slate-900">Edit Institutional Requirement</h3>
            <p className="text-sm font-sans text-slate-500 mt-1">
              Update requirement details and parameters for ID <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{editingReq.id}</span>
            </p>

            <form onSubmit={handleUpdateRequirementSubmit} className="mt-6 space-y-4 text-sm font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Requirement Title:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Category:</label>
                  <select
                    value={editCategory}
                    onChange={(e: any) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-medium"
                  >
                    <option value="FOOD">FOOD</option>
                    <option value="CLOTHING">CLOTHING</option>
                    <option value="MEDICINE">MEDICINE</option>
                    <option value="SUPPLIES">SUPPLIES</option>
                    <option value="EDUCATION">EDUCATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Urgency:</label>
                  <select
                    value={editUrgency}
                    onChange={(e: any) => setEditUrgency(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-medium"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Target Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Unit of Measure:</label>
                  <input
                    type="text"
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Need Description:</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                />
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setEditingReq(null)}
                  className="px-5 py-2.5 font-sans font-bold text-slate-600 hover:text-slate-900 hover:bg-surface-subtle rounded-xl transition-colors press-effect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingReq}
                  className="px-6 py-2.5 font-sans font-bold gradient-primary text-white rounded-xl shadow-glow-teal hover-lift transition-all disabled:opacity-50 press-effect"
                >
                  {isUpdatingReq ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tactile QR Scanner Modal for Handover */}
      {isScannerOpen && (
        <TactileQRScanner
          title="Scan Handover Consignment QR"
          subtitle="Point camera at courier delivery package QR code"
          quickScanDonations={incomingDonations.map(d => ({
            id: d.id,
            title: `${d.requirementTitle} (${d.items[0]?.quantity || ''} ${d.items[0]?.unit || ''})`,
            payload: d.id
          }))}
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Handover Signature & Receipt Verification Dialog */}
      {pendingHandoverDonationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-card rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevated border border-surface-border max-h-[90vh] overflow-y-auto animate-slide-up card-premium custom-scrollbar">
            <h3 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Confirm Consignment Handover</span>
            </h3>
            <p className="text-sm font-sans text-slate-500 mt-1">
              Authenticating receipt of <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{pendingHandoverDonationId}</span>
            </p>

            <div className="mt-6 space-y-4 text-sm font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Receiving Official:</label>
                <input
                  type="text"
                  value={handoverRecipientName}
                  onChange={(e) => setHandoverRecipientName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Inspection Notes:</label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-canvas border border-surface-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-inner transition-all"
                />
              </div>

              {/* Optional Photo Proof Upload */}
              <div className="p-4 bg-surface-subtle rounded-xl border border-surface-border shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-800 font-bold flex items-center space-x-2 text-sm">
                    <Camera className="w-4 h-4 text-teal-700" />
                    <span>Handover Photo Proof</span>
                  </label>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-surface-border">Optional</span>
                </div>
                <p className="text-xs font-medium text-slate-500 mb-3">
                  Attach photo evidence of received consignment to anchor on the immutable delivery ledger block.
                </p>

                {handoverPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 shadow-sm">
                    <img
                      src={handoverPhoto}
                      alt="Handover Preview"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-center text-white text-xs">
                      <span className="font-bold flex items-center space-x-1.5 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Photo Attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setHandoverPhoto(null)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-bold flex items-center space-x-1.5 transition-colors press-effect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-surface-border hover:border-teal-500 rounded-xl cursor-pointer text-slate-600 hover:text-teal-800 transition-colors bg-white hover:bg-teal-50 press-effect">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold">Upload Local Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setHandoverPhoto(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const sample = generateSamplePhoto(pendingHandoverDonationId);
                        setHandoverPhoto(sample);
                      }}
                      className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-colors shadow-sm press-effect"
                    >
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Use Sample Photo</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs font-sans text-emerald-950 space-y-2 shadow-inner">
                <span className="font-bold block text-sm">Ledger Finalization:</span>
                <p className="flex items-start space-x-2"><span className="text-emerald-700 font-bold">1.</span> <span>Mines final <code className="bg-emerald-100 px-1 rounded font-mono font-bold text-[10px]">DELIVERY_CONFIRMED</code> block.</span></p>
                <p className="flex items-start space-x-2"><span className="text-emerald-700 font-bold">2.</span> <span>Generates immutable cryptographic Proof of Delivery Certificate.</span></p>
                <p className="flex items-start space-x-2"><span className="text-emerald-700 font-bold">3.</span> <span>Pushes instant push notification to the Donor.</span></p>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-surface-border">
              <button
                onClick={() => {
                  setPendingHandoverDonationId(null);
                  setHandoverPhoto(null);
                }}
                className="px-5 py-2.5 font-sans font-bold text-slate-600 hover:text-slate-900 hover:bg-surface-subtle rounded-xl transition-colors press-effect"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={isConfirmingHandover}
                className="px-6 py-2.5 font-sans font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 press-effect"
              >
                {isConfirmingHandover ? 'Sealing on Ledger...' : 'Sign & Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Certificate Modal */}
      {selectedCertificate && (
        <ProofOfDeliveryModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};

