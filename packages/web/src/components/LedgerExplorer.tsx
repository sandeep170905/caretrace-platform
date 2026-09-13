import React, { useState, useEffect } from 'react';
import { LedgerBlock, LedgerVerificationResult } from '@caretrace/shared';
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
    <div className="bg-white rounded-2xl p-6 border border-[#E7E8E2] shadow-sm space-y-6">
      {/* Header & Live Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-teal-200 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {donationId ? `Cryptographic Chain for ${donationId}` : 'Platform Global Ledger Explorer'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            SHA-256 Merkle hash-chained ledger • Real-time cryptographic validation via <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-teal-800 font-mono">/api/ledger/verify</code>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadChain}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-700' : ''}`} />
            <span>Audit Live</span>
          </button>

          {/* Tamper Demonstration Button */}
          <button
            onClick={handleTamper}
            disabled={isTampering || verification?.isValid === false}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-40"
            title="Demonstrate how cryptographic hashing catches unauthorized database tampering"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Simulate Tamper</span>
          </button>

          {/* Restore Button */}
          {verification?.isValid === false && (
            <button
              onClick={handleRestore}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm animate-pulse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Integrity</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Verification Status Card (Calls real backend API) */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          verification?.isValid
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start space-x-3">
          {verification?.isValid ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">
                {verification?.isValid ? 'LEDGER INTEGRITY VERIFIED (CRYPTOGRAPHICALLY SOUND)' : 'TAMPERING DETECTED IN LEDGER CHAIN!'}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  verification?.isValid
                    ? 'bg-emerald-200/80 text-emerald-800'
                    : 'bg-rose-200 text-rose-900 font-mono'
                }`}
              >
                {verification?.isValid ? 'STATUS: VALID' : `CORRUPTED BLOCK #${verification?.corruptedBlockIndex}`}
              </span>
            </div>

            {verification?.isValid ? (
              <p className="text-xs text-emerald-800 mt-1">
                All {verification?.totalBlocks} blocks match their calculated SHA-256 hashes and previous-hash pointers. Chain head:{' '}
                <span className="font-mono text-[11px] font-semibold">{verification?.chainHeadHash.slice(0, 16)}...</span>
              </p>
            ) : (
              <p className="text-xs text-rose-800 mt-1 font-mono">
                {verification?.errorDetail}
              </p>
            )}
          </div>
        </div>

        <div className="text-right sm:border-l sm:pl-4 border-emerald-200/60 flex-shrink-0">
          <p className="text-[10px] text-slate-500 font-medium">Verified Timestamp</p>
          <p className="text-xs font-mono font-semibold text-slate-700">
            {verification?.verifiedAt ? new Date(verification.verifiedAt).toLocaleTimeString() : 'Pending'}
          </p>
        </div>
      </div>

      {/* Block-by-Block Visual Walk */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Block-by-Block Chain Explorer ({blocks.length} Blocks)</span>
          <span className="text-[11px] font-normal text-slate-400">Click a block to inspect full header & payload</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {blocks.map((block) => {
            const isSelected = selectedBlock?.index === block.index;
            const isCorrupted = verification?.isValid === false && verification.corruptedBlockIndex === block.index;

            return (
              <button
                key={block.index}
                onClick={() => setSelectedBlock(block)}
                className={`p-3 rounded-xl text-left border transition-all relative ${
                  isCorrupted
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                    : isSelected
                    ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-200 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      isCorrupted
                        ? 'bg-rose-200 text-rose-900'
                        : isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Block #{block.index}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 mt-2 truncate">{block.eventType}</p>
                <p className="text-[11px] text-slate-500 truncate">{block.actorName}</p>

                <div className="mt-2 pt-2 border-t border-slate-100 font-mono text-[10px] text-slate-400 truncate">
                  Hash: {block.blockHash.slice(0, 14)}...
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Block Deep Inspector */}
      {selectedBlock && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                Block #{selectedBlock.index}
              </span>
              <span className="text-xs font-bold text-slate-800">{selectedBlock.eventType}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{selectedBlock.timestamp}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Current Block Hash (SHA-256)</span>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-800 break-all select-all mt-1">
                {selectedBlock.blockHash}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium flex items-center space-x-1">
                <Link2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Previous Block Hash Pointer</span>
              </span>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 break-all select-all mt-1">
                {selectedBlock.previousHash}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Signer Actor</span>
              <p className="font-semibold text-slate-900 mt-0.5">{selectedBlock.actorName}</p>
              <p className="text-[10px] text-slate-500">{selectedBlock.actorRole}</p>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Donation Scope</span>
              <p className="font-mono font-semibold text-teal-800 mt-0.5">{selectedBlock.donationId}</p>
              <p className="text-[10px] text-slate-500">Nonce: {selectedBlock.nonce}</p>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Payload Hash</span>
              <p className="font-mono text-[10px] text-slate-700 mt-0.5 truncate" title={selectedBlock.payloadHash}>
                {selectedBlock.payloadHash}
              </p>
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-xs font-medium">Checkpoint Audit Log</span>
            <p className="mt-1 p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 font-medium">
              {selectedBlock.details}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

