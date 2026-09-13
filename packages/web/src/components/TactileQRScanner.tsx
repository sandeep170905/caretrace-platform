import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, CheckCircle2, Zap, AlertCircle, RefreshCw } from 'lucide-react';

interface TactileQRScannerProps {
  title?: string;
  subtitle?: string;
  quickScanDonations?: { id: string; title: string; payload?: string }[];
  onScanSuccess: (payload: string) => void;
  onClose?: () => void;
}

export const TactileQRScanner: React.FC<TactileQRScannerProps> = ({
  title = 'Scan Donation QR Code',
  subtitle = 'Point camera at the donor consignment QR code',
  quickScanDonations = [],
  onScanSuccess,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningSuccess, setIsScanningSuccess] = useState<boolean>(false);
  const [scannedId, setScannedId] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');

  // Synthesize tactile audio beep
  const playTactileBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12); // A6
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before interaction
    }

    // Trigger browser vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 80]);
      } catch (e) {}
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        } else {
          setCameraError('Camera API not accessible in this environment. Use 1-Click Simulation below.');
        }
      } catch (err: any) {
        setCameraError('Camera preview unavailable (permission or hardware). Use 1-Click Simulation below.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const triggerScanSuccess = (payload: string) => {
    if (isScanningSuccess) return;
    setIsScanningSuccess(true);
    setScannedId(payload);
    playTactileBeep();

    setTimeout(() => {
      onScanSuccess(payload);
      if (onClose) onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 text-teal-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Viewfinder Window */}
        <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center">
          {/* Real Camera Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Camera Fallback Visual */}
          {!cameraActive && (
            <div className="text-center p-6 space-y-3 z-10">
              <div className="w-16 h-16 rounded-2xl bg-teal-900/40 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 opacity-70" />
              </div>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                {cameraError || 'Camera stream ready. Hold code in center.'}
              </p>
            </div>
          )}

          {/* Laser Scanning Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="relative w-64 h-64 border-2 border-teal-400/40 rounded-3xl overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.2)]">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-2xl" />

              {/* Sweeping Laser Line */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_2.5s_infinite]" />
            </div>
          </div>

          {/* Success Flash Overlay */}
          {isScanningSuccess && (
            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-white animate-bounce" />
              <p className="text-base font-bold mt-2">QR Code Authenticated!</p>
              <p className="text-xs font-mono opacity-90">{scannedId}</p>
              <p className="text-[11px] opacity-75 mt-1">Logging to Ledger...</p>
            </div>
          )}
        </div>

        {/* 1-Click Fast Simulation Action Toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Test Scanner Triggers:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Instant local dev bypass</span>
          </div>

          {/* Quick Pre-Seeded Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickScanDonations.length > 0 ? (
              quickScanDonations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => triggerScanSuccess(item.payload || item.id)}
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all group shadow-sm"
                >
                  <div className="truncate">
                    <p className="text-xs font-bold font-mono text-teal-800 group-hover:text-teal-900">{item.id}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.title}</p>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-semibold bg-teal-100 text-teal-800 rounded group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    Scan
                  </span>
                </button>
              ))
            ) : (
              <button
                onClick={() => triggerScanSuccess('CT-2026-9042')}
                className="col-span-2 flex items-center justify-between p-2.5 bg-white hover:bg-teal-50 border border-teal-300 rounded-xl text-left transition-all shadow-sm"
              >
                <div>
                  <p className="text-xs font-bold font-mono text-teal-800">CT-2026-9042</p>
                  <p className="text-[10px] text-slate-500">School Uniforms & Notebooks (In-Transit Consignment)</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-teal-700 text-white rounded-lg">
                  Simulate Scan
                </span>
              </button>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="flex space-x-2 pt-1">
            <input
              type="text"
              placeholder="Paste or type CT-XXXX donation ID..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 font-mono"
            />
            <button
              onClick={() => manualInput.trim() && triggerScanSuccess(manualInput.trim())}
              disabled={!manualInput.trim()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
