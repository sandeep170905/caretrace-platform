import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, CheckCircle2, Zap, AlertCircle, RefreshCw, Upload, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningSuccess, setIsScanningSuccess] = useState<boolean>(false);
  const [scannedId, setScannedId] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [showDevFallback, setShowDevFallback] = useState<boolean>(false);

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

  const triggerScanSuccess = (payload: string) => {
    if (isScanningSuccess) return;
    setIsScanningSuccess(true);
    setScannedId(payload);
    playTactileBeep();

    setTimeout(() => {
      onScanSuccess(payload);
      if (onClose) onClose();
    }, 850);
  };

  // Real-time camera video stream & live frame decoding with jsQR
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isCancelled = false;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 640 }
            }
          });
          if (videoRef.current && !isCancelled) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            setCameraActive(true);
            setCameraError(null);
            scanVideoFrame();
          }
        } else {
          setCameraError('Camera API not accessible in this environment. Use Developer Fallback below.');
        }
      } catch (err: any) {
        setCameraError('Camera access unavailable (check permissions). You can upload a QR image or use Dev Fallback below.');
      }
    }

    function scanVideoFrame() {
      if (isCancelled || isScanningSuccess) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (code && code.data && code.data.trim()) {
            triggerScanSuccess(code.data.trim());
            return;
          }
        } catch (e) {
          // Frame decode error ignore
        }
      }

      animationFrameId = requestAnimationFrame(scanVideoFrame);
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanningSuccess]);

  // Handle image upload scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data && code.data.trim()) {
          triggerScanSuccess(code.data.trim());
        } else {
          setCameraError('No valid QR code detected in the uploaded image. Please try another image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-card rounded-3xl max-w-md w-full overflow-hidden shadow-elevated border border-surface-border flex flex-col max-h-[92vh] overflow-y-auto animate-scale-in card-premium">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-900 text-white">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 text-teal-400 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-display font-bold tracking-wide">{title}</h3>
                {cameraActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-glow-teal">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                    Live Camera
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors press-effect"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Action: Viewfinder Window */}
        <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center border-b border-surface-border shadow-inner">
          {/* Real Camera Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Camera Status / Fallback Visual */}
          {!cameraActive && (
            <div className="text-center p-6 space-y-4 z-10">
              <div className="w-16 h-16 rounded-2xl bg-teal-900/40 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-glow-teal">
                <Camera className="w-8 h-8 opacity-70" />
              </div>
              <p className="text-xs font-sans font-medium text-slate-300 max-w-[240px] mx-auto leading-relaxed">
                {cameraError || 'Initializing camera stream... Please hold code in center.'}
              </p>
            </div>
          )}

          {/* Laser Scanning Reticle & Corner Brackets */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="relative w-64 h-64 border-2 border-teal-400/40 rounded-3xl overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-2xl" />

              {/* Sweeping Laser Line */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-glow-teal animate-[bounce_2.5s_infinite]" />
            </div>
          </div>

          {/* Live Scanning Status Banner */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-20">
            <span className="px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-xs font-sans font-bold text-teal-300 border border-teal-500/30 shadow-md">
              {cameraActive ? 'Align QR code in frame to scan automatically' : 'Camera inactive'}
            </span>
          </div>

          {/* Success Flash Overlay */}
          {isScanningSuccess && (
            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white z-30 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-white animate-bounce shadow-glow-teal rounded-full" />
              <p className="text-xl font-display font-bold mt-4">QR Code Authenticated!</p>
              <p className="text-sm font-mono font-bold opacity-90 mt-1 bg-black/20 px-3 py-1 rounded border border-white/20">{scannedId}</p>
              <p className="text-xs font-sans font-medium opacity-80 mt-3 animate-pulse">Logging to Ledger...</p>
            </div>
          )}
        </div>

        {/* Secondary Action: Upload Image Option */}
        <div className="px-5 py-3.5 bg-surface-subtle border-b border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <span className="text-xs font-sans font-medium text-slate-500 flex items-center space-x-2">
            <Camera className="w-4 h-4 text-slate-400" />
            <span>Live camera auto-detects QR codes</span>
          </span>

          <label className="cursor-pointer text-xs font-sans font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1.5 px-3.5 py-1.5 bg-surface-card border border-surface-border rounded-xl hover:border-teal-300 transition-colors shadow-sm press-effect">
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Upload QR Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Visible Fallback / Dev Option: Collapsible or Subdued */}
        <div className="p-5 bg-surface-canvas">
          <button
            type="button"
            onClick={() => setShowDevFallback(!showDevFallback)}
            className="w-full flex items-center justify-between text-xs font-sans font-bold text-slate-600 hover:text-slate-900 py-1.5 transition-colors press-effect"
          >
            <span className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Dev / Test Fallback (1-Click Triggers)</span>
            </span>
            <span className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
              <span>{showDevFallback ? 'Hide' : 'Show'}</span>
              {showDevFallback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {showDevFallback && (
            <div className="mt-4 space-y-3 animate-fade-in">
              <p className="text-[11px] font-sans font-medium text-slate-500 leading-relaxed bg-surface-subtle p-2.5 rounded-lg border border-surface-border">
                Click any pre-seeded consignment below to bypass camera hardware during presentations:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {quickScanDonations.length > 0 ? (
                  quickScanDonations.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => triggerScanSuccess(item.payload || item.id)}
                      className="flex items-center justify-between p-3.5 bg-surface-card hover:bg-teal-50 border border-surface-border hover:border-teal-300 rounded-xl text-left transition-all group shadow-sm hover-lift press-effect"
                    >
                      <div className="truncate pr-3">
                        <p className="text-xs font-bold font-mono text-teal-800 group-hover:text-teal-900">{item.id}</p>
                        <p className="text-[11px] font-sans font-medium text-slate-500 truncate mt-0.5">{item.title}</p>
                      </div>
                      <span className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 rounded-lg group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0">
                        Simulate
                      </span>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => triggerScanSuccess('CT-2026-9042')}
                    className="flex items-center justify-between p-3.5 bg-surface-card hover:bg-teal-50 border border-teal-300 rounded-xl text-left transition-all shadow-sm hover-lift press-effect"
                  >
                    <div>
                      <p className="text-xs font-bold font-mono text-teal-800">CT-2026-9042</p>
                      <p className="text-[11px] font-sans font-medium text-slate-500 mt-0.5">School Uniforms & Notebooks (In-Transit Consignment)</p>
                    </div>
                    <span className="px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider gradient-primary text-white rounded-lg shadow-sm">
                      Simulate Scan
                    </span>
                  </button>
                )}
              </div>

              {/* Manual Input */}
              <div className="flex space-x-2.5 pt-2">
                <input
                  type="text"
                  placeholder="Or paste CT-XXXX donation ID..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-surface-card border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent font-mono shadow-inner"
                />
                <button
                  onClick={() => manualInput.trim() && triggerScanSuccess(manualInput.trim())}
                  disabled={!manualInput.trim()}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-sans font-bold rounded-xl shadow-sm transition-all press-effect"
                >
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
