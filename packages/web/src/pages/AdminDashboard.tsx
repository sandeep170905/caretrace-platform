import React, { useState, useEffect } from 'react';
import { User, Institution, Requirement, RiskFlag, Donation } from '@caretrace/shared';
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
  PackageCheck
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
  autoAssignAllCouriers
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
  const [activeTab, setActiveTab] = useState<'FRAUD_LOGS' | 'VERIFICATION_QUEUE' | 'COURIER_DISPATCH' | 'LEDGER_EXPLORER'>('FRAUD_LOGS');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, logs, insts, reqs, pDonations] = await Promise.all([
        fetchAdminStats(),
        fetchRiskLogs(),
        fetchInstitutions(),
        fetchRequirements(),
        fetchPendingCourierAssignments()
      ]);
      setStats(statsRes.stats);
      setRiskLogs(logs);
      setInstitutions(insts);
      setRequirements(reqs);
      setPendingDonations(pDonations);
    } catch (e) {
      console.error('Failed to load admin metrics:', e);
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-rose-800">{req.category}</span>
                      <span className="text-xs font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                        Score: {req.authenticityScore}/100
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">{req.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{req.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Institution: <span className="font-semibold">{req.institutionName}</span>
                    </p>

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
    </div>
  );
};

