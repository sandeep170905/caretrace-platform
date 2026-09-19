import React, { useState, useEffect } from 'react';
import { User, Institution, Requirement, RiskFlag, Donation, Announcement, AnnouncementUrgency } from '@caretrace/shared';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  Sparkles,
  Users,
  Activity,
  Check,
  Truck,
  Send,
  PackageCheck,
  Megaphone,
  Radio,
  Trash2,
  Clock,
  Cpu,
  Info,
  X
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchRiskLogs,
  fetchInstitutions,
  verifyInstitution,
  resolveRiskLog,
  fetchRequirements,
  fetchPendingCourierAssignments,
  assignCourier,
  autoAssignAllCouriers,
  fetchAdminAnnouncements,
  createAnnouncement,
  dismissAnnouncement
} from '../api/client';
import { LedgerExplorer } from '../components/LedgerExplorer';

interface AdminDashboardProps {
  user: User;
  refreshKey?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, refreshKey }) => {
  const [stats, setStats] = useState<any | null>(null);
  const [riskLogs, setRiskLogs] = useState<RiskFlag[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<'FRAUD_LOGS' | 'VERIFICATION_QUEUE' | 'COURIER_DISPATCH' | 'LEDGER_EXPLORER' | 'BROADCASTS'>('FRAUD_LOGS');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  // Broadcast announcement form state
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastUrgency, setBroadcastUrgency] = useState<AnnouncementUrgency>('URGENT');
  const [broadcastExpiresAt, setBroadcastExpiresAt] = useState<string>('');
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState<boolean>(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, logs, insts, reqs, pDonations, anns] = await Promise.all([
        fetchAdminStats(),
        fetchRiskLogs(),
        fetchInstitutions(),
        fetchRequirements(),
        fetchPendingCourierAssignments(),
        fetchAdminAnnouncements()
      ]);
      setStats(statsRes.stats);
      setRiskLogs(logs);
      setInstitutions(insts);
      setRequirements(reqs);
      setPendingDonations(pDonations);
      setAnnouncements(anns);
    } catch (e) {
      console.error('Failed to load admin metrics:', e);
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsSubmittingBroadcast(true);
    setBroadcastFeedback(null);
    try {
      const res = await createAnnouncement({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        urgency: broadcastUrgency,
        expiresAt: broadcastExpiresAt ? new Date(broadcastExpiresAt).toISOString() : undefined
      });
      if (res.success) {
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastExpiresAt('');
        setBroadcastFeedback('Broadcast notice posted live across CareTrace platform.');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to broadcast announcement:', err);
      setBroadcastFeedback('Failed to post announcement. Please try again.');
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const handleDismissBroadcast = async (id: string) => {
    setIsProcessing(true);
    try {
      const res = await dismissAnnouncement(id);
      if (res.success) {
        setBroadcastFeedback('Announcement deactivated.');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to dismiss announcement:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignCourier = async (donationId: string, agentId: string) => {
    setIsProcessing(true);
    try {
      const res = await assignCourier(donationId, agentId);
      setDispatchMsg(res.message || `Courier assigned to consignment ${donationId}`);
      await loadData();
    } catch (e) {
      console.error('Failed to assign courier:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoAssignAll = async () => {
    setIsProcessing(true);
    try {
      const res = await autoAssignAllCouriers();
      setDispatchMsg(res.message || `Dispatched all consignments to courier`);
      await loadData();
    } catch (e) {
      console.error('Failed to auto-assign couriers:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id, refreshKey]);

  const handleVerifyInstitution = async (id: string) => {
    setIsProcessing(true);
    try {
      await verifyInstitution(id);
      await loadData();
    } catch (e) {
      console.error('Failed to verify institution:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveFlag = async (ruleId: string) => {
    try {
      await resolveRiskLog(ruleId, user.name);
      await loadData();
    } catch (e) {
      console.error('Failed to resolve flag:', e);
    }
  };

  const pendingInstitutions = institutions.filter(i => !i.verified);
  const pendingRequirements = requirements.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-800/40 border border-purple-500/40 text-xs text-purple-200 font-medium mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
            <span>Platform Governance & Fraud Risk Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Compliance Command: {user.name}
          </h1>
          <p className="text-xs text-purple-200/90 mt-1">
            Supervise legal institution verification, inspect automated risk detections, and audit cryptographic ledger state.
          </p>
        </div>

        {/* Platform High-Level KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-800/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-purple-200 font-medium">Child Capacity</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{stats?.totalChildrenSupported || 156}</p>
            <span className="text-[10px] text-purple-200">Across 3 Sanctuaries</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-purple-200 font-medium">Ledger Checkpoints</span>
            <p className="text-2xl font-bold text-teal-300 mt-1 font-mono">{stats?.totalLedgerBlocks || 6}</p>
            <span className="text-[10px] text-teal-200 flex items-center space-x-1 mt-0.5">
              <CheckCircle className="w-3 h-3" />
              <span>Chain: {stats?.chainIntegrityStatus || 'SECURE'}</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-purple-200 font-medium">Flagged Risk Alerts</span>
            <p className="text-2xl font-bold text-rose-300 mt-1 font-mono">{riskLogs.filter(r => !r.resolved).length}</p>
            <span className="text-[10px] text-rose-200">Pending Review</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-purple-200 font-medium">Pending Verifications</span>
            <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{pendingInstitutions.length}</p>
            <span className="text-[10px] text-amber-200">NGO Approvals</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('FRAUD_LOGS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'FRAUD_LOGS'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Risk & Fraud Detections ({riskLogs.filter(l => !l.resolved).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFICATION_QUEUE')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'VERIFICATION_QUEUE'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-teal-400" />
          <span>Institutional Verification Queue ({pendingInstitutions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COURIER_DISPATCH')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COURIER_DISPATCH'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>Courier Dispatch ({pendingDonations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER_EXPLORER')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'LEDGER_EXPLORER'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ledger Integrity Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('BROADCASTS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BROADCASTS'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-teal-400" />
          <span>Broadcast Announcements ({announcements.filter(a => a.active).length})</span>
        </button>
      </div>

      {/* Dispatch Feedback Banner */}
      {dispatchMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between text-xs animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{dispatchMsg}</span>
          </div>
          <button onClick={() => setDispatchMsg(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Risk & Fraud Flag Review List */}
      {activeTab === 'FRAUD_LOGS' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Automated Heuristic Detections (FraudScoringService)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rule-based audit catches anomalous capacity claims, unverified licenses, velocity surges, and transit timing mismatches
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {riskLogs.map((log, index) => {
              const isResolved = log.resolved;
              return (
                <div key={index} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.severity === 'CRITICAL' || log.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {log.severity} SEVERITY
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">{log.ruleId}</span>
                      <span className="text-xs text-slate-500">• {log.ruleName}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 mt-1.5 leading-relaxed bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 text-rose-950">
                      {log.message}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                      <span>Triggered: {new Date(log.triggeredAt).toLocaleString()}</span>
                      {isResolved && (
                        <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Resolved by {log.resolvedBy}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => handleResolveFlag(log.ruleId)}
                      className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    >
                      Resolve & Clear
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Institutional Verification Queue */}
      {activeTab === 'VERIFICATION_QUEUE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Building className="w-5 h-5 text-teal-700" />
              <span>Pending Institutional Accreditation</span>
            </h3>

            {pendingInstitutions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingInstitutions.map((inst) => (
                  <div key={inst.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{inst.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          PROVISIONAL UNVERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{inst.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                        <span>Registration: <code className="font-mono text-slate-700">{inst.registrationNumber}</code></span>
                        <span>Capacity: {inst.currentChildrenCount} / {inst.capacity} kids</span>
                        <span>Location: {inst.address}, {inst.city}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVerifyInstitution(inst.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve & Verify NGO</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                All registered childcare institutions are verified.
              </div>
            )}
          </div>

          {/* Pending Requirements Queue */}
          <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-purple-700" />
              <span>Flagged / Pending Requirements Awaiting Manual Review</span>
            </h3>

            {pendingRequirements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequirements.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                        {req.category}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded border border-rose-300 shadow-xs">
                          Rule Score: {req.authenticityScore}/100
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shadow-xs flex items-center space-x-1 cursor-help ${
                            (req.mlRiskScore ?? 0.89) >= 0.7
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : (req.mlRiskScore ?? 0.89) >= 0.35
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                          title="Trained on limited synthetic demo data — illustrative of the approach, not production-calibrated"
                        >
                          <Cpu className="w-3 h-3 text-purple-600" />
                          <span>
                            ML Risk: {req.mlRiskScore !== undefined ? `${(req.mlRiskScore * 100).toFixed(0)}%` : '89%'} ({req.mlRiskTier || 'HIGH'})
                          </span>
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">{req.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{req.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Institution: <span className="font-semibold text-slate-800">{req.institutionName}</span>
                    </p>

                    {/* Dual Engine ML Risk Analysis Banner */}
                    <div className="mt-3 p-2.5 bg-purple-50/80 rounded-lg border border-purple-200 text-xs text-purple-950 space-y-1.5">
                      <div className="flex items-center space-x-1.5 font-bold text-purple-900">
                        <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                        <span>ML Secondary Classifier Insight</span>
                      </div>
                      <p className="text-[11px] text-purple-800 leading-snug">
                        {(req.mlRiskScore ?? 0.89) >= 0.7
                          ? 'High probability anomaly detected: requisition volume substantially exceeds institutional capacity envelope for unverified provisional status.'
                          : 'ML feature analysis indicates normal demand profile within historical bounds.'}
                      </p>
                      <p className="text-[10px] text-purple-700/80 italic pt-1 border-t border-purple-200/60 flex items-center space-x-1">
                        <Info className="w-3 h-3 text-purple-500 shrink-0" />
                        <span>Trained on limited synthetic demo data — illustrative of the approach, not production-calibrated.</span>
                      </p>
                    </div>

                    {req.riskFlags.length > 0 && (
                      <div className="mt-3 p-2 bg-white rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                        <span className="font-bold block">Triggered Fraud Rules:</span>
                        {req.riskFlags.map((f, i) => (
                          <p key={i} className="text-[11px]">• {f.message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No requirements currently quarantined in pending review.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Courier Dispatch & Logistics */}
      {activeTab === 'COURIER_DISPATCH' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Active Logistics Queue: Pledged Consignments Awaiting Courier</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch verified field couriers to authenticate pickup manifests and seal custody blocks on-chain
              </p>
            </div>

            {pendingDonations.length > 0 && (
              <button
                onClick={handleAutoAssignAll}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Auto-Dispatch All to Sakthivel S</span>
              </button>
            )}
          </div>

          {pendingDonations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {pendingDonations.map((d) => (
                <div key={d.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {d.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        AWAITING COURIER
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        • {d.requirementTitle}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1">
                      <p>Donor: <strong className="text-slate-800">{d.donorName}</strong> ({d.donorEmail})</p>
                      <p>Destination: <strong className="text-slate-800">{d.institutionName}</strong></p>
                      <p className="sm:col-span-2">
                        Items: {d.items.map((it: any) => `${it.quantity} ${it.unit} ${it.name}`).join(', ')}
                      </p>
                      <p className="sm:col-span-2 text-slate-500">
                        Pickup Location: {d.pickupAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleAssignCourier(d.id, 'user-agent-sakthivel')}
                      disabled={isProcessing}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Sakthivel S</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <PackageCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">All Pledged Consignments Dispatched</p>
              <p className="max-w-sm mx-auto">
                There are no pending donations awaiting pickup assignment. New donations pledged on the public board will appear here for courier dispatch.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Embedded Cryptographic Ledger Explorer */}
      {activeTab === 'LEDGER_EXPLORER' && (
        <LedgerExplorer />
      )}

      {/* Tab 5: Broadcast Announcements Manager */}
      {activeTab === 'BROADCASTS' && (
        <div className="space-y-8 animate-fade-in">
          {/* Post New Announcement Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-teal-600" />
                  <span>Broadcast Platform-Wide Notice</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Broadcast urgent relief appeals or general platform updates. Active notices stream live via SSE to the Public Request Board, Donor Dashboard, and Institution Dashboard without page refresh.
                </p>
              </div>

              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                <span>Live SSE Stream Ready</span>
              </span>
            </div>

            {broadcastFeedback && (
              <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-950 rounded-2xl flex items-center justify-between text-xs animate-fade-in shadow-xs">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="font-semibold">{broadcastFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBroadcastFeedback(null)}
                  className="text-teal-700 hover:text-teal-900 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              {/* Urgency Level Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Notice Urgency Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBroadcastUrgency('URGENT')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                      broadcastUrgency === 'URGENT'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200 text-rose-950'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${broadcastUrgency === 'URGENT' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold">🚨 Urgent Relief Appeal</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        High-priority crimson banner with pulsing indicator. Best for supply shortfalls, urgent needs, or critical logistical updates.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastUrgency('GENERAL')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                      broadcastUrgency === 'GENERAL'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-200 text-teal-950'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Megaphone className={`w-5 h-5 shrink-0 mt-0.5 ${broadcastUrgency === 'GENERAL' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold">📢 General Platform Update</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Informational indigo/teal banner. Best for platform announcements, milestones, feature additions, or standard notes.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Critical Infant Nutrition Shortfall: Ambattur Sanctuary"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Announcement Details & Action Instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Describe the context, specific items or monetary pledges needed, and any coordination instructions..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Optional Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Optional Expiry Date
                  </label>
                  <input
                    type="date"
                    value={broadcastExpiresAt}
                    onChange={(e) => setBroadcastExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Leave blank to keep active until manually dismissed.
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                    className="w-full sm:w-auto px-6 py-3 bg-purple-900 hover:bg-purple-950 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {isSubmittingBroadcast ? (
                      <span>Broadcasting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Broadcast Platform Notice Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Broadcast History & Early Dismissal List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Broadcast History & Active Notices</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-mono">
                    {announcements.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage live broadcast notices and deactivate early when resolved.
                </p>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <Megaphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No broadcast announcements recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map((ann) => {
                  const isExpired = ann.expiresAt && new Date(ann.expiresAt) <= new Date();
                  const isLive = ann.active && !isExpired;

                  return (
                    <div key={ann.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              ann.urgency === 'URGENT'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {ann.urgency === 'URGENT' ? '🚨 URGENT APPEAL' : '📢 GENERAL UPDATE'}
                          </span>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                              isLive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                            <span>{isLive ? 'ACTIVE ON PLATFORM' : ann.active ? 'EXPIRED' : 'DISMISSED EARLY'}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {ann.id}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-slate-900">{ann.title}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>By: {ann.createdBy || 'Platform Admin'}</span>
                          <span>•</span>
                          <span>Posted: {new Date(ann.createdAt).toLocaleString()}</span>
                          {ann.expiresAt && (
                            <>
                              <span>•</span>
                              <span>Expires: {new Date(ann.expiresAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Button: Dismiss Early */}
                      <div className="shrink-0 flex items-center">
                        {isLive ? (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDismissBroadcast(ann.id)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50 shadow-xs"
                            title="Deactivate notice from all active dashboards immediately"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Dismiss Early</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Inactive</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

