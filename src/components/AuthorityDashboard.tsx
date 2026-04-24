import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Activity, Map as MapIcon, Users, Settings, 
  Search, Bell, Filter, MoreVertical, Ambulance, Hospital, 
  TrendingUp, Clock, AlertTriangle, CheckCircle2, Zap, LogOut,
  MapPin
} from 'lucide-react';
import GlobalMap from './Map';
import { EmergencyRecord, HospitalRecord, ResourceRecord } from '../types';
import { io, Socket } from 'socket.io-client';

export default function AuthorityDashboard({ onBack }: { onBack: () => void }) {
  const [emergencies, setEmergencies] = useState<EmergencyRecord[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeEmergencyIdx, setActiveEmergencyIdx] = useState<number | null>(null);
  const [resourceFilter, setResourceFilter] = useState<'All' | 'Ambulance' | 'Police'>('All');
  const [emergencySearch, setEmergencySearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    const fetchData = async () => {
      const [eRes, hRes, rRes] = await Promise.all([
        fetch('/api/emergencies'),
        fetch('/api/hospitals'),
        fetch('/api/resources')
      ]);
      setEmergencies(await eRes.json());
      setHospitals(await hRes.json());
      setResources(await rRes.json());
    };

    fetchData();

    newSocket.on('emergency:new', (emergency) => {
      setEmergencies(prev => [emergency, ...prev]);
    });

    newSocket.on('emergency:update', (updated) => {
      setEmergencies(prev => prev.map(e => e.id === updated.id ? updated : e));
    });

    newSocket.on('resources:update', (updatedResources) => {
      setResources(updatedResources);
    });

    newSocket.on('hospitals:update', (updatedHospitals) => {
      setHospitals(updatedHospitals);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const triggerGreenCorridor = async (emergencyId: string) => {
    const emergency = emergencies.find(e => e.id === emergencyId);
    if (!emergency) return;

    await fetch('/api/traffic/green-corridor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ambulanceId: emergency.assignedResource,
        route: 'Route A: MG Road to Fortis'
      })
    });
    alert(`Green Corridor Activated for ${emergency.assignedResource}`);
  };

  const activeEmergency = activeEmergencyIdx !== null ? emergencies[activeEmergencyIdx] : null;
  const assignedResource = activeEmergency?.assignedResource 
    ? resources.find(r => r.id === activeEmergency.assignedResource) 
    : null;

  const mapCenter: [number, number] = assignedResource 
    ? assignedResource.location 
    : (activeEmergency?.location || [12.9716, 77.5946]);

  const getEta = (emergency: EmergencyRecord) => {
    if (!emergency.assignedResource) return null;
    const resource = resources.find(r => r.id === emergency.assignedResource);
    if (!resource) return 'Calculating...';
    
    const [rLat, rLng] = resource.location;
    const [eLat, eLng] = emergency.location;
    const dist = Math.sqrt(Math.pow(rLat - eLat, 2) + Math.pow(rLng - eLng, 2));
    const mins = Math.max(1, Math.round(dist * 2000)); 
    return `${mins} - ${mins + 2} min`;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-700 overflow-hidden font-sans">
      {/* Sidebar - Professional Gray/Blue */}
      <nav className="w-64 bg-white border-r border-slate-200 flex flex-col py-6 shadow-sm">
        <div className="px-6 mb-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="font-bold text-slate-900 tracking-tight">ANEIS HUB</span>
        </div>
        
        <div className="flex-1 px-3 space-y-1">
          <SideNavItem icon={MapIcon} label="Incident Map" active />
          <SideNavItem icon={Activity} label="Critical Monitor" />
          <SideNavItem icon={Hospital} label="Facility Telemetry" />
          <SideNavItem icon={Users} label="Unit Management" />
          <SideNavItem icon={TrendingUp} label="Response Analytics" />
        </div>

        <div className="px-3 pt-6 border-t border-slate-100">
          <SideNavItem icon={Settings} label="System Settings" />
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm mt-1"
          >
            <LogOut size={18} />
            Exit Command
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header - Clean White */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-slate-800">Dispatch Command</h2>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase">Active</span>
                <span className="text-xs font-bold text-red-600">{emergencies.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase">Available</span>
                <span className="text-xs font-bold text-emerald-600">{resources.filter(r => r.status === 'Available').length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase">Uptime</span>
                <span className="text-xs font-bold text-slate-600">99.98%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">Duty Officer: D. Patil</p>
                <p className="text-[10px] text-slate-500 font-medium">BENGALURU CENTRAL</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
                DP
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-50 p-4 gap-4">
          {/* Left Panel: Feed */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <div className="bg-white rounded-lg border border-slate-200 flex-1 flex flex-col shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Incident Feed</h3>
                  <Filter size={14} className="text-slate-400 cursor-pointer" />
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ID, type or location..." 
                    value={emergencySearch}
                    onChange={(e) => setEmergencySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 text-xs rounded-md focus:ring-1 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {emergencies
                  .filter(e => 
                    e.id.toLowerCase().includes(emergencySearch.toLowerCase()) ||
                    e.type.toLowerCase().includes(emergencySearch.toLowerCase()) ||
                    (e.subtype && e.subtype.toLowerCase().includes(emergencySearch.toLowerCase())) ||
                    (e.locationName && e.locationName.toLowerCase().includes(emergencySearch.toLowerCase()))
                  ).length > 0 ? (
                  emergencies
                    .filter(e => 
                      e.id.toLowerCase().includes(emergencySearch.toLowerCase()) ||
                      e.type.toLowerCase().includes(emergencySearch.toLowerCase()) ||
                      (e.subtype && e.subtype.toLowerCase().includes(emergencySearch.toLowerCase())) ||
                      (e.locationName && e.locationName.toLowerCase().includes(emergencySearch.toLowerCase()))
                    )
                    .map((e) => (
                      <div key={e.id}>
                        <EmergencyCard 
                          data={e} 
                          active={activeEmergency?.id === e.id}
                          onClick={() => {
                            const foundIdx = emergencies.findIndex(em => em.id === e.id);
                            setActiveEmergencyIdx(foundIdx);
                          }} 
                        />
                      </div>
                    ))
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Search size={24} className="mx-auto opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No Incidents Found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Map */}
          <div className="col-span-6 flex flex-col gap-4 relative">
            <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
              <GlobalMap 
                center={mapCenter} 
                emergencies={emergencies} 
                hospitals={hospitals} 
                resources={resources} 
                onMarkerClick={(type, id) => {
                  if (type === 'emergency') {
                    const idx = emergencies.findIndex(e => e.id === id);
                    if (idx !== -1) setActiveEmergencyIdx(idx);
                  } else if (type === 'hospital') {
                    setHospitalSearch(id);
                  }
                }}
              />
              {assignedResource && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur pb-1.5 pt-2 px-4 rounded-full border border-blue-200 shadow-xl z-[1000] flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    <span className="text-xs font-black uppercase text-slate-800 tracking-tight">Live Tracking: {assignedResource.id}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-xs font-black text-blue-600 tabular-nums">ETA: {getEta(activeEmergency!)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Hospital & Context */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <AnimatePresence mode="wait">
              {activeEmergency && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-lg border border-blue-200 shadow-lg p-5 border-l-4 border-l-blue-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Active Incident</span>
                    <button onClick={() => setActiveEmergencyIdx(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                  </div>
                  <h4 className="text-slate-900 font-bold mb-1">{activeEmergency.id} - {activeEmergency.subtype}</h4>
                  <div className="flex gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Citizen</span>
                      <span className="text-xs font-semibold">{activeEmergency.citizen}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Time</span>
                      <span className="text-xs font-semibold">{new Date(activeEmergency.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {activeEmergency.casualties !== undefined && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-red-400 font-bold uppercase">Casualties</span>
                        <span className="text-xs font-bold text-red-600">{activeEmergency.casualties}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{activeEmergency.nlpAnalysis}</p>

                  {/* Incident Timeline */}
                  <div className="mb-6">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Mission Log</h5>
                    <div className="space-y-3">
                      {activeEmergency.timeline?.map((evt, tidx) => (
                        <div key={tidx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${tidx === (activeEmergency.timeline?.length || 0) - 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {tidx < (activeEmergency.timeline?.length || 0) - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-900">{evt.event}</p>
                            <p className="text-[8px] text-slate-400 uppercase">{new Date(evt.time).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeEmergency.assignedResource && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Ambulance size={16} className="text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-800 tracking-tight">LIVE TRACKING</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          <span className="text-[10px] font-bold text-emerald-600">EN ROUTE</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-emerald-600/70 font-bold uppercase">Unit Identity</p>
                          <p className="text-sm font-black text-emerald-900">{activeEmergency.assignedResource}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-emerald-600/70 font-bold uppercase">Arrival ETA</p>
                          <p className="text-lg font-black text-emerald-600 tabular-nums">{getEta(activeEmergency)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Resource</h5>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Unit ID..." 
                            value={resourceSearch}
                            onChange={(e) => setResourceSearch(e.target.value)}
                            className="pl-6 pr-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                          />
                        </div>
                        <select 
                          value={resourceFilter}
                          onChange={(e) => setResourceFilter(e.target.value as any)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="All">All</option>
                          <option value="Ambulance">Ambulances</option>
                          <option value="Police">Police</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {resources
                        .filter(r => resourceFilter === 'All' || r.type === resourceFilter)
                        .filter(r => r.id.toLowerCase().includes(resourceSearch.toLowerCase()))
                        .map(r => (
                          <button
                            key={r.id}
                            disabled={r.status !== 'Available'}
                            onClick={async () => {
                              const res = await fetch(`/api/emergency/${activeEmergency.id}/assign`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resourceId: r.id })
                              });
                              if (res.ok) {
                                setToast(`${r.id} (${r.type}) Dispatched to ${activeEmergency.id}`);
                                setResourceSearch('');
                              }
                            }}
                            className={`flex flex-col items-center justify-center p-2 border rounded transition-all text-center shadow-sm ${
                              r.status === 'Available' 
                                ? 'bg-white hover:bg-blue-600 hover:text-white border-slate-200 cursor-pointer' 
                                : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                                {r.type === 'Police' ? <ShieldAlert size={12} /> : <Ambulance size={12} />}
                                <span className="text-[10px] font-black">{r.id}</span>
                            </div>
                            <div className={`text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full ${
                                r.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                                r.status === 'En Route' ? 'bg-blue-100 text-blue-700' :
                                r.status === 'On Mission' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                                {r.status}
                            </div>
                            {r.status === 'Available' && <span className="mt-1 text-[7px] font-black uppercase opacity-60">Dispatch</span>}
                          </button>
                        ))}
                      {resources
                        .filter(r => resourceFilter === 'All' || r.type === resourceFilter)
                        .filter(r => r.id.toLowerCase().includes(resourceSearch.toLowerCase())).length === 0 && (
                        <p className="text-[10px] text-orange-600 font-medium italic w-full py-4 bg-orange-50 rounded text-center border border-orange-100 col-span-2">No available units match search</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => triggerGreenCorridor(activeEmergency.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase py-2.5 rounded shadow-sm flex items-center justify-center gap-2"
                    >
                      <Zap size={14} /> Clear Route
                    </button>
                    <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase py-2.5 rounded hover:bg-slate-50 shadow-sm">
                      Reallocate
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-lg border border-slate-200 flex-1 flex flex-col shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Facility Status</h3>
                  <Hospital size={14} className="text-blue-500" />
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search name, type or specialization..." 
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 text-xs rounded-md focus:ring-1 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {hospitals
                  .filter(h => 
                    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
                    h.type.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
                    h.specialization.some(s => s.toLowerCase().includes(hospitalSearch.toLowerCase()))
                  )
                  .map(h => (
                    <div key={h.id}>
                      <HospitalCard data={h} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-tight">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideNavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer font-semibold text-sm transition-all ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
}

function EmergencyCard({ data, active, onClick }: { data: EmergencyRecord, active: boolean, onClick: () => void }) {
  const priorityColors = {
    Critical: 'bg-red-50 text-red-700 border-red-100',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-100',
    Low: 'bg-blue-50 text-blue-700 border-blue-100'
  };
  
  const priorityDots = {
    Critical: 'bg-red-500',
    Moderate: 'bg-amber-500',
    Low: 'bg-blue-500'
  };

  const urgencyColor = priorityColors[data.priority] || 'bg-slate-50 text-slate-700 border-slate-100';
  const dotColor = priorityDots[data.priority] || 'bg-slate-400';
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer group ${active ? 'bg-white border-blue-500 shadow-lg ring-1 ring-blue-500 z-10 scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor} ${data.priority === 'Critical' ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`} />
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tight ${urgencyColor}`}>
            {data.priority}
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 tracking-tighter tabular-nums bg-slate-50 px-1.5 py-0.5 rounded">
          {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <h4 className="font-black text-slate-900 text-sm mb-2 leading-tight tracking-tight line-clamp-1">{data.subtype || data.type}</h4>
      
      {data.symptoms && data.symptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.symptoms.slice(0, 3).map((s, i) => (
            <span key={i} className="text-[9px] bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50 font-bold uppercase tracking-tight">
              {s}
            </span>
          ))}
          {data.symptoms.length > 3 && (
            <span className="text-[9px] text-slate-400 font-bold">+{data.symptoms.length - 3}</span>
          )}
        </div>
      )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
          <MapPin size={12} className="text-slate-300" />
          <span className="truncate max-w-[100px]">{data.locationName || 'Central District'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${data.urgencyScore > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${(data.urgencyScore || 0.5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HospitalCard({ data }: { data: HospitalRecord }) {
  const loadColor = data.load === 'High' ? 'text-red-600' : data.load === 'Medium' ? 'text-orange-600' : 'text-emerald-600';
  const icuProgress = (data.availableIcu / data.icuBeds) * 100;
  const bedProgress = (data.availableBeds / data.totalBeds) * 100;

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-slate-900 font-bold text-sm leading-tight">{data.name}</h4>
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
              {data.type}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{data.specialization.join(', ')}</p>
        </div>
        <div className="text-right">
          <span className={`text-[9px] font-black uppercase px-2 py-1 bg-slate-50 rounded-lg ${loadColor}`}>
            {data.load} LOAD
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">ICU Availability</span>
            </div>
            <span className={`text-[10px] font-black tracking-tighter ${data.availableIcu < 5 ? 'text-red-600' : 'text-slate-900'}`}>
              {data.availableIcu} / {data.icuBeds} Units
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${icuProgress}%` }}
              className={`h-full transition-all duration-500 ${icuProgress < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">General Beds</span>
            </div>
            <span className="text-[10px] font-black tracking-tighter text-slate-900">
              {data.availableBeds} / {data.totalBeds} Units
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${bedProgress}%` }}
              className={`h-full bg-blue-500 transition-all duration-500`} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}


