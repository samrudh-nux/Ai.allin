import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Map as MapIcon, Users, TrendingUp, Hospital,
  Bell, LogOut, ChevronRight, Brain, Play, Pause,
  CheckCircle2, X, Zap, Search, Filter, MapPin,
  Ambulance, ShieldAlert, Send, AlertTriangle, BarChart2,
  Clock, Radio, Cpu, CircleDot, ArrowUpRight, ArrowDownRight,
  Minus, Shield, Layers, GitBranch, RefreshCw
} from 'lucide-react';
import GlobalMap from './Map';
import {
  EmergencyRecord, HospitalRecord, ResourceRecord,
  PatientRiskProfile, HospitalTwin, AgentDecision,
  AnalyticsSnapshot, AnomalyEvent, SimulationMode, CopilotMessage
} from './types';
import { io } from 'socket.io-client';
import {
  generatePatient, computeRiskProfile, simulateVitals,
  generateHospitalTwin, runAgentDecisions, parseNLCommand,
  computeAnalytics, detectAnomalies, getSimConfig
} from './aiEngine';

type TabType = 'map' | 'monitor' | 'facility' | 'units' | 'analytics';

// ─── ANEIS Logo ───────────────────────────────────────────────────────────────
function AneisLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <path d="M17 2L30 9.5V24.5L17 32L4 24.5V9.5L17 2Z" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5"/>
      <rect x="14.5" y="9" width="5" height="16" rx="1.5" fill="#2563eb"/>
      <rect x="9" y="14.5" width="16" height="5" rx="1.5" fill="#2563eb"/>
      <circle cx="9"  cy="9"  r="1.8" fill="#3b82f6"/>
      <circle cx="25" cy="9"  r="1.8" fill="#3b82f6"/>
      <circle cx="9"  cy="25" r="1.8" fill="#3b82f6"/>
      <circle cx="25" cy="25" r="1.8" fill="#3b82f6"/>
      <circle cx="17" cy="17" r="3" fill="white"/>
      <circle cx="17" cy="17" r="1.5" fill="#1d4ed8"/>
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#3b82f6', width = 72, height = 28 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {(() => { const last = data[data.length-1]; const y = height - ((last - min)/range)*height; return <circle cx={width} cy={y} r="2.5" fill={color} />; })()}
    </svg>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-500 tabular-nums w-8">{pct}%</span>
    </div>
  );
}

