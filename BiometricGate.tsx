import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, CheckCircle2, AlertTriangle, Eye, Lock, Cpu, Radio } from 'lucide-react';

interface BiometricGateProps {
  onAuthorized: () => void;
  onDeny: () => void;
}

type GatePhase =
  | 'intro'
  | 'camera-init'
  | 'countdown'
  | 'capturing'
  | 'processing'
  | 'authorized'
  | 'denied';

export default function BiometricGate({ onAuthorized, onDeny }: BiometricGateProps) {
  const [phase, setPhase] = useState<GatePhase>('intro');
  const [countdown, setCountdown] = useState(5);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [officerName] = useState(() => {
    const names = ['Samrudh.s.b', 'samrudh.s.b', 'samrudh.s.b', 'samrudh.s.b', 'S. samrudh.s.b'];
    return names[Math.floor(Math.random() * names.length)];
  });
  const [sessionId] = useState(() =>
    `SEC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );

  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const timerRef   = useRef<any>(null);

  // Stop camera stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    setPhase('camera-init');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Small delay for camera to warm up, then start countdown
      setTimeout(() => setPhase('countdown'), 800);
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions and retry.'
          : 'Camera unavailable. Please check your device.'
      );
      setPhase('denied');
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror the image (selfie-style)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopStream();
    setPhase('processing');
  }, [stopStream]);

  // Countdown logic
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('capturing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Trigger capture when phase hits 'capturing'
  useEffect(() => {
    if (phase === 'capturing') {
      setTimeout(capturePhoto, 200);
    }
  }, [phase, capturePhoto]);

  // Fake AI processing scan
  useEffect(() => {
    if (phase !== 'processing') return;
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase('authorized'), 400);
          return 100;
        }
        return prev + Math.random() * 12 + 3;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-proceed after authorized
  useEffect(() => {
    if (phase === 'authorized') {
      const t = setTimeout(onAuthorized, 2200);
      return () => clearTimeout(t);
    }
  }, [phase, onAuthorized]);

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden relative select-none">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      {/* Corner decorations */}
      {[
        'top-4 left-4 border-t-2 border-l-2',
        'top-4 right-4 border-t-2 border-r-2',
        'bottom-4 left-4 border-b-2 border-l-2',
        'bottom-4 right-4 border-b-2 border-r-2',
      ].map((cls, i) => (
        <div key={i} className={`absolute w-8 h-8 border-blue-500/40 ${cls}`} />
      ))}
      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ANEIS Security Terminal</span>
          <span className="text-[10px] text-slate-600 font-mono">v2.0</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-mono text-slate-500">{dateStr}</span>
          <span className="text-[10px] font-mono text-blue-400 font-bold">{timeStr}</span>
          <span className="text-[10px] font-mono text-slate-600">{sessionId}</span>
        </div>
      </div>
      {/* Main card */}
      <AnimatePresence mode="wait">
        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <motion.div key="intro"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 max-w-md w-full px-6">
            {/* Logo */}
            <div className="relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-blue-500/20 border-dashed scale-125" />
              <div className="w-24 h-24 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center relative">
                <svg width="52" height="52" viewBox="0 0 34 34" fill="none">
                  <path d="M17 2L30 9.5V24.5L17 32L4 24.5V9.5L17 2Z" fill="#1d4ed8" opacity="0.15"/>
                  <path d="M17 2L30 9.5V24.5L17 32L4 24.5V9.5L17 2Z" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
                  <rect x="14.5" y="9" width="5" height="16" rx="1.5" fill="#2563eb"/>
                  <rect x="9" y="14.5" width="16" height="5" rx="1.5" fill="#2563eb"/>
                  <circle cx="9" cy="9" r="1.8" fill="#60a5fa"/>
                  <circle cx="25" cy="9" r="1.8" fill="#60a5fa"/>
                  <circle cx="9" cy="25" r="1.8" fill="#60a5fa"/>
                  <circle cx="25" cy="25" r="1.8" fill="#60a5fa"/>
                  <circle cx="17" cy="17" r="3" fill="white"/>
                  <circle cx="17" cy="17" r="1.5" fill="#1d4ed8"/>
                </svg>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Authority Access Portal</h1>
              <p className="text-[11px] text-blue-400 font-bold uppercase tracking-[0.25em]">
                ANEIS Intelligence Command Hub
              </p>
            </div>
            {/* Warning box */}
            <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-amber-400 shrink-0" />
                <span className="text-amber-400 font-black text-xs uppercase tracking-widest">Biometric Verification Required</span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-400 font-medium leading-relaxed">
                <p>• This portal requires <span className="text-white font-bold">real-time facial capture</span> for security audit logging.</p>
                <p>• Your image will be <span className="text-white font-bold">stored in session logs</span> per Government of India IT Act 2000.</p>
                <p>• Unauthorized access attempts are <span className="text-red-400 font-bold">logged, flagged and prosecuted</span>.</p>
                <p>• By proceeding, you confirm you are an <span className="text-white font-bold">authorized ANEIS officer</span>.</p>
              </div>
            </div>
            <div className="w-full space-y-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={startCamera}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3">
                <Camera size={18} />
                Proceed with Biometric Scan
              </motion.button>
              <button onClick={onDeny}
                className="w-full text-slate-600 hover:text-slate-400 font-bold text-xs uppercase tracking-widest py-2 transition-colors">
                Cancel / Return
              </button>
            </div>
            {/* Bottom badges */}
            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider text-slate-600">
              <div className="flex items-center gap-1.5"><Lock size={10} /> End-to-end encrypted</div>
              <div className="w-1 h-1 bg-slate-700 rounded-full" />
              <div className="flex items-center gap-1.5"><Cpu size={10} /> AI facial audit</div>
              <div className="w-1 h-1 bg-slate-700 rounded-full" />
              <div className="flex items-center gap-1.5"><Radio size={10} /> Live session</div>
            </div>
          </motion.div>
        )}
        {/* ── CAMERA / COUNTDOWN ── */}
        {(phase === 'camera-init' || phase === 'countdown' || phase === 'capturing') && (
          <motion.div key="camera"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 max-w-md w-full px-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-white tracking-tight">Facial Biometric Capture</h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {phase === 'camera-init' ? 'Initializing secure camera channel...' :
                 phase === 'countdown'   ? 'Position your face within the frame' :
                 'Capturing...'}
              </p>
            </div>
            {/* Camera frame */}
            <div className="relative w-72 h-72">
              {/* Corner brackets */}
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                <div key={i} className={`absolute w-6 h-6 border-blue-400 z-20 ${c}`} />
              ))}
              {/* Scan line */}
              {phase === 'countdown' && (
                <motion.div animate={{ y: [0, 256, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent z-20 opacity-70" />
              )}
              {/* Flash on capture */}
              {phase === 'capturing' && (
                <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white z-30 rounded-xl" />
              )}
              {/* Video */}
              <video ref={videoRef} muted playsInline autoPlay
                className="w-full h-full object-cover rounded-xl border border-slate-700"
                style={{ transform: 'scaleX(-1)' }} />
              {/* Countdown overlay */}
              {phase === 'countdown' && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <AnimatePresence mode="wait">
                    <motion.div key={countdown}
                      initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="w-20 h-20 rounded-full bg-slate-950/80 border-2 border-blue-400 flex items-center justify-center backdrop-blur">
                      <span className="text-4xl font-black text-blue-400 tabular-nums">{countdown}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
              {/* Face oval guide */}
              {phase === 'countdown' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-40 h-52 rounded-full border-2 border-dashed border-blue-400/40" />
                </div>
              )}
              {/* Hidden canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {/* Instructions */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <Eye size={13} className="text-blue-400 shrink-0" />
              <span>Look directly at the camera · Good lighting · Remove mask/glasses</span>
            </div>
            {phase === 'countdown' && (
              <div className="w-72">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${((5 - countdown) / 5) * 100}%` }}
                    className="h-full bg-blue-500 rounded-full" transition={{ duration: 0.9 }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-600 font-mono">Capturing in {countdown}s</span>
                  <span className="text-[9px] text-slate-600 font-mono">Secure channel active</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* ── PROCESSING ── */}
        {phase === 'processing' && capturedImage && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 max-w-md w-full px-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-white tracking-tight">Verifying Identity</h2>
              <p className="text-[11px] text-slate-400">AI facial recognition in progress...</p>
            </div>
            <div className="relative w-40 h-40">
              {/* Rotating ring */}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500/30" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border border-transparent border-b-blue-400/40" />
              {/* Captured face */}
              <img src={capturedImage} alt="Captured"
                className="absolute inset-3 rounded-full object-cover border-2 border-slate-700" />
              {/* Scan overlay on image */}
              <motion.div animate={{ y: [0, 120, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-3 rounded-full overflow-hidden pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
              </motion.div>
            </div>
            {/* Analysis steps */}
            <div className="w-72 space-y-2">
              {[
                { label: 'Facial geometry mapping', done: scanProgress > 20 },
                { label: 'Identity verification check', done: scanProgress > 45 },
                { label: 'Clearance level validation', done: scanProgress > 70 },
                { label: 'Session token generation', done: scanProgress > 90 },
              ].map(({ label, done }, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                    {done && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={`text-[11px] font-medium transition-colors ${done ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                  {!done && scanProgress > i * 25 && (
                    <div className="flex gap-0.5 ml-auto">
                      {[0, 1, 2].map(j => (
                        <div key={j} className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="w-72">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${Math.min(scanProgress, 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" transition={{ duration: 0.2 }} />
              </div>
              <p className="text-[9px] font-mono text-slate-600 mt-1 text-center">{Math.min(Math.round(scanProgress), 100)}% complete</p>
            </div>
          </motion.div>
        )}
        {/* ── AUTHORIZED ── */}
        {phase === 'authorized' && capturedImage && (
          <motion.div key="authorized"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 max-w-md w-full px-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
            </motion.div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight">Access Granted</h2>
              <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Identity Verified · Clearance Level 5</p>
            </div>
            {/* Officer card */}
            <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
              <div className="relative shrink-0">
                <img src={capturedImage} alt="Officer"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500/40" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm">{officerName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duty Officer · BENGALURU CENTRAL</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Session Active</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-slate-500 font-mono">{sessionId}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{timeStr}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Redirecting to Command Hub...
            </p>
            <div className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.2, ease: 'linear' }}
                className="h-full bg-emerald-500 rounded-full" />
            </div>
          </motion.div>
        )}
        {/* ── DENIED / ERROR ── */}
        {phase === 'denied' && (
          <motion.div key="denied"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 max-w-md w-full px-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white">Access Denied</h2>
              <p className="text-[11px] text-red-400 font-medium">{cameraError || 'Biometric verification failed'}</p>
            </div>
            <div className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-[11px] text-slate-400">
              This incident has been logged with timestamp and IP address. Repeated failed attempts will trigger a security alert.
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => { setCameraError(null); setPhase('intro'); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase py-3 rounded-xl transition-colors">
                Try Again
              </button>
              <button onClick={onDeny}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold text-xs uppercase py-3 rounded-xl border border-red-500/20 transition-colors">
                Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-slate-800 bg-slate-950/80 flex items-center justify-center gap-8 px-8">
        {['MEITY Govt of India', 'ISO 27001 Certified', 'ANEIS v2.0', 'Secure Channel'].map((t, i) => (
          <span key={t} className="text-[9px] font-bold uppercase tracking-widest text-slate-700">{t}</span>
        ))}
      </div>
    </div>
  );
}
