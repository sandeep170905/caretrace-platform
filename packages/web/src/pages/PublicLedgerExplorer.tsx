import React, { useState, useEffect } from 'react';
import { LedgerBlock, LedgerVerificationResult, formatRelativeTime, formatSmartTimestamp } from '@caretrace/shared';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Hash,
  Copy,
  Check,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FileCode2,
  Lock,
  Layers,
  Award
} from 'lucide-react';
import { fetchLedgerBlocks, verifyLedgerLive } from '../api/client';

interface PublicLedgerExplorerProps {
  initialDonationId?: string;
  onNavigateBack?: () => void;
}

const SAMPLE_DONATIONS = [
  { id: 'CT-2026-8801', title: 'Cotton Bedsheets & Nets', status: 'CONFIRMED', blocks: 4 },
  { id: 'CT-2026-9042', title: 'School Uniform Sets & Notebooks', status: 'IN_TRANSIT', blocks: 2 },
  { id: 'CT-2026-5607', title: '₹1,00,000 Monetary UPI Fund', status: 'SETTLED', blocks: 2 },
  { id: 'CT-2026-8712', title: 'First-Aid Kits & Medical Supplies', status: 'CONFIRMED', blocks: 2 },
  { id: 'CT-2026-8650', title: 'Ponni Boiled Rice Sacks (25kg)', status: 'CONFIRMED', blocks: 2 }
];

