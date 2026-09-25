import React, { useState, useEffect } from 'react';
import { LedgerBlock, LedgerVerificationResult, formatRelativeTime, formatSmartTimestamp } from '@caretrace/shared';
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  Link2,
  RefreshCw,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Zap,
  RotateCcw
} from 'lucide-react';
import { fetchLedgerBlocks, verifyLedgerLive, simulateTamper, resetDatabase } from '../api/client';

interface LedgerExplorerProps {
  donationId?: string;
}

export const LedgerExplorer: React.FC<LedgerExplorerProps> = ({ donationId }) => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [verification, setVerification] = useState<LedgerVerificationResult | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTampering, setIsTampering] = useState<boolean>(false);

  const loadChain = async () => {
    setIsLoading(true);
    try {
      const [blocksData, verifyData] = await Promise.all([
        fetchLedgerBlocks(donationId),
        verifyLedgerLive(donationId)
      ]);
      setBlocks(blocksData);
      setVerification(verifyData);
      if (blocksData.length > 0 && !selectedBlock) {
        setSelectedBlock(blocksData[blocksData.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChain();
  }, [donationId]);

  const handleTamper = async () => {
    if (blocks.length < 2) return;
    setIsTampering(true);
    try {
      // Artificially modify Block #1 details in backend DB to trigger cryptographic corruption
      const targetIndex = blocks[1].index;
      await simulateTamper(targetIndex, 'FRAUDULENT_RECORD: Consignment quantities manually modified in database.');
      // Immediately re-verify live from backend
      const newVerify = await verifyLedgerLive(donationId);
      const newBlocks = await fetchLedgerBlocks(donationId);
      setVerification(newVerify);
      setBlocks(newBlocks);
      setSelectedBlock(newBlocks[1]);
    } catch (e) {
      console.error('Tamper simulation failed:', e);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await resetDatabase();
      await loadChain();
    } catch (e) {
      console.error('Failed to restore ledger:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-card rounded-2xl p-6 sm:p-8 border border-surface-border shadow-elevated space-y-7 card-premium">
      {/* Header & Live Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-surface-border">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl gradient-primary text-white flex items-center justify-center shadow-glow-teal shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-wide">
              {donationId ? `Cryptographic Chain for ${donationId}` : 'Platform Global Ledger Explorer'}
            </h3>
          </div>
          <p className="text-xs font-sans text-slate-500 mt-2 font-medium">
            SHA-256 Merkle hash-chained ledger • Real-time cryptographic validation via <code className="text-[11px] bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border text-teal-800 font-mono font-bold ml-1">/api/ledger/verify</code>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={loadChain}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-surface-subtle hover:bg-surface-border text-slate-700 border border-surface-border rounded-xl text-xs font-sans font-bold transition-all shadow-sm disabled:opacity-50 press-effect hover-lift"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-700' : ''}`} />
            <span>Audit Live</span>
          </button>

          {/* Tamper Demonstration Button */}
          <button
            onClick={handleTamper}
            disabled={isTampering || verification?.isValid === false}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-sans font-bold transition-all shadow-sm disabled:opacity-40 press-effect hover-lift"
            title="Demonstrate how cryptographic hashing catches unauthorized database tampering"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Simulate Tamper</span>
          </button>

          {/* Restore Button */}
          {verification?.isValid === false && (
            <button
              onClick={handleRestore}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-sans font-bold transition-all shadow-sm animate-pulse press-effect hover-lift"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Integrity</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Verification Status Card (Calls real backend API) */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all duration-300 ${
          verification?.isValid
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            : 'bg-rose-50 border-rose-300 text-rose-950 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse-soft'
        }`}
      >
        <div className="flex items-start space-x-4">
          {verification?.isValid ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0 mt-0.5 drop-shadow-sm" />
          ) : (
            <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0 mt-0.5 drop-shadow-sm" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-sans font-bold text-sm sm:text-base tracking-wide">
                {verification?.isValid ? 'LEDGER INTEGRITY VERIFIED (CRYPTOGRAPHICALLY SOUND)' : 'TAMPERING DETECTED IN LEDGER CHAIN!'}
              </span>
              <span
                className={`text-[10px] font-sans uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full shadow-sm border ${
                  verification?.isValid
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-200 text-rose-900 border-rose-300 font-mono animate-pulse'
                }`}
              >
                {verification?.isValid ? 'STATUS: VALID' : `CORRUPTED BLOCK #${verification?.corruptedBlockIndex}`}
              </span>
            </div>

            {verification?.isValid ? (
              <p className="text-xs font-sans font-medium text-emerald-800 mt-1.5 leading-relaxed">
                All {verification?.totalBlocks} blocks match their calculated SHA-256 hashes and previous-hash pointers. Chain head:{' '}
                <span className="font-mono text-[11px] font-bold bg-emerald-100/50 px-1.5 py-0.5 rounded border border-emerald-200/50">{verification?.chainHeadHash.slice(0, 16)}...</span>
              </p>
            ) : (
              <p className="text-xs font-medium text-rose-800 mt-1.5 font-mono bg-rose-100/50 p-2 rounded-lg border border-rose-200/50">
                {verification?.errorDetail}
              </p>
            )}
          </div>
        </div>

        <div className="text-right sm:border-l sm:pl-5 border-emerald-200/60 flex-shrink-0">
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">Verified Timestamp</p>
          <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 bg-white/50 px-2 py-1 rounded-lg border border-white/20 inline-block shadow-inner">
            {verification?.verifiedAt ? formatSmartTimestamp(verification.verifiedAt) : 'Pending'}
          </p>
        </div>
      </div>

      {/* Block-by-Block Visual Walk */}
      <div className="animate-fade-up stagger-1">
        <h4 className="text-xs font-sans font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
          <span>Block-by-Block Chain Explorer ({blocks.length} Blocks)</span>
          <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">Click a block to inspect full header & payload</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {blocks.map((block, i) => {
            const isSelected = selectedBlock?.index === block.index;
            const isCorrupted = verification?.isValid === false && verification.corruptedBlockIndex === block.index;

            return (
              <button
                key={block.index}
                onClick={() => setSelectedBlock(block)}
                className={`p-4 rounded-xl text-left border transition-all duration-300 relative press-effect animate-fade-up shadow-sm hover-lift ${
                  isCorrupted
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-[0_4px_15px_rgba(244,63,94,0.15)]'
                    : isSelected
                    ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-200 shadow-glow-teal'
                    : 'bg-surface-canvas hover:bg-surface-subtle border-surface-border'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg border shadow-sm ${
                      isCorrupted
                        ? 'bg-rose-200 text-rose-900 border-rose-300'
                        : isSelected
                        ? 'bg-teal-700 text-white border-teal-800'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Block #{block.index}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-500">
                    {formatRelativeTime(block.timestamp, { includeTime: true })}
                  </span>
                </div>

                <p className="text-sm font-sans font-bold text-slate-800 mt-1 truncate">{block.eventType}</p>
                <p className="text-[11px] font-sans font-medium text-slate-500 truncate mt-0.5">{block.actorName}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/70 font-mono text-[10px] text-slate-400 truncate flex items-center space-x-1.5">
                  <Hash className="w-3 h-3 text-slate-300 shrink-0" />
                  <span>{block.blockHash.slice(0, 16)}...</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Block Deep Inspector */}
      {selectedBlock && (
        <div className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-4 animate-slide-up shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold shadow-sm">
                Block #{selectedBlock.index}
              </span>
              <span className="text-sm font-sans font-bold text-slate-900 tracking-wide">{selectedBlock.eventType}</span>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2 py-1 rounded-lg border border-surface-border shadow-sm">{formatSmartTimestamp(selectedBlock.timestamp)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px]">Current Block Hash (SHA-256)</span>
              <p className="font-mono text-xs bg-white p-3 rounded-xl border border-surface-border text-slate-800 break-all select-all shadow-inner font-medium">
                {selectedBlock.blockHash}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Previous Block Hash Pointer</span>
              </span>
              <p className="font-mono text-xs bg-white p-3 rounded-xl border border-surface-border text-slate-700 break-all select-all shadow-inner font-medium">
                {selectedBlock.previousHash}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-surface-border shadow-sm hover:border-teal-200 transition-colors">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 block">Signer Actor</span>
              <p className="font-sans font-bold text-slate-900">{selectedBlock.actorName}</p>
              <p className="text-[10px] font-sans font-medium text-slate-500 mt-0.5">{selectedBlock.actorRole}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-surface-border shadow-sm hover:border-teal-200 transition-colors">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 block">Donation Scope</span>
              <p className="font-mono font-bold text-teal-800 bg-teal-50 inline-block px-1.5 py-0.5 rounded">{selectedBlock.donationId}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1.5">Nonce: {selectedBlock.nonce}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-surface-border shadow-sm hover:border-teal-200 transition-colors">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 block">Payload Hash</span>
              <p className="font-mono text-[10px] font-medium text-slate-700 truncate bg-slate-50 p-1.5 rounded border border-slate-100" title={selectedBlock.payloadHash}>
                {selectedBlock.payloadHash}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5">Checkpoint Audit Log</span>
            <p className="p-3 bg-white rounded-xl border border-surface-border text-xs text-slate-800 font-sans font-medium shadow-sm leading-relaxed">
              {selectedBlock.details}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

