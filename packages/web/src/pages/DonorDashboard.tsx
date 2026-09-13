import React, { useState, useEffect } from 'react';
import { User, Donation, Requirement, ProofOfDeliveryCertificate } from '@caretrace/shared';
import {
  Heart,
  Package,
  Award,
  ChevronRight,
  Plus,
  QrCode,
  ShieldCheck,
  Building,
  Truck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import {
  fetchDonations,
  fetchDonationDetail,
  fetchRequirements,
  createDonation,
  fetchProofCertificate
} from '../api/client';
import { ChainOfCustodyTimeline } from '../components/ChainOfCustodyTimeline';
import { LiveTransitMap } from '../components/LiveTransitMap';
import { ProofOfDeliveryModal } from '../components/ProofOfDeliveryModal';

interface DonorDashboardProps {
  user: User;
  refreshKey?: number;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ user, refreshKey }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [certificate, setCertificate] = useState<ProofOfDeliveryCertificate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Donation Modal State
  const [pledgeReq, setPledgeReq] = useState<Requirement | null>(null);
  const [pledgeQty, setPledgeQty] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [donationsList, reqsList] = await Promise.all([
        fetchDonations({ donorId: user.id }),
        fetchRequirements({ status: 'VERIFIED' })
      ]);
      setDonations(donationsList);
      setRequirements(reqsList);

      // Default select the active in-transit donation CT-2026-9042 if available
      const activeDonation = donationsList.find(d => d.id === 'CT-2026-9042') || donationsList[0];
      if (activeDonation && !selectedDonation) {
        const detail = await fetchDonationDetail(activeDonation.id);
        setSelectedDonation(detail);
      } else if (selectedDonation) {
        // Refresh selected donation details
        const detail = await fetchDonationDetail(selectedDonation.donation.id);
        setSelectedDonation(detail);
      }
    } catch (err) {
      console.error('Failed to load donor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id, refreshKey]);

  const handleSelectDonation = async (d: Donation) => {
    try {
      const detail = await fetchDonationDetail(d.id);
      setSelectedDonation(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInspectCertificate = async (donationId: string) => {
    const cert = await fetchProofCertificate(donationId);
    if (cert) setCertificate(cert);
  };

  const handleCreateDonation = async () => {
    if (!pledgeReq) return;
    setIsSubmitting(true);
    try {
      const payload = {
        donorId: user.id,
        requirementId: pledgeReq.id,
        type: 'PHYSICAL_GOODS',
        items: [
          {
            name: pledgeReq.title,
            quantity: Number(pledgeQty),
            unit: pledgeReq.unit
          }
        ],
        pickupAddress: 'T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017'
      };

      const result = await createDonation(payload);
      if (result.success) {
        setPledgeReq(null);
        await loadData();
        const detail = await fetchDonationDetail(result.donation.id);
        setSelectedDonation(detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDelivered = donations.filter(d => d.status === 'CONFIRMED').length;
  const inTransitCount = donations.filter(d => ['PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Donor Welcome & Impact Header */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 text-xs text-teal-200 font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Verified Donor Impact Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-teal-100/90 mt-2 leading-relaxed">
            Every donation you pledge is tracked through a cryptographic chain of custody. You have direct proof when goods reach the children in verified care.
          </p>
        </div>

        {/* Impact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-teal-700/60 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-teal-200 font-medium">Consignments Delivered</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{totalDelivered}</p>
            <span className="text-[11px] text-emerald-300 flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Ledger Certified</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-teal-200 font-medium">Active In-Transit</span>
            <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{inTransitCount}</p>
            <span className="text-[11px] text-teal-200 flex items-center space-x-1 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Courier Tracking</span>
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-teal-200 font-medium">Institutions Supported</span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">2</p>
            <span className="text-[11px] text-teal-200 flex items-center space-x-1 mt-0.5">
              <Building className="w-3.5 h-3.5" />
              <span>Accredited Child Shelters</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Split View: Left = My Donations, Right = Active Donation Deep Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Consignments List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Package className="w-4 h-4 text-teal-700" />
              <span>My Tracked Consignments</span>
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {donations.length} total
            </span>
          </div>

          <div className="space-y-3">
            {donations.map((d) => {
              const isSelected = selectedDonation?.donation.id === d.id;
              const isDelivered = d.status === 'CONFIRMED';

              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectDonation(d)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-teal-600 ring-2 ring-teal-100 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{d.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1">{d.requirementTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span>{d.institutionName}</span>
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 mt-1 ${isSelected ? 'text-teal-700' : ''}`} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {d.items.map(i => `${i.quantity} ${i.unit}`).join(', ')}
                    </span>

                    {isDelivered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectCertificate(d.id);
                        }}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Tracking & Detail Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDonation ? (
            <>
              {/* Selected Donation Header Card */}
              <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {selectedDonation.donation.id}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Physical Delivery Consignment</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedDonation.donation.requirementTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Destination: <span className="font-medium">{selectedDonation.donation.institutionName}</span>
                    </p>
                  </div>

                  {/* QR Code Quick View */}
                  {selectedDonation.qrDataUrl && (
                    <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <img
                        src={selectedDonation.qrDataUrl}
                        alt="Donation QR Code"
                        className="w-16 h-16 rounded-lg border border-slate-200 bg-white"
                      />
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Consignment QR</span>
                        <span className="text-[11px] text-teal-800 font-semibold block">Scan at Handover</span>
                        <a
                          href={selectedDonation.qrDataUrl}
                          download={`CareTrace-${selectedDonation.donation.id}-QR.png`}
                          className="text-[10px] text-teal-700 hover:underline inline-flex items-center mt-0.5"
                        >
                          Download QR
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items detail */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {selectedDonation.donation.items.map((it: any, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 font-medium rounded-lg flex items-center space-x-1">
                      <span>{it.quantity} {it.unit} {it.name}</span>
                      {it.estimatedValueInr && (
                        <span className="text-teal-700 font-mono font-semibold">
                          (₹{Number(it.estimatedValueInr).toLocaleString('en-IN')})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chain of Custody Timeline Component */}
              <ChainOfCustodyTimeline
                donation={selectedDonation.donation}
                blocks={selectedDonation.blocks}
                onInspectCertificate={() => handleInspectCertificate(selectedDonation.donation.id)}
              />

              {/* Live Transit Map Component */}
              <LiveTransitMap
                donation={selectedDonation.donation}
                initialTelemetry={selectedDonation.telemetry}
                onStatusAdvanced={loadData}
              />
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 mt-2">Select a consignment to view live tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Catalog: Browse Verified Requirements to Fulfill */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verified Childcare Requirements to Fulfill</h2>
            <p className="text-xs text-slate-500">
              Authenticity-audited requirements posted by registered and verified child sanctuaries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl p-5 border border-[#E7E8E2] hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {req.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      req.urgency === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : req.urgency === 'HIGH'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {req.urgency} Urgency
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">{req.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{req.description}</p>

                <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Target Demand:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {req.fulfilledQuantity} / {req.targetQuantity} {req.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-700 rounded-full"
                      style={{ width: `${Math.min(100, (req.fulfilledQuantity / req.targetQuantity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                  {req.institutionName}
                </div>
                <button
                  onClick={() => setPledgeReq(req)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pledge Donation</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pledge Donation Modal */}
      {pledgeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Pledge Physical Donation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fulfilling demand for <span className="font-medium text-slate-800">{pledgeReq.institutionName}</span>
            </p>

            <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200">
              <span className="text-[10px] uppercase font-bold text-teal-800">Selected Requirement</span>
              <p className="text-xs font-semibold text-teal-950 mt-0.5">{pledgeReq.title}</p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pledge Quantity ({pledgeReq.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={pledgeReq.targetQuantity - pledgeReq.fulfilledQuantity}
                  value={pledgeQty}
                  onChange={(e) => setPledgeQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pickup Logistics Depot:
                </label>
                <input
                  type="text"
                  readOnly
                  value="T. Nagar Wholesale Logistics Hub, Usman Road, Chennai 600017"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Ledger Process:</span>
                <p>1. Unique Donation ID & cryptographic QR code will be minted.</p>
                <p>2. First checkpoint block will be sealed on the SHA-256 ledger.</p>
                <p>3. Dispatch courier will be assigned for authenticated pickup.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setPledgeReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDonation}
                disabled={isSubmitting || pledgeQty <= 0}
                className="px-5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Minting Consignment...' : 'Confirm & Generate QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Certificate Modal */}
      {certificate && (
        <ProofOfDeliveryModal
          certificate={certificate}
          onClose={() => setCertificate(null)}
        />
      )}
    </div>
  );
};
