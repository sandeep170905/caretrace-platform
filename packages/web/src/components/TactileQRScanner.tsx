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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 text-teal-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight">{title}</h3>
                {cameraActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                    Live Camera
                  </span>
                )}
              </div>
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

        {/* Primary Action: Viewfinder Window */}
        <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center">
          {/* Real Camera Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Camera Status / Fallback Visual */}
          {!cameraActive && (
            <div className="text-center p-6 space-y-3 z-10">
              <div className="w-16 h-16 rounded-2xl bg-teal-900/40 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 opacity-70" />
              </div>
              <p className="text-xs text-slate-300 max-w-[240px] mx-auto leading-relaxed">
                {cameraError || 'Initializing camera stream... Please hold code in center.'}
              </p>
            </div>
          )}

          {/* Laser Scanning Reticle & Corner Brackets */}
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

          {/* Live Scanning Status Banner */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-20">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-[11px] font-medium text-teal-300 border border-teal-500/30 shadow-sm">
              {cameraActive ? 'Align QR code in frame to scan automatically' : 'Camera inactive'}
            </span>
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

        {/* Secondary Action: Upload Image Option */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span>Live camera auto-detects QR codes</span>
          </span>

          <label className="cursor-pointer text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:border-teal-300 transition-colors shadow-2xs">
            <Upload className="w-3 h-3 text-teal-600" />
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
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowDevFallback(!showDevFallback)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-800 py-1 transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Dev / Test Fallback (1-Click Triggers)</span>
            </span>
            <span className="flex items-center space-x-1 text-[11px] text-slate-400 font-normal">
              <span>{showDevFallback ? 'Hide' : 'Show'}</span>
              {showDevFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showDevFallback && (
            <div className="mt-3 space-y-2.5 animate-fade-in">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Click any pre-seeded consignment below to bypass camera hardware during presentations:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickScanDonations.length > 0 ? (
                  quickScanDonations.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => triggerScanSuccess(item.payload || item.id)}
                      className="flex items-center justify-between p-2.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all group shadow-2xs"
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold font-mono text-teal-800 group-hover:text-teal-900">{item.id}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.title}</p>
                      </div>
                      <span className="px-2 py-1 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        Simulate
                      </span>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => triggerScanSuccess('CT-2026-9042')}
                    className="col-span-2 flex items-center justify-between p-2.5 bg-white hover:bg-teal-50 border border-teal-300 rounded-xl text-left transition-all shadow-2xs"
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

              {/* Manual Input */}
              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="Or paste CT-XXXX donation ID..."
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
          )}
        </div>
      </div>
    </div>
  );
};