export const PublicLedgerExplorer: React.FC<PublicLedgerExplorerProps> = ({
  initialDonationId = '',
  onNavigateBack
}) => {
  const [searchInput, setSearchInput] = useState<string>(initialDonationId);
  const [searchedId, setSearchedId] = useState<string>(initialDonationId);
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [verification, setVerification] = useState<LedgerVerificationResult | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialDonationId));
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const performVerification = async (donationIdToSearch: string) => {
    const cleanId = donationIdToSearch.trim();
    if (!cleanId) return;

    setIsLoading(true);
    setSearchedId(cleanId);
    setHasSearched(true);
    setSelectedBlock(null);

    // Update URL without reloading
    if (window.history.pushState) {
      window.history.pushState({}, '', `/verify?id=${encodeURIComponent(cleanId)}`);
    }

    try {
      const [blocksData, verifyData] = await Promise.all([
        fetchLedgerBlocks(cleanId),
        verifyLedgerLive(cleanId)
      ]);

      setBlocks(blocksData);
      setVerification(verifyData);
      if (blocksData.length > 0) {
        setSelectedBlock(blocksData[blocksData.length - 1]);
      }
    } catch (err) {
      console.error('Failed to verify donation on ledger:', err);
      setBlocks([]);
      setVerification(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on initial mount if ID was passed or present in URL query
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id') || urlParams.get('verify') || initialDonationId;
    if (queryId) {
      setSearchInput(queryId);
      performVerification(queryId);
    }
  }, [initialDonationId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(searchInput);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-teal-900/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-xs text-teal-300 font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>Public Ledger Verification • Zero Login Required</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Independent Donation Verification
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
            Every donation on CareTrace is recorded on a tamper-evident ledger. Anyone can independently verify a donation reached its destination — enter a Donation ID above.
          </p>
        </div>

        {/* Prominent Search Bar */}
        <div className="mt-8 relative z-10 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter a Donation ID to verify its chain of custody (e.g. CT-2026-8801)"
                className="w-full pl-12 pr-28 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-xs sm:text-sm font-semibold border-2 border-teal-500/50 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20 shadow-2xl transition-all font-mono"
              />
              <button
                type="submit"
                disabled={isLoading || !searchInput.trim()}
                className="absolute right-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Chain</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Quick Test Consignments:</span>
            {SAMPLE_DONATIONS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setSearchInput(sample.id);
                  performVerification(sample.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all border ${
                  searchedId === sample.id
                    ? 'bg-teal-500/30 text-teal-200 border-teal-400/60'
                    : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 border-white/10'
                }`}
              >
                {sample.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real Verification Results Area */}
      {hasSearched && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
              <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Traversing SHA-256 Block Hashes...</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">Verifying cryptographic integrity for {searchedId}</p>
            </div>
          ) : blocks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Ledger Trail Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No checkpoint blocks exist on the CareTrace ledger for identifier <span className="font-mono font-bold text-slate-800">"{searchedId}"</span>. Please check the ID or try one of the demo samples above.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Verification Pass / Fail Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  verification?.isValid
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  {verification?.isValid ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                        {verification?.isValid
                          ? 'CRYPTOGRAPHIC INTEGRITY VERIFIED'
                          : 'TAMPERING DETECTED IN CUSTODY TRAIL'}
                      </h3>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          verification?.isValid
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-200 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {verification?.isValid ? 'Status: VALID' : 'Status: INVALID'}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900/90 mt-1">
                      {verification?.isValid ? (
                        <>
                          Consignment <span className="font-mono font-bold">{searchedId}</span> has a completely uncompromised chain of custody. Every block matches its SHA-256 mathematical hash and previous-hash pointer across {blocks.length} recorded checkpoints.
                        </>
                      ) : (
                        verification?.errorDetail || 'Cryptographic mismatch detected in stored ledger data.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="sm:border-l sm:pl-5 border-emerald-200/80 text-left sm:text-right shrink-0 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-emerald-800">
                    Audit Timestamp
                  </span>
                  <p className="text-xs font-mono font-semibold text-slate-800">
                    {verification?.verifiedAt ? formatSmartTimestamp(verification.verifiedAt) : 'Verified'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {verification?.verifiedAt ? formatRelativeTime(verification.verifiedAt) : ''}
                  </p>
                </div>
              </div>

              {/* Chain Head & Checkpoint Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">Verified Donation ID</span>
                  <p className="text-base font-bold font-mono text-teal-800 mt-1">{searchedId}</p>
                  <span className="text-[10px] text-slate-400">Unique Ledger Anchor</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Checkpoint Blocks</span>
                  <p className="text-base font-bold font-mono text-slate-900 mt-1">
                    {blocks.length} {blocks.length === 1 ? 'Block' : 'Blocks'}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Fully Chained</span>
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 block">Chain Head Hash</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(verification?.chainHeadHash || '', 'head')}
                      className="text-[10px] text-teal-700 hover:text-teal-900 flex items-center space-x-0.5 font-medium"
                    >
                      {copiedHash === 'head' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash === 'head' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate select-all" title={verification?.chainHeadHash}>
                    {verification?.chainHeadHash ? `${verification.chainHeadHash.slice(0, 16)}...` : 'N/A'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">SHA-256 Merkle Head</span>
                </div>
              </div>

              {/* Walkable Block-by-Block Visual List (Same pattern as Admin Ledger Explorer) */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-teal-700" />
                      <span>Walkable Chain of Custody ({blocks.length} Blocks)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click any block below to inspect its cryptographic payload, previous-hash link, and actor signature.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {blocks.map((block) => {
                    const isSelected = selectedBlock?.index === block.index;
                    return (
                      <button
                        key={block.index}
                        type="button"
                        onClick={() => setSelectedBlock(block)}
                        className={`p-3.5 rounded-2xl text-left border transition-all relative ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-200 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Block #{block.index}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatRelativeTime(block.timestamp, { includeTime: true })}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 mt-2 truncate">{block.eventType}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {block.actorName} ({block.actorRole})
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="truncate">Hash: {block.blockHash.slice(0, 10)}...</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(block.blockHash, `block-${block.index}`);
                            }}
                            className="text-teal-700 hover:text-teal-900 font-sans cursor-pointer p-0.5"
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === `block-${block.index}` ? 'Copied' : 'Copy'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Block Deep Inspector */}
              {selectedBlock && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                        Block #{selectedBlock.index}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{selectedBlock.eventType}</h5>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Recorded: {formatSmartTimestamp(selectedBlock.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Sealed & Verified</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Actor Details */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                        Signatory Actor
                      </span>
                      <p className="font-bold text-slate-800">{selectedBlock.actorName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Role: {selectedBlock.actorRole} • ID: {selectedBlock.actorId}</p>
                    </div>

                    {/* Checkpoint Details */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                        Checkpoint Event Details
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">{selectedBlock.details}</p>
                    </div>
                  </div>

                  {/* Hashes */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Current Block SHA-256 Hash
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedBlock.blockHash, 'curr-hash')}
                          className="text-[10px] text-teal-700 hover:text-teal-900 flex items-center space-x-1 font-medium"
                        >
                          {copiedHash === 'curr-hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHash === 'curr-hash' ? 'Copied Full Hash' : 'Copy Full Hash'}</span>
                        </button>
                      </div>
                      <p className="mt-1 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 select-all break-all shadow-xs">
                        {selectedBlock.blockHash}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Previous Block Hash Link (Chain Parent)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedBlock.previousHash, 'prev-hash')}
                          className="text-[10px] text-teal-700 hover:text-teal-900 flex items-center space-x-1 font-medium"
                        >
                          {copiedHash === 'prev-hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHash === 'prev-hash' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="mt-1 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 select-all break-all shadow-xs">
                        {selectedBlock.previousHash}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Payload Merkle Hash
                      </span>
                      <p className="mt-1 font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-600 select-all break-all">
                        {selectedBlock.payloadHash}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* When not searched yet: Educational & Quick Discover Section */}
      {!hasSearched && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Award className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-bold text-slate-900">How CareTrace Public Ledger Verification Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold font-mono text-xs">
                1
              </span>
              <h4 className="font-bold text-slate-900">Genesis Match Block</h4>
              <p className="text-slate-600">
                When a donor pledges supplies or funds, Block #0 is anchored with donor ID, donee institution ID, and item manifest.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold font-mono text-xs">
                2
              </span>
              <h4 className="font-bold text-slate-900">Courier Custody Transfer</h4>
              <p className="text-slate-600">
                The logistics agent scans the consignment QR code at physical pickup, signing an immutable custody transfer on-chain.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold font-mono text-xs">
                3
              </span>
              <h4 className="font-bold text-slate-900">Inspected Final Handover</h4>
              <p className="text-slate-600">
                Sanctuary directors inspect the goods, sign digitally, optionally attach photo evidence, and mint the final delivery block.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

