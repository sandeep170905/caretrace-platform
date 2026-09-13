import React, { useState, useEffect } from 'react';
import { User, Institution, Requirement, Donation, ProofOfDeliveryCertificate } from '@caretrace/shared';
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
  Check
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

interface InstitutionDashboardProps {
  user: User;
  refreshKey?: number;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ user, refreshKey }) => {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [incomingDonations, setIncomingDonations] = useState<Donation[]>([]);
  const [completedDonations, setCompletedDonations] = useState<Donation[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ProofOfDeliveryCertificate | null>(null);

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

  // Handover confirmation modal
  const [pendingHandoverDonationId, setPendingHandoverDonationId] = useState<string | null>(null);
  const [handoverRecipientName, setHandoverRecipientName] = useState(user.name);
  const [handoverNotes, setHandoverNotes] = useState('Physical consignment inspected and approved in full.');
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
        actorId: user.id
      });

      if (res.success) {
        setHandoverSuccessBanner(`Donation ${pendingHandoverDonationId} sealed on ledger! Proof of delivery certificate minted.`);
        setPendingHandoverDonationId(null);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Institution Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-xs text-emerald-200 font-medium mb-3">
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Accredited Childcare Sanctuary Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {institution?.name || "Anbu Illam Children's Sanctuary"}
          </h1>
          <p className="text-xs text-emerald-200/90 mt-1 font-mono">
            License: {institution?.registrationNumber} • {institution?.address}, {institution?.city}
          </p>
        </div>

        {/* Institution Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Children in Care</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">
              {institution?.currentChildrenCount} <span className="text-xs font-normal text-emerald-300">/ {institution?.capacity}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Trust Rating</span>
            <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{institution?.trustScore}%</p>
            <span className="text-[10px] text-emerald-200 flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>Identity Verified</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Incoming Deliveries</span>
            <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{incomingDonations.length}</p>
            <span className="text-[10px] text-teal-200">En Route via Courier</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-emerald-200 font-medium">Ledger Confirmed</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{completedDonations.length}</p>
            <span className="text-[10px] text-emerald-200">Sealed Receipts</span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {handoverSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{handoverSuccessBanner}</span>
          </div>
          <button
            onClick={() => setHandoverSuccessBanner(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Incoming Consignments & Handover QR Scan */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ArrowDownLeft className="w-5 h-5 text-teal-700" />
              <span>Incoming Deliveries Awaiting Handover Confirmation</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect incoming courier shipments and authenticate arrival via QR scan
            </p>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Handover QR</span>
          </button>
        </div>

        {incomingDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingDonations.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                      {d.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{d.requirementTitle}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Donor: <span className="font-semibold">{d.donorName}</span>
                  </p>

                  <div className="mt-3 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Consignment Items:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {d.items.map(it => `${it.quantity} ${it.unit} ${it.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Courier: {d.pickupAgentName || 'Sakthivel S'}
                  </span>
                  <button
                    onClick={() => {
                      setPendingHandoverDonationId(d.id);
                    }}
                    className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No incoming deliveries pending handover scan.
          </div>
        )}
      </div>

      {/* Section 2: Posted Institutional Requirements */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
        {institution && !institution.verified && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl flex items-start space-x-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950">Accreditation Pending Admin Verification</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Institution <strong>{institution.name}</strong> (License: <code>{institution.registrationNumber}</code>) is unverified. Legal accreditation must be approved by Compliance Admin (Sandeep) before requirement postings can be published.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              <span>Authenticity-Audited Requirements</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Requirements evaluated by the CareTrace automated rule-based scoring engine
            </p>
          </div>

          <button
            onClick={() => {
              if (institution?.verified) setIsNewReqOpen(true);
            }}
            disabled={!institution?.verified}
            title={!institution?.verified ? 'Accreditation approval required to post requirements' : 'Post requirement'}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              institution?.verified
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{!institution?.verified ? 'Posting Locked (Pending Approval)' : 'Post New Requirement'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requirements.map((req) => {
            const isApproved = req.status === 'VERIFIED' || req.status === 'FULFILLED';
            const progress = Math.min(100, Math.round((req.fulfilledQuantity / req.targetQuantity) * 100));

            return (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                  <h3 className="text-sm font-bold text-slate-900 mt-2.5">{req.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{req.description}</p>

                  {/* Authenticity Score Badge */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Authenticity Score:</span>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        req.authenticityScore >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.authenticityScore >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.authenticityScore}/100
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Fulfilled:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {req.fulfilledQuantity} / {req.targetQuantity} {req.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${req.status === 'FULFILLED' ? 'bg-emerald-600' : 'bg-teal-700'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEditModal(req)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 flex items-center space-x-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    {req.status !== 'FULFILLED' && (
                      <button
                        onClick={() => handleCloseRequirement(req.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium border border-rose-200 flex items-center space-x-1 transition-colors"
                      >
                        <XCircle className="w-3 h-3 text-rose-500" />
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

      {/* Section 3: Completed Receipts & Delivery Proofs */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Award className="w-5 h-5 text-teal-700" />
          <span>Ledger-Confirmed Handover Proofs</span>
        </h2>

        <div className="divide-y divide-slate-100">
          {completedDonations.map((d) => (
            <div key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{d.id}</span>
                  <span className="text-xs text-slate-600 font-semibold">{d.requirementTitle}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Delivered on {new Date(d.deliveryTimestamp || d.updatedAt).toLocaleDateString()} • Signature: <span className="font-mono">{d.recipientSignature}</span>
                </p>
              </div>

              <button
                onClick={() => handleViewCert(d.id)}
                className="self-start sm:self-auto px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold border border-teal-200 flex items-center space-x-1"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View Certificate</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Post New Requirement Modal */}
      {isNewReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Post Institutional Childcare Need</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The submission will be evaluated live by the CareTrace fraud & demand scoring engine.
            </p>

            <form onSubmit={handleCreateRequirement} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Requirement Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Bags Ponni Boiled Rice & Toor Dal"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category:</label>
                  <select
                    value={reqCategory}
                    onChange={(e: any) => setReqCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="FOOD">Food & Nutrition</option>
                    <option value="CLOTHING">Clothing & Wear</option>
                    <option value="MEDICINE">Medical & First Aid</option>
                    <option value="SUPPLIES">Bedding & Hygiene</option>
                    <option value="EDUCATION">Education & Toys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Urgency:</label>
                  <select
                    value={reqUrgency}
                    onChange={(e: any) => setReqUrgency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quantity Needed:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit of Measure:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. boxes, jackets, sets"
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Clinical / Need Description:</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this allocation is requested and for which age cohort..."
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              {scoringFeedback && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 space-y-1">
                  <span className="font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>Rule Engine Score: {scoringFeedback.score}/100 ({scoringFeedback.riskLevel} Risk)</span>
                  </span>
                  <p className="text-[11px] text-teal-800">
                    {scoringFeedback.isApproved
                      ? 'Approved for verified donor listing!'
                      : 'Flagged for compliance review.'}
                  </p>
                </div>
              )}

              <div className="mt-5 flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReqOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq || !reqTitle}
                  className="px-5 py-2 font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Edit Institutional Requirement</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update requirement details and parameters for ID <span className="font-mono text-teal-800">{editingReq.id}</span>
            </p>

            <form onSubmit={handleUpdateRequirementSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Requirement Title:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category:</label>
                  <select
                    value={editCategory}
                    onChange={(e: any) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="FOOD">FOOD</option>
                    <option value="CLOTHING">CLOTHING</option>
                    <option value="MEDICINE">MEDICINE</option>
                    <option value="SUPPLIES">SUPPLIES</option>
                    <option value="EDUCATION">EDUCATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Urgency:</label>
                  <select
                    value={editUrgency}
                    onChange={(e: any) => setEditUrgency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit of Measure:</label>
                  <input
                    type="text"
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Need Description:</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReq(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingReq}
                  className="px-5 py-2 font-semibold bg-teal-800 hover:bg-teal-900 text-white rounded-xl shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Consignment Handover</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authenticating receipt of <span className="font-mono font-bold text-teal-800">{pendingHandoverDonationId}</span>
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Receiving Official:</label>
                <input
                  type="text"
                  value={handoverRecipientName}
                  onChange={(e) => setHandoverRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Inspection Inspection Notes:</label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 space-y-1">
                <span className="font-bold block">Ledger Finalization:</span>
                <p>1. Mines final <code className="bg-emerald-100 px-1 rounded">DELIVERY_CONFIRMED</code> block.</p>
                <p>2. Generates immutable cryptographic Proof of Delivery Certificate.</p>
                <p>3. Pushes instant push notification to the Donor.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setPendingHandoverDonationId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={isConfirmingHandover}
                className="px-5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm disabled:opacity-50"
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