// ─── Risk Gauge ───────────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#ef4444' : score >= 45 ? '#f59e0b' : '#22c55e';
  const label = score >= 70 ? 'CRITICAL' : score >= 45 ? 'WARNING' : 'STABLE';
  const r = 28; const cx = 36; const cy = 38;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (sa: number, ea: number) => {
    const s = { x: cx + r*Math.cos(toRad(sa)), y: cy + r*Math.sin(toRad(sa)) };
    const e = { x: cx + r*Math.cos(toRad(ea)), y: cy + r*Math.sin(toRad(ea)) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${ea-sa>180?1:0} 1 ${e.x} ${e.y}`;
  };
  const needle = { x: cx + (r-6)*Math.cos(toRad(-135 + (score/100)*270)), y: cy + (r-6)*Math.sin(toRad(-135 + (score/100)*270)) };
  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="48">
        <path d={arc(-135, 135)} fill="none" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round"/>
        <path d={arc(-135, -135+(score/100)*270)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="3" fill={color}/>
        <text x={cx} y={cy+13} textAnchor="middle" fontSize="11" fontWeight="900" fill={color}>{score}</text>
      </svg>
      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Section wrapper card ─────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Copilot Panel ────────────────────────────────────────────────────────────
function CopilotPanel({ patients, twin, agents, onClose }: {
  patients: PatientRiskProfile[]; twin: HospitalTwin | null;
  agents: AgentDecision[]; onClose: () => void;
}) {
  const [messages, setMessages] = useState<CopilotMessage[]>([{
    id: '0', role: 'assistant',
    content: '**ANEIS Copilot online.**\n\nAsk me anything:\n- "Who is most critical?"\n- "What\'s the bottleneck?"\n- "Forecast next 6 hours"\n- "What should we do now?"',
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(() => {
    if (!input.trim() || !twin) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() }]);
    setInput(''); setLoading(true);
    setTimeout(() => {
      const r = parseNLCommand(input, twin, patients, agents);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: r, timestamp: new Date().toISOString() }]);
      setLoading(false);
    }, 700);
  }, [input, twin, patients, agents]);

  const renderMD = (text: string) => text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={`text-xs leading-relaxed ${line.startsWith('-') ? 'text-slate-500 pl-2' : 'text-slate-700'}`}>
        {parts.map((p, j) => p.startsWith('**')
          ? <strong key={j} className="text-slate-900 font-black">{p.replace(/\*\*/g, '')}</strong> : p)}
      </p>
    );
  });

  return (
    <motion.div initial={{ x: 384 }} animate={{ x: 0 }} exit={{ x: 384 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 flex flex-col z-[2000] shadow-2xl">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Brain size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-slate-900 font-black text-sm">ANEIS Copilot</p>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">AI Decision Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={16}/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl p-3.5 ${m.role === 'user' ? 'bg-blue-600 text-white text-xs' : 'bg-white border border-slate-200 shadow-sm space-y-0.5'}`}>
              {m.role === 'user' ? <p className="text-xs">{m.content}</p> : renderMD(m.content)}
              <p className="text-[8px] opacity-40 mt-1.5 text-right">{new Date(m.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-2 shadow-sm">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }}/>)}
              <span className="text-[10px] text-slate-400 ml-1">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {['Critical patients','Bottleneck?','Act now?','Forecast 6h'].map(q => (
          <button key={q} onClick={() => setInput(q)}
            className="text-[9px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all">
            {q}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about system state..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"/>
          <button onClick={send} disabled={!input.trim()||loading}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all">
            <Send size={14}/>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CRITICAL MONITOR ─────────────────────────────────────────────────────────
function CriticalMonitor({ patients, selectedPatient, onSelectPatient }: {
  patients: PatientRiskProfile[]; selectedPatient: PatientRiskProfile | null;
  onSelectPatient: (p: PatientRiskProfile | null) => void;
}) {
  const riskColor = (s: number) => s >= 70 ? '#ef4444' : s >= 45 ? '#f59e0b' : '#22c55e';
  const riskBg    = (s: number) => s >= 70 ? 'bg-red-50 border-red-100' : s >= 45 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100';
  const riskText  = (s: number) => s >= 70 ? 'text-red-700' : s >= 45 ? 'text-amber-700' : 'text-emerald-700';

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4 p-4 bg-slate-50">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        {[
          { label: 'Critical Risk',  value: patients.filter(p=>p.riskScore>=70).length,  color: 'text-red-600',     bg: 'bg-red-50 border-red-100'     },
          { label: 'Deteriorating',  value: patients.filter(p=>p.riskTrend==='rising').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Avg Risk Score', value: patients.length ? Math.round(patients.reduce((a,p)=>a+p.riskScore,0)/patients.length) : 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Total Monitored',value: patients.length, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-5 ${bg}`}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-3xl font-black tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4">
        {/* Patient list */}
        <Card className="col-span-4 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-red-500"/>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Risk Board</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {[...patients].sort((a,b)=>b.riskScore-a.riskScore).map(p => (
              <button key={p.patientId} onClick={() => onSelectPatient(selectedPatient?.patientId===p.patientId ? null : p)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPatient?.patientId===p.patientId ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor(p.riskScore), boxShadow: p.riskScore>=70 ? `0 0 6px ${riskColor(p.riskScore)}80` : 'none' }}
                      className={p.riskScore>=70 ? 'animate-pulse' : ''}/>
                    <span className="text-[11px] font-black text-slate-800 truncate max-w-[100px]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.riskTrend==='rising' ? <ArrowUpRight size={11} className="text-red-500"/> : p.riskTrend==='falling' ? <ArrowDownRight size={11} className="text-emerald-500"/> : <Minus size={11} className="text-slate-400"/>}
                    <span className="text-[13px] font-black tabular-nums" style={{ color: riskColor(p.riskScore) }}>{p.riskScore}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] text-slate-400 truncate max-w-[110px]">{p.diagnosis} · {p.ward}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${riskBg(p.riskScore)} ${riskText(p.riskScore)}`}>
                    {p.riskScore>=70?'CRIT':p.riskScore>=45?'WARN':'STBL'}
                  </span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.riskScore}%`, backgroundColor: riskColor(p.riskScore) }}/>
                </div>
              </button>
            ))}
          </div>
        </Card>
        {/* Patient detail */}
        <div className="col-span-8 overflow-y-auto space-y-4">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div key={selectedPatient.patientId} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
                {/* Header */}
                <Card className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <RiskGauge score={selectedPatient.riskScore}/>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-black text-slate-900">{selectedPatient.name}</h2>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${riskBg(selectedPatient.riskScore)} ${riskText(selectedPatient.riskScore)}`}>
                            {selectedPatient.riskScore>=70?'CRITICAL':selectedPatient.riskScore>=45?'WARNING':'STABLE'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{selectedPatient.diagnosis} · {selectedPatient.ward} · Age {selectedPatient.age}</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[['1h Risk',`${selectedPatient.deteriorationRisk1h}%`],['6h Risk',`${selectedPatient.deteriorationRisk6h}%`],['AI Conf.',`${Math.round(selectedPatient.confidenceScore*100)}%`]].map(([k,v])=>(
                            <div key={String(k)} className="bg-slate-50 rounded-lg p-2 text-center">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{k}</p>
                              <p className="text-sm font-black text-slate-800">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={()=>onSelectPatient(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"><X size={16}/></button>
                  </div>
                </Card>
                {/* Vitals */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:'Heart Rate',    v: Math.round(selectedPatient.vitals.heartRate),        unit:'bpm',   normal:[60,100],   hist: selectedPatient.vitalHistory.map(h=>h.heartRate) },
                    { label:'Blood Pressure',v: Math.round(selectedPatient.vitals.systolicBP),       unit:'mmHg',  normal:[90,140],   hist: selectedPatient.vitalHistory.map(h=>h.systolicBP) },
                    { label:'O₂ Saturation', v: Math.round(selectedPatient.vitals.oxygenSat),        unit:'%',     normal:[95,100],   hist: selectedPatient.vitalHistory.map(h=>h.oxygenSat) },
                    { label:'Temperature',   v: selectedPatient.vitals.temperature.toFixed(1),       unit:'°C',    normal:[36.1,37.5],hist: selectedPatient.vitalHistory.map(h=>h.temperature) },
                    { label:'Resp. Rate',    v: Math.round(selectedPatient.vitals.respiratoryRate),  unit:'/min',  normal:[12,20],    hist: selectedPatient.vitalHistory.map(h=>h.respiratoryRate) },
                    { label:'Glucose',       v: Math.round(selectedPatient.vitals.glucoseLevel),     unit:'mg/dL', normal:[70,140],   hist: selectedPatient.vitalHistory.map(h=>h.glucoseLevel) },
                  ].map(({ label,v,unit,normal,hist }) => {
                    const val = parseFloat(String(v));
                    const ok  = val>=normal[0] && val<=normal[1];
                    const warn= !ok && val>=normal[0]*0.85 && val<=normal[1]*1.2;
                    const col = ok ? '#22c55e' : warn ? '#f59e0b' : '#ef4444';
                    const bg  = ok ? 'bg-emerald-50 border-emerald-100' : warn ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';
                    return (
                      <Card key={label} className={`p-4 ${bg}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-xl font-black tabular-nums" style={{ color: col }}>{v}</span>
                              <span className="text-[10px] text-slate-400">{unit}</span>
                            </div>
                          </div>
                          <Sparkline data={hist} color={col} width={52} height={28}/>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {/* AI Explanation */}
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-blue-600"/>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Clinical Analysis</span>
                    <span className="ml-auto text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                      {Math.round(selectedPatient.confidenceScore*100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedPatient.aiExplanation}</p>
                  {selectedPatient.alerts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedPatient.alerts.map(a => (
                        <div key={a.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs font-medium ${a.severity==='critical'?'bg-red-50 border-red-100 text-red-700':'bg-amber-50 border-amber-100 text-amber-700'}`}>
                          <AlertTriangle size={12}/>{a.message}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="h-64 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Activity size={32} className="mx-auto mb-3 opacity-20"/>
                  <p className="text-sm font-black uppercase tracking-widest">Select a Patient</p>
                  <p className="text-xs mt-1">Click any patient for AI risk analysis</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── FACILITY TELEMETRY ───────────────────────────────────────────────────────
function FacilityTelemetry({ twin, simMode }: { twin: HospitalTwin | null; simMode: SimulationMode }) {
  const [simDelta, setSimDelta] = useState(0);
  const [showSim, setShowSim] = useState(false);

  if (!twin) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={16} className="animate-spin"/><span className="text-sm font-bold">Initializing Digital Twin...</span></div>
    </div>
  );

  const simOcc = Math.min(99, twin.currentOccupancy + simDelta);
  const simIcu = Math.min(99, twin.icuOccupancy + Math.round(simDelta*1.3));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Bed Occupancy', value:`${simOcc}%`,    sub:`→ ${twin.predictedOccupancy6h+simDelta}% in 6h`, crit:simOcc>85 },
          { label:'ICU Occupancy', value:`${simIcu}%`,    sub:`${twin.ventilators.inUse}/${twin.ventilators.total} vents`, crit:simIcu>85 },
          { label:'Patient Flow',  value:`+${twin.patientInflow}/hr`, sub:`−${twin.patientOutflow}/hr out`, crit:twin.patientInflow>twin.patientOutflow*1.3 },
          { label:'Oxygen Supply', value:`${twin.oxygenLevel}%`, sub:twin.oxygenLevel<40?'⚠ CRITICAL':'Normal', crit:twin.oxygenLevel<40 },
        ].map(({ label,value,sub,crit }) => (
          <div key={label} className={`rounded-xl border p-5 ${crit?'bg-red-50 border-red-100':'bg-white border-slate-200'}`}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black tabular-nums ${crit?'text-red-600':'text-slate-800'}`}>{value}</p>
            <p className={`text-[9px] font-medium mt-1 ${crit?'text-red-500':'text-slate-400'}`}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Department Heatmap */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-blue-500"/>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Department Load Matrix</h3>
              <div className="flex items-center gap-1 ml-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                <span className="text-[8px] font-bold text-slate-400 uppercase">live</span>
              </div>
            </div>
            <button onClick={() => setShowSim(s=>!s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide transition-all ${showSim?'bg-blue-50 border-blue-200 text-blue-600':'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}>
              <GitBranch size={10}/> What-If Sim
            </button>
          </div>

          {showSim && (
            <div className="mb-5 p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={12} className="text-blue-600"/>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Surge Simulation</span>
                </div>
                <span className="text-[11px] font-black text-blue-800">+{simDelta} patients</span>
              </div>
              <input type="range" min={0} max={50} value={simDelta} onChange={e=>setSimDelta(Number(e.target.value))} className="w-full accent-blue-600"/>
              <div className="flex justify-between">
                <span className="text-[9px] text-slate-500">Normal</span>
                <span className="text-[9px] text-red-500">+50 surge</span>
              </div>
              {simDelta>20 && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  <AlertTriangle size={11}/> ICU breach predicted in ~2h — activate surge protocol
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {twin.departments.map((d,i) => {
              const pct = Math.min(99, (d.current/d.capacity)*100 + simDelta*(i%2===0?0.8:0.5));
              const color = pct>90?'bg-red-500':pct>75?'bg-amber-500':'bg-emerald-500';
              const textColor = pct>90?'text-red-600':pct>75?'text-amber-600':'text-emerald-600';
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-700 w-28">{d.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{d.current}/{d.capacity}</span>
                      {d.waitTime>0 && <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">{d.waitTime}m wait</span>}
                    </div>
                    <span className={`text-sm font-black tabular-nums ${textColor}`}>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.5 }} className={`h-full rounded-full ${color}`}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI Suggestions */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Brain size={14} className="text-blue-500"/>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">AI Recommendations</h3>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {twin.aiSuggestions.length===0 ? (
              <div className="flex items-center gap-2 px-3 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 size={14} className="text-emerald-500"/><span className="text-xs font-bold text-emerald-700">System nominal</span>
              </div>
            ) : twin.aiSuggestions.map(s => {
              const styles = { urgent:'bg-red-50 border-red-100 text-red-600', high:'bg-amber-50 border-amber-100 text-amber-600', medium:'bg-blue-50 border-blue-100 text-blue-600', low:'bg-slate-50 border-slate-100 text-slate-500' };
              const st = styles[s.priority] || styles.low;
              return (
                <div key={s.id} className={`p-4 rounded-xl border ${st.split(' ').slice(0,2).join(' ')}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${st}`}>{s.priority}</span>
                    <span className="text-[9px] font-bold text-slate-400">{Math.round(s.confidence*100)}% conf</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-1">{s.action}</p>
                  <p className="text-[10px] text-slate-500 mb-2">{s.reasoning}</p>
                  <p className="text-[9px] font-bold text-emerald-600">↗ {s.impact}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Resources row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-blue-500"/>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Staff Status</h3>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center"><p className="text-3xl font-black text-slate-800">{twin.staffOnDuty}</p><p className="text-[9px] text-slate-400 font-bold uppercase">On Duty</p></div>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${twin.staffOnDuty>=twin.staffRequired?'bg-emerald-500':'bg-red-500'}`}
                style={{ width:`${Math.min(100,(twin.staffOnDuty/twin.staffRequired)*100)}%` }}/>
            </div>
            <div className="text-center"><p className="text-3xl font-black text-slate-400">{twin.staffRequired}</p><p className="text-[9px] text-slate-400 font-bold uppercase">Required</p></div>
          </div>
          {twin.staffOnDuty<twin.staffRequired && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600">
              <AlertTriangle size={12}/> Gap: {twin.staffRequired-twin.staffOnDuty} short
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Activity size={14} className="text-blue-500"/><h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Ventilators</h3></div>
          <div className="flex items-center gap-4">
            <div className="text-center"><p className="text-3xl font-black text-slate-800">{twin.ventilators.inUse}</p><p className="text-[9px] text-slate-400 font-bold uppercase">In Use</p></div>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${twin.ventilators.inUse/twin.ventilators.total>0.8?'bg-red-500':'bg-blue-500'}`}
                style={{ width:`${(twin.ventilators.inUse/twin.ventilators.total)*100}%` }}/>
            </div>
            <div className="text-center"><p className="text-3xl font-black text-emerald-500">{twin.ventilators.total-twin.ventilators.inUse}</p><p className="text-[9px] text-slate-400 font-bold uppercase">Free</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><CircleDot size={14} className="text-blue-500"/><h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Blood Bank</h3></div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(twin.bloodBanks).map(([type,units]) => {
              const low=(units as number)<10;
              return (
                <div key={type} className={`p-2.5 rounded-xl border text-center ${low?'bg-red-50 border-red-100':'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-black text-slate-500">{type}</p>
                  <p className={`text-lg font-black ${low?'text-red-600':'text-slate-800'}`}>{units}<span className="text-[9px] text-slate-400">u</span></p>
                  {low && <p className="text-[8px] text-red-500 font-bold">LOW</p>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── UNIT MANAGEMENT ──────────────────────────────────────────────────────────
function UnitManagement({ agents, agentStatuses, setAgentStatuses, resources, emergencies, setToast, getEta }: {
  agents: AgentDecision[]; agentStatuses: Record<string,string>;
  setAgentStatuses: React.Dispatch<React.SetStateAction<Record<string,string>>>;
  resources: ResourceRecord[]; emergencies: EmergencyRecord[];
  setToast: (msg:string)=>void; getEta: (em:EmergencyRecord)=>string;
}) {
  const agentIcons: Record<string,string> = { BedAllocation:'🛏️', StaffScheduling:'👥', EmergencyRouting:'🚑', ResourceOptimizer:'⚡' };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
      {/* Fleet strip */}
      <div className="grid grid-cols-4 gap-3">
        {(['Available','On Mission','En Route','Patrol'] as const).map(status => {
          const count=resources.filter(r=>r.status===status).length;
          const styles = { Available:'bg-emerald-50 border-emerald-100 text-emerald-600', 'On Mission':'bg-red-50 border-red-100 text-red-600', 'En Route':'bg-blue-50 border-blue-100 text-blue-600', Patrol:'bg-slate-100 border-slate-200 text-slate-600' };
          return (
            <div key={status} className={`rounded-xl border p-5 text-center ${styles[status]}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2 opacity-70">{status}</p>
              <p className="text-4xl font-black tabular-nums">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Agent queue */}
        <Card className="col-span-7 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-blue-500"/>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">AI Agent Command Queue</h3>
              <div className="flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/><span className="text-[8px] font-bold text-slate-400 uppercase">live</span></div>
            </div>
            <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100">
              {agents.filter(a=>(agentStatuses[a.agentId]??a.status)==='pending').length} pending
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {agents.length===0 ? (
              <div className="py-12 text-center text-slate-400"><CheckCircle2 size={24} className="mx-auto mb-2 opacity-30"/><p className="text-xs font-black uppercase tracking-widest">Queue Empty</p></div>
            ) : agents.map((a,idx) => {
              const status = agentStatuses[a.agentId] ?? a.status;
              const isPending=status==='pending', isExecuting=status==='executing', isCompleted=status==='completed', isRejected=status==='rejected';
              return (
                <motion.div key={a.agentId} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:idx*0.04 }}
                  className={`rounded-xl border p-5 transition-all ${isCompleted?'bg-emerald-50 border-emerald-200':isRejected?'bg-slate-50 border-slate-200 opacity-50':isExecuting?'bg-blue-50 border-blue-200':'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agentIcons[a.agentType]||'🤖'}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${isCompleted?'bg-emerald-100 text-emerald-700 border-emerald-200':isRejected?'bg-slate-100 text-slate-500 border-slate-200':isExecuting?'bg-blue-100 text-blue-700 border-blue-200':'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {isExecuting?'⚙ Executing':status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{a.agentType}</span>
                        </div>
                      </div>
                    </div>
                    <ConfBar value={a.confidence}/>
                  </div>
                  <p className={`text-xs font-bold mb-1.5 leading-tight ${isRejected?'line-through text-slate-400':'text-slate-900'}`}>{a.decision}</p>
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{a.reasoning}</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-600 mb-4">
                    <ArrowUpRight size={10}/> {a.impact}
                  </div>

                  {isPending && (
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                        onClick={() => {
                          setAgentStatuses(prev=>({...prev,[a.agentId]:'executing'}));
                          setToast(`⚙ Executing: ${a.agentType}...`);
                          setTimeout(()=>{ setAgentStatuses(prev=>({...prev,[a.agentId]:'completed'})); setToast(`✅ ${a.agentType} executed`); },2000);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wide text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                        <Zap size={13}/> Approve & Execute
                      </motion.button>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                        onClick={() => { setAgentStatuses(prev=>({...prev,[a.agentId]:'rejected'})); setToast(`❌ ${a.agentType} rejected`); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wide text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                        <X size={13}/> Reject
                      </motion.button>
                    </div>
                  )}
                  {isExecuting && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50">
                      <div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay:`${i*0.15}s` }}/>)}</div>
                      <span className="text-xs font-bold text-blue-700">Executing agent decision...</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50">
                      <CheckCircle2 size={14} className="text-emerald-600"/>
                      <span className="text-xs font-bold text-emerald-700">Executed successfully</span>
                      <button onClick={()=>setAgentStatuses(prev=>({...prev,[a.agentId]:'pending'}))} className="ml-auto text-[9px] text-slate-400 hover:text-slate-600 font-bold underline underline-offset-2">Revert</button>
                    </div>
                  )}
                  {isRejected && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                      <X size={14} className="text-slate-400"/>
                      <span className="text-xs font-medium text-slate-400">Decision rejected</span>
                      <button onClick={()=>setAgentStatuses(prev=>({...prev,[a.agentId]:'pending'}))} className="ml-auto text-[9px] text-blue-500 hover:text-blue-700 font-bold underline underline-offset-2">Reconsider</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Field roster */}
        <Card className="col-span-5 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2 shrink-0">
            <Radio size={14} className="text-blue-500"/>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Field Unit Roster</h3>
            <div className="flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/><span className="text-[8px] font-bold text-slate-400 uppercase">live</span></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {resources.map((r,i)=>{
              const statusColors: Record<string,string> = { Available:'bg-emerald-100 text-emerald-700', 'On Mission':'bg-red-100 text-red-700', 'En Route':'bg-blue-100 text-blue-700', Patrol:'bg-slate-100 text-slate-600' };
              const assignedTo=emergencies.find(e=>e.assignedResource===r.id);
              return (
                <motion.div key={r.id} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.type==='Police'?'bg-blue-50':'bg-emerald-50'}`}>
                    {r.type==='Police' ? <ShieldAlert size={16} className="text-blue-600"/> : <Ambulance size={16} className="text-emerald-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-black text-slate-900">{r.id}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusColors[r.status]||'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                    </div>
                    {assignedTo ? <p className="text-[9px] text-slate-500">→ <span className="font-bold">{assignedTo.id}</span> — {assignedTo.subtype}</p>
                      : <p className="text-[9px] text-slate-400 font-mono">{(r.location[0] as number).toFixed(4)}, {(r.location[1] as number).toFixed(4)}</p>}
                  </div>
                  {assignedTo && (
                    <div className="text-right shrink-0">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">ETA</p>
                      <p className="text-xs font-black text-blue-600">{getEta(assignedTo)}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── RESPONSE ANALYTICS ───────────────────────────────────────────────────────
function ResponseAnalytics({ analyticsHistory, anomalies, emergencies, patients }: {
  analyticsHistory: AnalyticsSnapshot[]; anomalies: AnomalyEvent[];
  emergencies: EmergencyRecord[]; patients: PatientRiskProfile[];
}) {
  const latest=analyticsHistory[analyticsHistory.length-1];
  const prev=analyticsHistory[analyticsHistory.length-2];
  const byType=emergencies.reduce((acc,e)=>{ acc[e.type]=(acc[e.type]||0)+1; return acc; },{} as Record<string,number>);
  const typeColors=['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'System Load',    value:latest?`${Math.round(latest.systemLoad*100)}%`:'—',    spark:analyticsHistory.map(s=>Math.round(s.systemLoad*100)),   color:'#3b82f6' },
          { label:'Mortality Risk', value:latest?`${Math.round(latest.mortalityRisk*100)}%`:'—', spark:analyticsHistory.map(s=>Math.round(s.mortalityRisk*100)), color:'#ef4444' },
          { label:'Critical Count', value:latest?String(latest.criticalCount):'—',               spark:analyticsHistory.map(s=>s.criticalCount),                  color:'#f59e0b' },
          { label:'Anomaly Index',  value:latest?`${Math.round(latest.anomalyScore*100)}%`:'—',  spark:analyticsHistory.map(s=>Math.round(s.anomalyScore*100)),   color:'#8b5cf6' },
        ].map(({ label,value,spark,color })=>(
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black tabular-nums text-slate-800">{value}</p>
              </div>
              <Sparkline data={spark.slice(-20)} color={color} width={56} height={28}/>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Bottleneck */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={14} className="text-amber-500"/><h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Bottleneck Radar</h3></div>
          {!latest||latest.bottlenecks.length===0 ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
              <CheckCircle2 size={14} className="text-emerald-500"/><div><p className="text-xs font-bold text-emerald-700">All clear</p><p className="text-[9px] text-emerald-600">No bottlenecks</p></div>
            </div>
          ) : latest.bottlenecks.map((b,i)=>(
            <div key={b} className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 mb-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1 shrink-0 animate-pulse"/>
              <div><p className="text-xs font-bold text-amber-800">{b}</p><p className="text-[9px] text-amber-600">{new Date().toLocaleTimeString()}</p></div>
            </div>
          ))}
          {latest && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Forecast</p>
              {[['Next 1h',latest.predictions.next1h],['Next 6h',latest.predictions.next6h],['Next 24h',latest.predictions.next24h]].map(([label,value])=>(
                <div key={String(label)} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-[10px] text-slate-500">{label}</span>
                  <div className="flex items-center gap-1.5"><span className="text-sm font-black text-slate-800 tabular-nums">{value}</span><span className="text-[9px] text-slate-400">critical</span></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Incident distribution */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart2 size={14} className="text-blue-500"/><h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Incident Distribution</h3></div>
          <div className="space-y-3">
            {Object.entries(byType).map(([type,count],i)=>{
              const total=Object.values(byType).reduce((a,b)=>a+b,0);
              const pct=total?Math.round((count/total)*100):0;
              const color=typeColors[i%typeColors.length];
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm" style={{ backgroundColor:color }}/><span className="text-xs font-bold text-slate-700">{type}</span></div>
                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-800">{count}</span><span className="text-[9px] text-slate-400">{pct}%</span></div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div animate={{ width:`${pct}%` }} className="h-full rounded-full" style={{ backgroundColor:color }}/>
                  </div>
                </div>
              );
            })}
          </div>
          {latest && (
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Avg Response</p>
                <p className="text-lg font-black text-slate-800">{Math.round(latest.avgResponseTime)}m</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Resolution</p>
                <p className="text-lg font-black text-emerald-600">{emergencies.length?Math.round((emergencies.filter(e=>e.status==='Resolved').length/emergencies.length)*100):0}%</p>
              </div>
            </div>
          )}
        </Card>

        {/* Anomaly feed */}
        <Card className="p-5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><CircleDot size={14} className="text-purple-500"/><h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Anomaly Feed</h3></div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"/><span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">{anomalies.length}</span></div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {anomalies.length===0 ? (
              <div className="py-8 text-center"><Shield size={20} className="mx-auto mb-2 text-slate-300"/><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Anomalies</p></div>
            ) : anomalies.slice().reverse().map((a,i)=>(
              <motion.div key={a.id} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                className={`p-3.5 rounded-xl border ${a.severity==='critical'?'bg-red-50 border-red-100':'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.severity==='critical'?'bg-red-500':'bg-amber-500'}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${a.severity==='critical'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-600'}`}>{a.type.replace('_',' ')}</span>
                      <span className="text-[9px] text-slate-400 font-mono ml-auto">{new Date(a.detectedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-tight">{a.description}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{a.affectedArea} · {Math.round(a.confidence*100)}% conf</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={14} className="text-blue-500"/>
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-600">Incident Timeline</h3>
        </div>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-100"/>
          <div className="space-y-3">
            {emergencies.slice(0,6).map((e,i)=>{
              const color=e.priority==='Critical'?'#ef4444':e.priority==='Moderate'?'#f59e0b':'#3b82f6';
              return (
                <div key={e.id} className="flex items-center gap-4 relative">
                  <div className="absolute -left-6 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor:color }}/>
                  <div className="flex-1 flex items-center gap-4 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                    <span className="text-[9px] font-mono text-slate-400 w-16 shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[10px] font-black text-slate-800 truncate flex-1">{e.id} — {e.subtype}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor:`${color}15`, color }}>{e.priority}</span>
                    <span className={`text-[9px] font-bold shrink-0 ${e.assignedResource?'text-emerald-600':'text-slate-400'}`}>{e.assignedResource||'Unassigned'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AuthorityDashboard({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [emergencies, setEmergencies]   = useState<EmergencyRecord[]>([]);
  const [hospitals, setHospitals]       = useState<HospitalRecord[]>([]);
  const [resources, setResources]       = useState<ResourceRecord[]>([]);
  const [activeEmergencyIdx, setActiveEmergencyIdx] = useState<number | null>(null);
  const [resourceFilter] = useState<'All'|'Ambulance'|'Police'>('All');
  const [emergencySearch, setEmergencySearch] = useState('');
  const [hospitalSearch]  = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [simMode, setSimMode]   = useState<SimulationMode>('normal');
  const [simRunning, setSimRunning] = useState(true);
  const [patients, setPatients] = useState<PatientRiskProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRiskProfile | null>(null);
  const [twin, setTwin]         = useState<HospitalTwin | null>(null);
  const [agents, setAgents]     = useState<AgentDecision[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string,string>>({});
  const [analyticsHistory, setAnalyticsHistory] = useState<AnalyticsSnapshot[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotBadge, setCopilotBadge] = useState(0);
  const simIntervalRef = useRef<any>(null);

  useEffect(() => { if (toast) { const t=setTimeout(()=>setToast(null),3000); return ()=>clearTimeout(t); } }, [toast]);

  useEffect(() => {
    const s=io();
    Promise.all([fetch('/api/emergencies'),fetch('/api/hospitals'),fetch('/api/resources')])
      .then(async ([e,h,r])=>{ setEmergencies(await e.json()); setHospitals(await h.json()); setResources(await r.json()); });
    s.on('emergency:new', e=>setEmergencies(p=>[e,...p]));
    s.on('emergency:update', u=>setEmergencies(p=>p.map(e=>e.id===u.id?u:e)));
    s.on('resources:update', setResources);
    s.on('hospitals:update', setHospitals);
    return ()=>{ s.close(); };
  }, []);

  useEffect(() => {
    setPatients(Array.from({length:12},(_,i)=>generatePatient(`P-${1000+i}`)));
    setTwin(generateHospitalTwin('H-01','normal'));
  }, []);

  useEffect(() => {
    if (!simRunning) { clearInterval(simIntervalRef.current); return; }
    const cfg=getSimConfig(simMode);
    simIntervalRef.current=setInterval(()=>{
      setPatients(prev=>{
        const updated=prev.map(p=>computeRiskProfile(p, simulateVitals(p.vitals, simMode, p.riskScore>60 && Math.random()<0.4)));
        if (Math.random()<cfg.patientInjectRate*0.1 && updated.length<25) updated.push(generatePatient());
        const newTwin=generateHospitalTwin('H-01',simMode);
        setTwin(newTwin);
        const newAgents=runAgentDecisions(simMode,newTwin,updated);
        setAgents(newAgents);
        if (newAgents.some(a=>a.priority===1) && !showCopilot) setCopilotBadge(p=>p+1);
        setAnalyticsHistory(prev=>{
          const snap=computeAnalytics(updated,newTwin,prev);
          const hist=[...prev.slice(-29),snap];
          setAnomalies(detectAnomalies(hist));
          return hist;
        });
        return updated;
      });
    },2500);
    return ()=>clearInterval(simIntervalRef.current);
  }, [simRunning, simMode]);

  const activeEmergency  = activeEmergencyIdx!==null ? emergencies[activeEmergencyIdx] : null;
  const assignedResource = activeEmergency?.assignedResource ? resources.find(r=>r.id===activeEmergency.assignedResource) : null;
  const mapCenter: [number,number] = assignedResource ? assignedResource.location : (activeEmergency?.location || [12.9716,77.5946]);
  const criticalCount    = patients.filter(p=>p.riskScore>=70).length;
  const availableUnits   = resources.filter(r=>r.status==='Available').length;

  const getEta = (em: EmergencyRecord) => {
    const res=resources.find(r=>r.id===em.assignedResource);
    if (!res) return 'Calc...';
    const d=Math.sqrt(Math.pow(res.location[0]-em.location[0],2)+Math.pow(res.location[1]-em.location[1],2));
    return `${Math.max(1,Math.round(d*2000))}–${Math.max(2,Math.round(d*2000)+2)} min`;
  };

  const triggerGreenCorridor=async(id:string)=>{
    const em=emergencies.find(e=>e.id===id); if (!em) return;
    await fetch('/api/traffic/green-corridor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ambulanceId:em.assignedResource,route:'Route A'})});
    setToast(`✅ Green Corridor activated for ${em.assignedResource}`);
  };

  const tabTitle: Record<TabType,string> = { map:'Dispatch Command', monitor:'AI Clinical Risk Engine', facility:'Hospital Digital Twin', units:'AI Operations Commander', analytics:'Strategic Intelligence' };

  const renderIncidentMap = () => (
    <div className="flex-1 grid grid-cols-12 overflow-hidden p-4 gap-4 bg-slate-50">
      <div className="col-span-3 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Incident Feed</h3><Filter size={14} className="text-slate-400"/></div>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="ID, type, location..." value={emergencySearch} onChange={e=>setEmergencySearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 text-xs rounded-md focus:ring-1 focus:ring-blue-500 outline-none"/></div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {emergencies.filter(e=>e.id.toLowerCase().includes(emergencySearch.toLowerCase())||e.type.toLowerCase().includes(emergencySearch.toLowerCase())||(e.locationName&&e.locationName.toLowerCase().includes(emergencySearch.toLowerCase()))).map(e=>(
              <div key={e.id} onClick={()=>setActiveEmergencyIdx(emergencies.findIndex(em=>em.id===e.id))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${activeEmergency?.id===e.id?'bg-white border-blue-400 shadow-md ring-1 ring-blue-300':'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${e.priority==='Critical'?'bg-red-500 animate-pulse':e.priority==='Moderate'?'bg-amber-500':'bg-blue-500'}`}/>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border uppercase ${e.priority==='Critical'?'bg-red-50 text-red-700 border-red-100':e.priority==='Moderate'?'bg-amber-50 text-amber-700 border-amber-100':'bg-blue-50 text-blue-700 border-blue-100'}`}>{e.priority}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 tabular-nums">{new Date(e.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <h4 className="font-black text-slate-900 text-xs mb-1.5 line-clamp-1">{e.subtype||e.type}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] text-slate-400"><MapPin size={10} className="text-slate-300"/><span className="truncate max-w-[90px]">{e.locationName||'Central'}</span></div>
                  <div className="h-1 w-10 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${e.urgencyScore>0.8?'bg-red-500':'bg-blue-500'}`} style={{ width:`${(e.urgencyScore||0.5)*100}%` }}/></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-span-6 flex flex-col relative">
        <Card className="flex-1 overflow-hidden relative">
          <GlobalMap center={mapCenter} emergencies={emergencies} hospitals={hospitals} resources={resources}
            onMarkerClick={(type,id)=>{ if(type==='emergency'){const idx=emergencies.findIndex(e=>e.id===id);if(idx!==-1)setActiveEmergencyIdx(idx);} }}/>
          {assignedResource && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur py-2 px-4 rounded-full border border-blue-200 shadow-xl z-[1000] flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"/><span className="text-xs font-black text-slate-800">Live: {assignedResource.id}</span>
              <div className="h-4 w-px bg-slate-200"/><span className="text-xs font-black text-blue-600">ETA: {getEta(activeEmergency!)}</span>
            </div>
          )}
        </Card>
      </div>

      <div className="col-span-3 flex flex-col gap-4 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeEmergency && (
            <motion.div key={activeEmergency.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              className="bg-white rounded-xl border-l-4 border-l-blue-600 border border-blue-200 shadow-lg p-5 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Active Incident</span>
                <button onClick={()=>setActiveEmergencyIdx(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
              </div>
              <h4 className="text-slate-900 font-bold mb-3">{activeEmergency.id} — {activeEmergency.subtype}</h4>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                {[['Citizen',activeEmergency.citizen],['Time',new Date(activeEmergency.timestamp).toLocaleTimeString()],['Cas.',activeEmergency.casualties??0]].map(([k,v])=>(
                  <div key={String(k)} className="bg-slate-50 rounded-lg p-2"><p className="text-[9px] text-slate-400 font-bold uppercase">{k}</p><p className="text-xs font-black text-slate-800 truncate">{v}</p></div>
                ))}
              </div>
              <div className="mb-4 space-y-2">
                {activeEmergency.timeline?.slice(-3).map((evt,i)=>(
                  <div key={i} className="flex gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${i===(activeEmergency.timeline?.length||0)-1?'bg-emerald-500':'bg-slate-300'}`}/>
                    <div><p className="text-[10px] font-bold text-slate-800">{evt.event}</p><p className="text-[9px] text-slate-400">{new Date(evt.time).toLocaleTimeString()}</p></div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assign Resource</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {resources.filter(r=>resourceFilter==='All'||r.type===resourceFilter).slice(0,4).map(r=>(
                    <button key={r.id} disabled={r.status!=='Available'}
                      onClick={async()=>{ const res=await fetch(`/api/emergency/${activeEmergency.id}/assign`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({resourceId:r.id})}); if(res.ok) setToast(`${r.id} dispatched`); }}
                      className={`flex items-center gap-1.5 p-2 border rounded-lg transition-all text-left ${r.status==='Available'?'bg-white hover:bg-blue-50 border-slate-200 cursor-pointer':'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'}`}>
                      {r.type==='Police'?<ShieldAlert size={11} className="text-blue-500"/>:<Ambulance size={11} className="text-emerald-500"/>}
                      <div><p className="text-[10px] font-black text-slate-800">{r.id}</p><p className={`text-[8px] font-bold uppercase ${r.status==='Available'?'text-emerald-600':'text-amber-600'}`}>{r.status}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>triggerGreenCorridor(activeEmergency.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"><Zap size={12}/> Clear Route</button>
                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase py-2 rounded-lg transition-colors">Reallocate</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between"><h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Facility Status</h3><Hospital size={14} className="text-blue-500"/></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {hospitals.map(h=>{
              const icuPct=(h.availableIcu/h.icuBeds)*100;
              const lc=h.load==='High'?'text-red-600':h.load==='Medium'?'text-amber-600':'text-emerald-600';
              return (
                <div key={h.id} className="p-3 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2"><h4 className="text-slate-900 font-bold text-xs flex-1 pr-2">{h.name}</h4><span className={`text-[9px] font-black uppercase ${lc}`}>{h.load}</span></div>
                  {[{label:'ICU',available:h.availableIcu,total:h.icuBeds,danger:icuPct<20},{label:'Beds',available:h.availableBeds,total:h.totalBeds,danger:false}].map(({label,available,total,danger})=>(
                    <div key={label} className="mb-1">
                      <div className="flex justify-between mb-0.5"><span className="text-[9px] font-bold text-slate-500 uppercase">{label}</span><span className={`text-[9px] font-black ${danger?'text-red-600':'text-slate-600'}`}>{available}/{total}</span></div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${danger?'bg-red-500':'bg-blue-500'}`} style={{ width:`${(available/total)*100}%` }}/></div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'map':       return renderIncidentMap();
      case 'monitor':   return <CriticalMonitor patients={patients} selectedPatient={selectedPatient} onSelectPatient={setSelectedPatient}/>;
      case 'facility':  return <FacilityTelemetry twin={twin} simMode={simMode}/>;
      case 'units':     return <UnitManagement agents={agents} agentStatuses={agentStatuses} setAgentStatuses={setAgentStatuses} resources={resources} emergencies={emergencies} setToast={setToast} getEta={getEta}/>;
      case 'analytics': return <ResponseAnalytics analyticsHistory={analyticsHistory} anomalies={anomalies} emergencies={emergencies} patients={patients}/>;
    }
  };

  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden font-sans ${showCopilot?'pr-96':''} transition-all duration-300`}>
      {/* Sidebar — light */}
      <nav className="w-60 bg-white border-r border-slate-200 flex flex-col py-5 shadow-sm shrink-0">
        <div className="px-5 mb-8 flex items-center gap-3">
          <AneisLogo size={32}/>
          <div>
            <span className="font-black text-slate-900 tracking-tight block text-sm">ANEIS HUB</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${simRunning?'bg-emerald-500 animate-pulse':'bg-slate-300'}`}/>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{simMode} mode</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-0.5">
          {([
            { id:'map',       icon:MapIcon,    label:'Incident Map'       },
            { id:'monitor',   icon:Activity,   label:'Critical Monitor'   },
            { id:'facility',  icon:Hospital,   label:'Facility Telemetry' },
            { id:'units',     icon:Users,      label:'Unit Management'    },
            { id:'analytics', icon:TrendingUp, label:'Response Analytics' },
          ] as const).map(({ id, icon:Icon, label })=>(
            <button key={id} onClick={()=>setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all text-left border ${activeTab===id?'bg-blue-50 text-blue-700 border-blue-200 shadow-sm':'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent'}`}>
              <Icon size={16}/><span className="font-semibold flex-1">{label}</span>
              {activeTab===id && <ChevronRight size={12} className="opacity-40"/>}
            </button>
          ))}
        </div>

        {/* Sim controls */}
        <div className="px-4 py-4 mx-3 mb-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Simulation</span>
            <button onClick={()=>setSimRunning(r=>!r)}
              className={`flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-lg border transition-all ${simRunning?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {simRunning?<><Pause size={9}/> Live</>:<><Play size={9}/> Paused</>}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['normal','surge','disaster'] as SimulationMode[]).map(m=>(
              <button key={m} onClick={()=>setSimMode(m)}
                className={`text-[9px] font-black uppercase py-1.5 rounded-lg transition-all ${simMode===m?m==='disaster'?'bg-red-600 text-white':m==='surge'?'bg-amber-500 text-white':'bg-blue-600 text-white':'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 space-y-1">
          <button onClick={()=>{ setShowCopilot(c=>!c); setCopilotBadge(0); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border relative ${showCopilot?'bg-blue-600 text-white border-blue-600':'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
            <Brain size={16}/><span>AI Copilot</span>
            {copilotBadge>0 && <span className="ml-auto bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{copilotBadge}</span>}
          </button>
          <button onClick={onBack} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm border border-transparent">
            <LogOut size={16}/> Exit Command
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-5">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">{tabTitle[activeTab]}</h2>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
              {[{label:'Critical',value:criticalCount,color:'text-red-600'},{label:'Available',value:availableUnits,color:'text-emerald-600'},{label:'Patients',value:patients.length,color:'text-blue-600'}].map(({label,value,color})=>(
                <div key={label} className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase">{label}</span><span className={`text-xs font-black tabular-nums ${color}`}>{value}</span></div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {simMode!=='normal' && <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full animate-pulse ${simMode==='disaster'?'bg-red-100 text-red-600 border border-red-200':'bg-amber-100 text-amber-600 border border-amber-200'}`}>⚠ {simMode} active</span>}
            <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><Bell size={17}/></button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-xs">DP</div>
              <div><p className="text-xs font-bold text-slate-900">D. Patil</p><p className="text-[9px] text-slate-400">Duty Officer</p></div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.12 }} className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showCopilot && <CopilotPanel patients={patients} twin={twin} agents={agents} onClose={()=>setShowCopilot(false)}/>}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:80 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:80 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 size={15} className="text-emerald-400"/><span className="text-xs font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
