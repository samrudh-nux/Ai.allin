import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Minus, ArrowUpRight, ArrowDownRight, Zap, Brain, Cpu, Radio,
  Users, Hospital, BarChart2, CircleDot, Clock, Shield,
  ChevronRight, RefreshCw, Eye, Target, Layers, GitBranch,
  Ambulance, ShieldAlert, X
} from 'lucide-react';
import {
  PatientRiskProfile, HospitalTwin, AgentDecision,
  AnalyticsSnapshot, AnomalyEvent, SimulationMode, EmergencyRecord, ResourceRecord
} from './types';

// ─── Design Tokens ───────────────────────────────────────────────────────────

const RISK_COLOR = (score: number) =>
  score >= 70 ? '#ef4444' : score >= 45 ? '#f59e0b' : '#22c55e';

const RISK_BG = (score: number) =>
  score >= 70 ? 'rgba(239,68,68,0.08)' : score >= 45 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)';

const RISK_BORDER = (score: number) =>
  score >= 70 ? 'rgba(239,68,68,0.2)' : score >= 45 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)';

// ─── Micro Components ────────────────────────────────────────────────────────

function LiveDot({ color = '#22c55e', pulse = true }: { color?: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex w-2 h-2">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ backgroundColor: color }} />}
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

function Sparkline({ data, color = '#3b82f6', width = 80, height = 28 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ');
  const area = `M0,${height} L${pts.split(' ').map((p, i) => i === 0 ? p : p).join(' L')} L${width},${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#sg-${color.replace('#','')})`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = width;
        const y = height - ((last - min) / range) * height;
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

function GaugeArc({ value, max = 100, size = 72, color = '#3b82f6', label }: {
  value: number; max?: number; size?: number; color?: string; label?: string;
}) {
  const pct = Math.min(value / max, 1);
  const r = size / 2 - 6;
  const cx = size / 2, cy = size / 2;
  const startAngle = -215, sweep = 250;
  const endAngle = startAngle + sweep * pct;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (sa: number, ea: number) => {
    const s = { x: cx + r * Math.cos(toRad(sa)), y: cy + r * Math.sin(toRad(sa)) };
    const e = { x: cx + r * Math.cos(toRad(ea)), y: cy + r * Math.sin(toRad(ea)) };
    const large = ea - sa > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <path d={arcPath(-215, 35)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="white">{value}</text>
      </svg>
      {label && <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color }}>{label}</span>}
    </div>
  );
}

function StatPill({ label, value, delta, unit = '' }: {
  label: string; value: string | number; delta?: number; unit?: string;
}) {
  const up = delta !== undefined && delta > 0;
  const dn = delta !== undefined && delta < 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-black text-white tabular-nums">{value}</span>
        {unit && <span className="text-[10px] text-slate-500 font-bold">{unit}</span>}
        {delta !== undefined && (
          <span className={`text-[10px] font-black flex items-center gap-0.5 ${up ? 'text-red-400' : dn ? 'text-emerald-400' : 'text-slate-500'}`}>
            {up ? <ArrowUpRight size={10} /> : dn ? <ArrowDownRight size={10} /> : <Minus size={10} />}
            {Math.abs(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, live = false, children }: {
  icon: any; title: string; subtitle?: string; live?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
          <Icon size={15} className="text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-black text-white uppercase tracking-wider">{title}</h3>
            {live && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <LiveDot />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">live</span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Panel wrapper — obsidian dark glass
function Panel({ children, className = '', glow = false }: {
  children: React.ReactNode; className?: string; glow?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-white/8 bg-slate-900/80 backdrop-blur-sm relative overflow-hidden ${className}`}
      style={glow ? { boxShadow: '0 0 0 1px rgba(59,130,246,0.1), 0 4px 24px rgba(0,0,0,0.4)' } : { boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
      {/* Subtle top shine */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}

// ─── SECTION 1: CRITICAL MONITOR ─────────────────────────────────────────────

export function CriticalMonitorSection({ patients, selectedPatient, onSelectPatient }: {
  patients: PatientRiskProfile[];
  selectedPatient: PatientRiskProfile | null;
  onSelectPatient: (p: PatientRiskProfile | null) => void;
}) {
  const critical = patients.filter(p => p.riskScore >= 70);
  const warning  = patients.filter(p => p.riskScore >= 45 && p.riskScore < 70);
  const stable   = patients.filter(p => p.riskScore < 45);
  const avgRisk  = patients.length ? Math.round(patients.reduce((a, p) => a + p.riskScore, 0) / patients.length) : 0;
  const rising   = patients.filter(p => p.riskTrend === 'rising').length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4 p-4"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #070b12 100%)' }}>
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3 shrink-0">
        {[
          { label: 'Critical Risk', value: critical.length, color: '#ef4444', spark: patients.map(p => p.riskScore >= 70 ? 1 : 0), sub: '≥70 score' },
          { label: 'Deteriorating', value: rising, color: '#f59e0b', spark: patients.map(p => p.riskTrend === 'rising' ? 1 : 0), sub: 'trending up' },
          { label: 'Avg Risk Score', value: avgRisk, color: avgRisk >= 60 ? '#ef4444' : '#3b82f6', spark: patients.map(p => p.riskScore), sub: '/ 100' },
          { label: 'Monitored', value: patients.length, color: '#3b82f6', spark: [], sub: 'total patients' },
          { label: 'Stable', value: stable.length, color: '#22c55e', spark: [], sub: 'score < 45' },
        ].map(({ label, value, color, spark, sub }) => (
          <Panel key={label} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black tabular-nums mt-1" style={{ color }}>{value}</p>
                <p className="text-[9px] text-slate-600 font-medium">{sub}</p>
              </div>
              {spark.length > 0 && <Sparkline data={spark.slice(-20)} color={color} width={52} height={28} />}
            </div>
          </Panel>
        ))}
      </div>
      {/* Main content */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4">
        {/* Patient Risk Board */}
        <Panel className="col-span-4 flex flex-col overflow-hidden">
          <div className="p-4 shrink-0">
            <SectionHeader icon={Activity} title="Patient Risk Board" live>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tabular-nums">{patients.length} monitored</span>
              </div>
            </SectionHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
            {[...patients].sort((a, b) => b.riskScore - a.riskScore).map((p, idx) => {
              const color = RISK_COLOR(p.riskScore);
              const isSelected = selectedPatient?.patientId === p.patientId;
              return (
                <motion.button key={p.patientId} initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                  onClick={() => onSelectPatient(isSelected ? null : p)}
                  className={`w-full text-left rounded-xl p-3 border transition-all group ${isSelected
                    ? 'border-blue-500/40 bg-blue-500/8'
                    : 'border-white/5 hover:border-white/12 bg-white/2 hover:bg-white/4'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <LiveDot color={color} pulse={p.riskScore >= 70} />
                      <span className="text-[11px] font-black text-white truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.riskTrend === 'rising'  && <ArrowUpRight   size={11} style={{ color: '#ef4444' }} />}
                      {p.riskTrend === 'falling' && <ArrowDownRight  size={11} style={{ color: '#22c55e' }} />}
                      {p.riskTrend === 'stable'  && <Minus           size={11} className="text-slate-500" />}
                      <span className="text-[13px] font-black tabular-nums" style={{ color }}>{p.riskScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 truncate max-w-[110px]">{p.diagnosis}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border"
                      style={{ color, borderColor: RISK_BORDER(p.riskScore), backgroundColor: RISK_BG(p.riskScore) }}>
                      {p.ward}
                    </span>
                  </div>
                  {/* Risk bar */}
                  <div className="h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div animate={{ width: `${p.riskScore}%` }}
                      className="h-full rounded-full" style={{ backgroundColor: color }} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Panel>
        {/* Patient Detail */}
        <div className="col-span-8 flex flex-col gap-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div key={selectedPatient.patientId}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                {/* Header panel */}
                <Panel className="p-5" glow>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <GaugeArc value={selectedPatient.riskScore} color={RISK_COLOR(selectedPatient.riskScore)} size={80} label="RISK" />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-black text-white">{selectedPatient.name}</h2>
                          <span className="text-[9px] font-black px-2 py-1 rounded-lg border"
                            style={{ color: RISK_COLOR(selectedPatient.riskScore), borderColor: RISK_BORDER(selectedPatient.riskScore), backgroundColor: RISK_BG(selectedPatient.riskScore) }}>
                            {selectedPatient.riskScore >= 70 ? 'CRITICAL' : selectedPatient.riskScore >= 45 ? 'WARNING' : 'STABLE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3">{selectedPatient.diagnosis} · {selectedPatient.ward} · Age {selectedPatient.age}</p>
                        <div className="grid grid-cols-3 gap-3">
                          <StatPill label="1h Detn Risk" value={`${selectedPatient.deteriorationRisk1h}%`} delta={selectedPatient.riskTrend === 'rising' ? 3 : undefined} />
                          <StatPill label="6h Detn Risk" value={`${selectedPatient.deteriorationRisk6h}%`} />
                          <StatPill label="AI Confidence" value={`${Math.round(selectedPatient.confidenceScore * 100)}%`} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onSelectPatient(null)} className="text-slate-600 hover:text-slate-400 p-1 rounded-lg hover:bg-white/5 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </Panel>
                {/* Vitals grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Heart Rate', value: Math.round(selectedPatient.vitals.heartRate), unit: 'bpm', normal: [60, 100], history: selectedPatient.vitalHistory.map(h => h.heartRate) },
                    { label: 'Blood Pressure', value: Math.round(selectedPatient.vitals.systolicBP), unit: 'mmHg', normal: [90, 140], history: selectedPatient.vitalHistory.map(h => h.systolicBP) },
                    { label: 'O₂ Saturation', value: Math.round(selectedPatient.vitals.oxygenSat), unit: '%', normal: [95, 100], history: selectedPatient.vitalHistory.map(h => h.oxygenSat) },
                    { label: 'Temperature', value: selectedPatient.vitals.temperature.toFixed(1), unit: '°C', normal: [36.1, 37.5], history: selectedPatient.vitalHistory.map(h => h.temperature) },
                    { label: 'Resp. Rate', value: Math.round(selectedPatient.vitals.respiratoryRate), unit: '/min', normal: [12, 20], history: selectedPatient.vitalHistory.map(h => h.respiratoryRate) },
                    { label: 'Glucose', value: Math.round(selectedPatient.vitals.glucoseLevel), unit: 'mg/dL', normal: [70, 140], history: selectedPatient.vitalHistory.map(h => h.glucoseLevel) },
                  ].map(({ label, value, unit, normal, history }) => {
                    const v = parseFloat(String(value));
                    const ok = v >= normal[0] && v <= normal[1];
                    const warn = !ok && v >= normal[0] * 0.85 && v <= normal[1] * 1.2;
                    const color = ok ? '#22c55e' : warn ? '#f59e0b' : '#ef4444';
                    return (
                      <Panel key={label} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-black tabular-nums" style={{ color }}>{value}</span>
                              <span className="text-[10px] text-slate-600">{unit}</span>
                            </div>
                          </div>
                          <Sparkline data={history} color={color} width={52} height={28} />
                        </div>
                        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: ok ? '50%' : warn ? '75%' : '95%', backgroundColor: color }} />
                        </div>
                      </Panel>
                    );
                  })}
                </div>
                {/* AI Explanation */}
                <Panel className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={13} className="text-blue-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Clinical Analysis</span>
                    <div className="ml-auto flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      <span className="text-[8px] font-black text-blue-400">{Math.round(selectedPatient.confidenceScore * 100)}% confidence</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{selectedPatient.aiExplanation}</p>
                  {selectedPatient.alerts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedPatient.alerts.map(a => (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                          style={{ borderColor: a.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', backgroundColor: a.severity === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)' }}>
                          <AlertTriangle size={12} style={{ color: a.severity === 'critical' ? '#ef4444' : '#f59e0b' }} />
                          <span className="text-[10px] font-medium" style={{ color: a.severity === 'critical' ? '#fca5a5' : '#fcd34d' }}>{a.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center">
                <Panel className="p-16 text-center border-dashed">
                  <Activity size={32} className="mx-auto mb-4 text-slate-700" />
                  <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Select a Patient</p>
                  <p className="text-[11px] text-slate-700 mt-1">Click any patient to view real-time AI risk analysis</p>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION 2: FACILITY TELEMETRY ───────────────────────────────────────────

export function FacilityTelemetrySection({ twin, simMode }: {
  twin: HospitalTwin | null;
  simMode: SimulationMode;
}) {
  const [simDelta, setSimDelta] = useState(0);
  const [showSim, setShowSim] = useState(false);

  if (!twin) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0f1e' }}>
      <div className="flex items-center gap-3 text-slate-600">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-sm font-bold uppercase tracking-widest">Initializing Digital Twin...</span>
      </div>
    </div>
  );

  const simOccupancy = Math.min(99, twin.currentOccupancy + simDelta);
  const simIcu = Math.min(99, twin.icuOccupancy + simDelta * 1.3);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #070b12 100%)' }}>
      {/* Top KPI Row */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        {[
          {
            label: 'Bed Occupancy', value: `${simOccupancy}%`,
            sub: `→ ${twin.predictedOccupancy6h + simDelta}% in 6h`,
            color: simOccupancy > 85 ? '#ef4444' : '#3b82f6',
            icon: Layers, crit: simOccupancy > 85,
          },
          {
            label: 'ICU Occupancy', value: `${Math.round(simIcu)}%`,
            sub: `${twin.ventilators.inUse}/${twin.ventilators.total} vents`,
            color: simIcu > 85 ? '#ef4444' : '#f59e0b',
            icon: Activity, crit: simIcu > 85,
          },
          {
            label: 'Patient Flow', value: `+${twin.patientInflow}`,
            sub: `−${twin.patientOutflow}/hr outflow`,
            color: twin.patientInflow > twin.patientOutflow * 1.3 ? '#ef4444' : '#22c55e',
            icon: TrendingUp, crit: false,
          },
          {
            label: 'Oxygen Supply', value: `${twin.oxygenLevel}%`,
            sub: twin.oxygenLevel < 40 ? '⚠ CRITICAL THRESHOLD' : 'Within safe range',
            color: twin.oxygenLevel < 40 ? '#ef4444' : twin.oxygenLevel < 60 ? '#f59e0b' : '#22c55e',
            icon: CircleDot, crit: twin.oxygenLevel < 40,
          },
        ].map(({ label, value, sub, color, icon: Icon, crit }) => (
          <Panel key={label} className="p-5" glow={crit}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={13} style={{ color }} />
              </div>
              {crit && <LiveDot color="#ef4444" />}
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
            <p className="text-[9px] font-medium mt-1" style={{ color: crit ? '#fca5a5' : '#64748b' }}>{sub}</p>
          </Panel>
        ))}
      </div>
      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Department Heatmap */}
        <Panel className="col-span-2 p-5">
          <SectionHeader icon={BarChart2} title="Department Load Matrix" subtitle="Real-time capacity intelligence" live>
            <div className="flex items-center gap-2">
              {/* What-if sim toggle */}
              <button onClick={() => setShowSim(s => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${showSim ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/4 border-white/8 text-slate-500 hover:text-slate-300'}`}>
                <GitBranch size={10} /> What-If Sim
              </button>
            </div>
          </SectionHeader>
          {showSim && (
            <div className="mb-5 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain size={12} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Surge Simulation</span>
                </div>
                <span className="text-[11px] font-black text-white tabular-nums">+{simDelta} patients</span>
              </div>
              <input type="range" min={0} max={50} value={simDelta}
                onChange={e => setSimDelta(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-600">Normal</span>
                <span className="text-[9px] text-red-400">+50 patients surge</span>
              </div>
              {simDelta > 20 && (
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20 px-3 py-2 rounded-lg">
                  <AlertTriangle size={11} />
                  Surge protocol recommended — ICU breach predicted in 2h
                </div>
              )}
            </div>
          )}
          <div className="space-y-3">
            {twin.departments.map((d, i) => {
              const rawPct = (d.current / d.capacity) * 100;
              const pct = Math.min(99, rawPct + (simDelta * (i % 2 === 0 ? 0.8 : 0.5)));
              const color = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#22c55e';
              return (
                <div key={d.name} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-white w-28">{d.name}</span>
                      <span className="text-[9px] text-slate-600 font-mono">{d.current}/{d.capacity}</span>
                      {d.waitTime > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
                          <Clock size={8} className="text-slate-500" />
                          <span className="text-[8px] text-slate-500 font-bold">{d.waitTime}m</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pct > 90 && <LiveDot color="#ef4444" />}
                      <span className="text-[12px] font-black tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full relative"
                      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}>
                      <div className="absolute inset-0 rounded-full"
                        style={{ background: `linear-gradient(90deg, transparent, ${color}60)` }} />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        {/* AI Recommendations */}
        <Panel className="p-5 flex flex-col">
          <SectionHeader icon={Brain} title="AI Suggestions" subtitle={`${twin.aiSuggestions.length} active`} />
          <div className="flex-1 space-y-3 overflow-y-auto">
            {twin.aiSuggestions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 size={20} className="text-emerald-500/40 mb-2" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">System Nominal</p>
                <p className="text-[9px] text-slate-700 mt-1">No urgent actions required</p>
              </div>
            ) : twin.aiSuggestions.map(s => {
              const colors = { urgent: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.18)', text: '#fca5a5', badge: '#ef4444' }, high: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)', text: '#fcd34d', badge: '#f59e0b' }, medium: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.18)', text: '#93c5fd', badge: '#3b82f6' }, low: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: '#94a3b8', badge: '#64748b' } };
              const c = colors[s.priority] || colors.low;
              return (
                <div key={s.id} className="p-4 rounded-xl border" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${c.badge}20`, color: c.badge }}>{s.priority}</span>
                    <span className="text-[9px] font-bold" style={{ color: c.badge }}>{Math.round(s.confidence * 100)}%</span>
                  </div>
                  <p className="text-[11px] font-bold text-white mb-1.5 leading-tight">{s.action}</p>
                  <p className="text-[9px] text-slate-500 leading-relaxed mb-2">{s.reasoning}</p>
                  <div className="text-[9px] font-bold" style={{ color: '#4ade80' }}>↗ {s.impact}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      {/* Resources Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Staff */}
        <Panel className="p-5">
          <SectionHeader icon={Users} title="Staff Intelligence" />
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-black text-white tabular-nums">{twin.staffOnDuty}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">On Duty</p>
            </div>
            <div className="flex-1 relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <motion.div animate={{ width: `${Math.min(100, (twin.staffOnDuty / twin.staffRequired) * 100)}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: twin.staffOnDuty >= twin.staffRequired ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${twin.staffOnDuty >= twin.staffRequired ? '#22c55e' : '#ef4444'}40` }} />
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-slate-500 tabular-nums">{twin.staffRequired}</p>
              <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">Required</p>
            </div>
          </div>
          {twin.staffOnDuty < twin.staffRequired && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-[10px] font-bold text-red-400">
              <AlertTriangle size={11} /> Gap: {twin.staffRequired - twin.staffOnDuty} personnel short
            </div>
          )}
        </Panel>
        {/* Ventilators */}
        <Panel className="p-5">
          <SectionHeader icon={Activity} title="Ventilators" />
          <div className="flex items-center gap-4">
            <GaugeArc value={twin.ventilators.inUse} max={twin.ventilators.total}
              size={80} color={twin.ventilators.inUse / twin.ventilators.total > 0.8 ? '#ef4444' : '#3b82f6'} />
            <div className="flex-1 space-y-2">
              <div><p className="text-[9px] text-slate-500 uppercase font-bold">In Use</p><p className="text-xl font-black text-white">{twin.ventilators.inUse}</p></div>
              <div><p className="text-[9px] text-slate-500 uppercase font-bold">Available</p><p className="text-xl font-black text-emerald-400">{twin.ventilators.total - twin.ventilators.inUse}</p></div>
            </div>
          </div>
        </Panel>
        {/* Blood Bank */}
        <Panel className="p-5">
          <SectionHeader icon={CircleDot} title="Blood Bank" />
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(twin.bloodBanks).map(([type, units]) => {
              const low = (units as number) < 10;
              return (
                <div key={type} className="p-2.5 rounded-xl border text-center"
                  style={{ backgroundColor: low ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)', borderColor: low ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{type}</p>
                  <p className="text-lg font-black tabular-nums" style={{ color: low ? '#ef4444' : '#e2e8f0' }}>{units}<span className="text-[9px] text-slate-600">u</span></p>
                  {low && <p className="text-[8px] text-red-400 font-bold">LOW</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── SECTION 3: UNIT MANAGEMENT ──────────────────────────────────────────────

export function UnitManagementSection({ agents, agentStatuses, resources, emergencies, onApprove, onReject, onRevert, getEta, setToast }: {
  agents: AgentDecision[];
  agentStatuses: Record<string, string>;
  resources: ResourceRecord[];
  emergencies: EmergencyRecord[];
  onApprove: (id: string, decision: string, type: string) => void;
  onReject: (id: string, type: string) => void;
  onRevert: (id: string) => void;
  getEta: (em: EmergencyRecord) => string | null;
  setToast: (msg: string) => void;
}) {
  const available = resources.filter(r => r.status === 'Available').length;
  const onMission = resources.filter(r => r.status === 'On Mission').length;
  const enRoute   = resources.filter(r => r.status === 'En Route').length;
  const patrol    = resources.filter(r => r.status === 'Patrol').length;

  const agentIcons: Record<string, string> = {
    BedAllocation: '🛏️', StaffScheduling: '👥',
    EmergencyRouting: '🚑', ResourceOptimizer: '⚡',
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #070b12 100%)' }}>
      {/* Fleet Status Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Available', count: available, color: '#22c55e' },
          { label: 'On Mission', count: onMission, color: '#ef4444' },
          { label: 'En Route',  count: enRoute,   color: '#3b82f6' },
          { label: 'Patrol',    count: patrol,    color: '#64748b' },
        ].map(({ label, count, color }) => (
          <Panel key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <LiveDot color={color} pulse={label === 'On Mission' && count > 0} />
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-4xl font-black tabular-nums" style={{ color }}>{count}</p>
          </Panel>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        {/* Agent Decisions Panel */}
        <Panel className="col-span-7 flex flex-col overflow-hidden">
          <div className="p-5 shrink-0">
            <SectionHeader icon={Cpu} title="AI Agent Command Queue" subtitle="Autonomous decision pipeline" live>
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg border border-blue-500/25 bg-blue-500/8 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  {agents.filter(a => (agentStatuses[a.agentId] ?? a.status) === 'pending').length} pending
                </div>
              </div>
            </SectionHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
            {agents.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-3 text-slate-700" />
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Queue Empty</p>
                <p className="text-[10px] text-slate-700 mt-1">All agents nominal — no decisions pending</p>
              </div>
            ) : agents.map((a, idx) => {
              const status = agentStatuses[a.agentId] ?? a.status;
              const isPending   = status === 'pending';
              const isExecuting = status === 'executing';
              const isCompleted = status === 'completed';
              const isRejected  = status === 'rejected';
              return (
                <motion.div key={a.agentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-xl border p-5 transition-all ${isCompleted ? 'border-emerald-500/20 bg-emerald-500/4' : isRejected ? 'border-white/5 bg-white/1 opacity-50' : isExecuting ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/8 bg-white/3'}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agentIcons[a.agentType] || '🤖'}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isCompleted ? 'rgba(34,197,94,0.15)' : isRejected ? 'rgba(255,255,255,0.05)' : isExecuting ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                              color: isCompleted ? '#4ade80' : isRejected ? '#64748b' : isExecuting ? '#60a5fa' : '#fcd34d',
                            }}>
                            {isExecuting ? '⚙ Executing' : status}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{a.agentType}</span>
                        </div>
                      </div>
                    </div>
                    {/* Confidence arc */}
                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <p className="text-[8px] text-slate-600 uppercase font-bold">confidence</p>
                        <p className="text-[13px] font-black" style={{ color: a.confidence > 0.85 ? '#22c55e' : '#f59e0b' }}>{Math.round(a.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>
                  {/* Decision */}
                  <p className={`text-[12px] font-bold mb-1.5 leading-tight ${isRejected ? 'line-through text-slate-600' : 'text-white'}`}>
                    {a.decision}
                  </p>
                  <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{a.reasoning}</p>
                  {/* Impact */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 text-[9px] font-bold text-emerald-400 mb-4">
                    <ArrowUpRight size={10} /> {a.impact}
                  </div>
                  {/* Action buttons */}
                  {isPending && (
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => onApprove(a.agentId, a.decision, a.agentType)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wide text-white border border-blue-500/30 bg-blue-500/15 hover:bg-blue-500/25 hover:border-blue-500/50 transition-all"
                        style={{ boxShadow: '0 0 0 0 rgba(59,130,246,0)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(59,130,246,0.2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 rgba(59,130,246,0)'; }}>
                        <Zap size={13} /> Approve & Execute
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => onReject(a.agentId, a.agentType)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wide text-slate-500 border border-white/8 bg-white/3 hover:bg-red-500/8 hover:border-red-500/20 hover:text-red-400 transition-all">
                        <X size={13} /> Reject
                      </motion.button>
                    </div>
                  )}
                  {isExecuting && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                      </div>
                      <span className="text-[10px] font-bold text-blue-400">Agent executing decision...</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">Executed successfully</span>
                      <button onClick={() => onRevert(a.agentId)}
                        className="ml-auto text-[9px] text-slate-500 hover:text-slate-300 font-bold underline underline-offset-2 transition-colors">
                        Revert
                      </button>
                    </div>
                  )}
                  {isRejected && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 bg-white/2">
                      <X size={14} className="text-slate-600" />
                      <span className="text-[10px] font-medium text-slate-600">Decision rejected</span>
                      <button onClick={() => onRevert(a.agentId)}
                        className="ml-auto text-[9px] text-blue-500 hover:text-blue-300 font-bold underline underline-offset-2 transition-colors">
                        Reconsider
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Panel>
        {/* Field Roster */}
        <Panel className="col-span-5 flex flex-col overflow-hidden">
          <div className="p-5 shrink-0">
            <SectionHeader icon={Radio} title="Field Unit Roster" subtitle="Live GPS telemetry" live />
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
            {resources.map((r, i) => {
              const statusColor = r.status === 'Available' ? '#22c55e' : r.status === 'On Mission' ? '#ef4444' : r.status === 'En Route' ? '#3b82f6' : '#64748b';
              const assignedTo = emergencies.find(e => e.assignedResource === r.id);
              return (
                <motion.div key={r.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${statusColor}12`, border: `1px solid ${statusColor}25` }}>
                    {r.type === 'Police'
                      ? <ShieldAlert size={16} style={{ color: statusColor }} />
                      : <Ambulance size={16} style={{ color: statusColor }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-black text-white">{r.id}</span>
                      <LiveDot color={statusColor} pulse={r.status === 'On Mission'} />
                      <span className="text-[9px] font-bold uppercase" style={{ color: statusColor }}>{r.status}</span>
                    </div>
                    {assignedTo
                      ? <p className="text-[9px] text-slate-500 truncate">→ {assignedTo.id} — {assignedTo.subtype}</p>
                      : <p className="text-[9px] font-mono text-slate-700">{(r.location[0] as number).toFixed(4)}, {(r.location[1] as number).toFixed(4)}</p>}
                  </div>
                  {assignedTo && (
                    <div className="text-right shrink-0">
                      <p className="text-[8px] text-slate-600 uppercase font-bold">ETA</p>
                      <p className="text-[12px] font-black text-blue-400">{getEta(assignedTo)}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── SECTION 4: RESPONSE ANALYTICS ───────────────────────────────────────────

export function ResponseAnalyticsSection({ analyticsHistory, anomalies, emergencies, patients, twin }: {
  analyticsHistory: AnalyticsSnapshot[];
  anomalies: AnomalyEvent[];
  emergencies: EmergencyRecord[];
  patients: PatientRiskProfile[];
  twin: HospitalTwin | null;
}) {
  const latest = analyticsHistory[analyticsHistory.length - 1];
  const prev   = analyticsHistory[analyticsHistory.length - 2];

  const byType = useMemo(() => emergencies.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1; return acc;
  }, {} as Record<string, number>), [emergencies]);

  const loadHistory    = analyticsHistory.map(s => Math.round(s.systemLoad * 100));
  const critHistory    = analyticsHistory.map(s => s.criticalCount);
  const mortalityHist  = analyticsHistory.map(s => Math.round(s.mortalityRisk * 100));
  const anomalyHist    = analyticsHistory.map(s => Math.round(s.anomalyScore * 100));

  const deltaLoad     = latest && prev ? Math.round(latest.systemLoad * 100) - Math.round(prev.systemLoad * 100) : 0;
  const deltaCrit     = latest && prev ? latest.criticalCount - prev.criticalCount : 0;

  const typeColors = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #070b12 100%)' }}>
      {/* Live KPI Tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'System Load',    value: latest ? `${Math.round(latest.systemLoad * 100)}%`     : '—', delta: deltaLoad,  spark: loadHistory,    color: '#3b82f6' },
          { label: 'Mortality Risk', value: latest ? `${Math.round(latest.mortalityRisk * 100)}%`  : '—', delta: undefined,   spark: mortalityHist,  color: '#ef4444' },
          { label: 'Critical Count', value: latest ? String(latest.criticalCount)                   : '—', delta: deltaCrit,   spark: critHistory,    color: '#f59e0b' },
          { label: 'Anomaly Index',  value: latest ? `${Math.round(latest.anomalyScore * 100)}%`   : '—', delta: undefined,   spark: anomalyHist,    color: '#8b5cf6' },
        ].map(({ label, value, delta, spark, color }) => (
          <Panel key={label} className="p-5" glow={false}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
                  {delta !== undefined && delta !== 0 && (
                    <span className={`text-[10px] font-black flex items-center ${delta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {delta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {Math.abs(delta)}
                    </span>
                  )}
                </div>
              </div>
              <Sparkline data={spark.slice(-20)} color={color} width={60} height={30} />
            </div>
            {/* Mini live bar */}
            <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <motion.div animate={{ width: value === '—' ? '0%' : value }} className="h-full rounded-full"
                style={{ width: `${parseFloat(value) || 0}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
            </div>
          </Panel>
        ))}
      </div>
      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Bottleneck Intelligence */}
        <Panel className="p-5">
          <SectionHeader icon={AlertTriangle} title="Bottleneck Radar" subtitle="Root cause analysis" live />
          {!latest || latest.bottlenecks.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <div>
                <p className="text-[11px] font-bold text-emerald-400">All systems clear</p>
                <p className="text-[9px] text-slate-600">No bottlenecks detected</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {latest.bottlenecks.map((b, i) => (
                <motion.div key={b} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/15 bg-amber-500/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-300">{b}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Detected at {new Date().toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {/* AI Forecast */}
          {latest && (
            <div className="mt-5 pt-4 border-t border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Incident Forecast</p>
              {[
                { label: 'Next 1h',  value: latest.predictions.next1h },
                { label: 'Next 6h',  value: latest.predictions.next6h },
                { label: 'Next 24h', value: latest.predictions.next24h },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/4">
                  <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-black text-white tabular-nums">{value}</span>
                    <span className="text-[8px] text-slate-600">critical</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        {/* Incident Distribution */}
        <Panel className="p-5">
          <SectionHeader icon={BarChart2} title="Incident Intelligence" subtitle="Type distribution analysis" />
          <div className="space-y-3">
            {Object.entries(byType).map(([type, count], i) => {
              const total = Object.values(byType).reduce((a, b) => a + b, 0);
              const pct = total ? Math.round((count / total) * 100) : 0;
              const color = typeColors[i % typeColors.length];
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-[11px] font-bold text-slate-300">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-white tabular-nums">{count}</span>
                      <span className="text-[9px] text-slate-600 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Response time */}
          {latest && (
            <div className="mt-5 pt-4 border-t border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Response Metrics</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/5 bg-white/2 text-center">
                  <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">Avg Response</p>
                  <p className="text-lg font-black text-white tabular-nums">{Math.round(latest.avgResponseTime)}m</p>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/2 text-center">
                  <p className="text-[9px] text-slate-600 uppercase font-bold mb-1">Resolution Rate</p>
                  <p className="text-lg font-black text-emerald-400 tabular-nums">
                    {emergencies.length ? Math.round((emergencies.filter(e => e.status === 'Resolved').length / emergencies.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </Panel>
        {/* Anomaly Detection Feed */}
        <Panel className="p-5 flex flex-col overflow-hidden">
          <SectionHeader icon={CircleDot} title="Anomaly Feed" subtitle={`${anomalies.length} events detected`} live>
            <div className="px-2 py-1 rounded-full border border-purple-500/25 bg-purple-500/8 text-[8px] font-black text-purple-400 uppercase tracking-widest">
              {anomalies.length}
            </div>
          </SectionHeader>
          <div className="flex-1 overflow-y-auto space-y-2">
            {anomalies.length === 0 ? (
              <div className="py-8 text-center">
                <Shield size={20} className="mx-auto mb-2 text-slate-700" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No Anomalies</p>
              </div>
            ) : anomalies.slice().reverse().map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3.5 rounded-xl border transition-all"
                style={{
                  borderColor: a.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                  backgroundColor: a.severity === 'critical' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.04)',
                }}>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: a.severity === 'critical' ? '#ef4444' : '#f59e0b' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase"
                        style={{ backgroundColor: a.severity === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: a.severity === 'critical' ? '#fca5a5' : '#fcd34d' }}>
                        {a.type.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono ml-auto">{new Date(a.detectedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-300 leading-tight">{a.description}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">{a.affectedArea} · {Math.round(a.confidence * 100)}% conf.</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>
      {/* Timeline */}
      <Panel className="p-5">
        <SectionHeader icon={Clock} title="Incident Timeline" subtitle="Last 6 events" />
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-white/5" />
          <div className="space-y-3 pl-8">
            {emergencies.slice(0, 6).map((e, i) => {
              const color = e.priority === 'Critical' ? '#ef4444' : e.priority === 'Moderate' ? '#f59e0b' : '#3b82f6';
              return (
                <motion.div key={e.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }} className="flex items-center gap-4 relative">
                  <div className="absolute -left-8 w-3 h-3 rounded-full border-2 border-slate-900"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
                  <div className="flex-1 flex items-center gap-4 py-2.5 px-4 rounded-xl border border-white/5 bg-white/2">
                    <span className="text-[9px] font-mono text-slate-600 w-16 shrink-0">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[10px] font-black text-white truncate flex-1">{e.id} — {e.subtype}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}>
                      {e.priority}
                    </span>
                    <span className="text-[9px] font-bold shrink-0" style={{ color: e.assignedResource ? '#4ade80' : '#64748b' }}>
                      {e.assignedResource || 'Unassigned'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Panel>
    </div>
  );
}
