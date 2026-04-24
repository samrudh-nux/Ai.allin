/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import CitizenPortal from './components/CitizenPortal';
import AuthorityDashboard from './components/AuthorityDashboard';
import { Shield, Users, Radio, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [role, setRole] = useState<'citizen' | 'authority' | null>(null);

  return (
    <AnimatePresence mode="wait">
      {role === 'citizen' ? (
        <motion.div key="citizen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <CitizenPortal onBack={() => setRole(null)} />
        </motion.div>
      ) : role === 'authority' ? (
        <motion.div key="authority" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
          <AuthorityDashboard onBack={() => setRole(null)} />
        </motion.div>
      ) : (
        <motion.div 
          key="selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-20"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white text-3xl font-black italic shadow-lg shadow-blue-100 mb-6 font-sans">
              A
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              ANEIS Central Infrastructure
            </h1>
            <p className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[10px]">
              Government of India • Ministry of Health
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
            <RoleCard 
              title="Citizen Access" 
              desc="Request emergency intervention and track live help."
              icon={Users}
              onClick={() => setRole('citizen')}
              primary
            />
            <RoleCard 
              title="Authority Login" 
              desc="Command dashboard for dispatch and GIS telemetry."
              icon={Shield}
              onClick={() => setRole('authority')}
            />
          </div>

          <footer className="mt-20 flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">Digital India</div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2">Emergency Response Support System</div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoleCard({ title, desc, icon: Icon, onClick, primary = false }: any) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-10 rounded-3xl text-left transition-all border shadow-sm flex flex-col items-start ${primary ? 'bg-white border-blue-200' : 'bg-slate-100 border-slate-200'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${primary ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
      <div className={`h-1 w-8 mt-6 rounded-full ${primary ? 'bg-blue-600' : 'bg-slate-300'}`} />
    </motion.button>
  );
}
