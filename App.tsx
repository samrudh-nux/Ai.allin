import { useState } from 'react';
import CitizenPortal from './CitizenPortal';
import AuthorityDashboard from './AuthorityDashboard';
import BiometricGate from './BiometricGate';
import { motion, AnimatePresence } from 'framer-motion';

type AppView = 'home' | 'citizen' | 'biometric' | 'authority';

export default function App() {
  const [view, setView] = useState<AppView>('home');

  return (
    <AnimatePresence mode="wait">
      {view === 'citizen' && (
        <motion.div key="citizen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-screen overflow-y-auto">
          <CitizenPortal onBack={() => setView('home')} />
        </motion.div>
      )}
      {view === 'biometric' && (
        <motion.div key="biometric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <BiometricGate
            onAuthorized={() => setView('authority')}
            onDeny={() => setView('home')}
          />
        </motion.div>
      )}
      {view === 'authority' && (
        <motion.div key="authority" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <AuthorityDashboard onBack={() => setView('home')} />
        </motion.div>
      )}
      {view === 'home' && (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
          {/* Subtle light grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }} />
          {/* Corner brackets — light */}
          {['top-6 left-6 border-t-2 border-l-2', 'top-6 right-6 border-t-2 border-r-2',
            'bottom-6 left-6 border-b-2 border-l-2', 'bottom-6 right-6 border-b-2 border-r-2'].map((c, i) => (
            <div key={i} className={`absolute w-10 h-10 border-blue-200 ${c}`} />
          ))}
          {/* Logo + heading */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14 space-y-4 relative z-10">
            {/* SVG Logo */}
            <div className="mx-auto mb-6 relative w-24 h-24">
              <div className="absolute inset-0 rounded-2xl bg-blue-50 border border-blue-100" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl border border-dashed border-blue-200/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="36" stroke="#2563eb" strokeWidth="1.5" opacity="0.2"/>
                  <rect x="33" y="18" width="14" height="44" rx="4" fill="#2563eb"/>
                  <rect x="18" y="33" width="44" height="14" rx="4" fill="#2563eb"/>
                  <circle cx="18" cy="18" r="5" fill="#60a5fa" opacity="0.8"/>
                  <circle cx="62" cy="18" r="5" fill="#60a5fa" opacity="0.8"/>
                  <circle cx="18" cy="62" r="5" fill="#60a5fa" opacity="0.8"/>
                  <circle cx="62" cy="62" r="5" fill="#60a5fa" opacity="0.8"/>
                  <circle cx="40" cy="40" r="9" fill="white"/>
                  <circle cx="40" cy="40" r="5" fill="#2563eb"/>
                  <circle cx="40" cy="40" r="2.5" fill="white"/>
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              ANEIS <span className="text-blue-600">2.0</span>
            </h1>
            <p className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[11px]">
              Government of India · AI Emergency Intelligence System
            </p>
            <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
              Real-time dispatch · Clinical risk engine · Hospital digital twin · AI operations commander
            </p>
          </motion.div>
          {/* Role cards */}
          <div className="grid md:grid-cols-2 gap-5 w-full max-w-2xl relative z-10">
            {/* Citizen — light card */}
            <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
              onClick={() => setView('citizen')}
              className="p-8 rounded-2xl text-left border bg-white border-slate-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-50 transition-all group flex flex-col shadow-sm">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-red-50 border border-red-100 text-2xl group-hover:bg-red-100 transition-colors">
                🆘
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Citizen Access</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed flex-1">
                Request emergency intervention, voice/chat reporting, and live dispatch tracking.
              </p>
              <div className="h-0.5 w-10 mt-5 rounded-full bg-red-500 group-hover:w-16 transition-all duration-300" />
            </motion.button>
            {/* Authority — light card with biometric badge */}
            <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
              onClick={() => setView('biometric')}
              className="p-8 rounded-2xl text-left border bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition-all group flex flex-col shadow-sm relative overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-blue-50 border border-blue-100 group-hover:bg-blue-100 transition-colors">
                <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
                  <path d="M17 2L30 9.5V24.5L17 32L4 24.5V9.5L17 2Z" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
                  <rect x="14.5" y="9" width="5" height="16" rx="1.5" fill="#2563eb"/>
                  <rect x="9" y="14.5" width="16" height="5" rx="1.5" fill="#2563eb"/>
                  <circle cx="9"  cy="9"  r="1.8" fill="#60a5fa"/>
                  <circle cx="25" cy="9"  r="1.8" fill="#60a5fa"/>
                  <circle cx="9"  cy="25" r="1.8" fill="#60a5fa"/>
                  <circle cx="25" cy="25" r="1.8" fill="#60a5fa"/>
                  <circle cx="17" cy="17" r="2.5" fill="#1d4ed8"/>
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Authority Login</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed flex-1">
                AI command dashboard · Clinical risk engine · Hospital twin · Agent operations.
              </p>
              {/* Biometric warning badge */}
              <div className="flex items-center gap-2 mt-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">
                  Biometric verification required
                </span>
              </div>
              <div className="h-0.5 w-10 mt-3 rounded-full bg-blue-500 group-hover:w-16 transition-all duration-300" />
            </motion.button>
          </div>
          {/* Footer */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-[9px] font-bold uppercase tracking-widest text-slate-300 relative z-10">
            {['Digital India', 'MEITY', 'Emergency Response System', 'AI Powered', 'ISO 27001'].map((t, i) => (
              <span key={t} className="flex items-center gap-2">
                {i > 0 && <span className="w-1 h-1 bg-slate-200 rounded-full" />}
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
