import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Mic, Shield, MessageSquare, Send, Bell, MapPin, Loader2, Hospital, Radio, Navigation, Activity } from 'lucide-react';
import { analyzeEmergency } from '../lib/gemini';
import GlobalMap from './Map';
import { io, Socket } from 'socket.io-client';
import { ResourceRecord } from '../types';

export default function CitizenPortal({ onBack }: { onBack: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [pushedSos, setPushedSos] = useState(false);
  const [emergencyText, setEmergencyText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState<any>(null);
  const [sosPhase, setSosPhase] = useState<'idle' | 'reporting' | 'dispatched' | 'confirmed' | 'whatsapp'>('idle');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('resources:update', (updated: ResourceRecord[]) => {
      setResources(updated);
    });

    newSocket.on('hospitals:update', (updatedHospitals) => {
      setHospitals(updatedHospitals);
    });

    fetch('/api/hospitals').then(res => res.json()).then(setHospitals);

    return () => {
      newSocket.close();
    };
  }, []);

  const assignedResource = resources.find(r => r.id === currentEmergency?.assignedResource);

  const citizenMapCenter: [number, number] = assignedResource 
    ? assignedResource.location 
    : [12.9716, 77.5946];

  const getEta = () => {
    if (!assignedResource || !currentEmergency) return 'Calculating...';
    const [rLat, rLng] = assignedResource.location;
    const [eLat, eLng] = currentEmergency.location;
    const dist = Math.sqrt(Math.pow(rLat - eLat, 2) + Math.pow(rLng - eLng, 2));
    // Rough estimation: 1 degree approx 111km. 0.0005 per 2s is about 0.015 deg/min?
    // Let's just do something simple for display
    const mins = Math.max(1, Math.round(dist * 2000)); 
    return `${mins} - ${mins + 2} Min`;
  };

  const sendWhatsAppMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setAnalyzing(true);

    try {
      const analysis = await analyzeEmergency(userMsg);
      
      const payload = {
        type: analysis.emergency_type || 'Unknown',
        subtype: analysis.analysis?.split(' ').slice(0, 3).join(' ') || 'WhatsApp Report',
        priority: analysis.urgency_score > 0.8 ? 'Critical' : 'Moderate',
        location: [12.9716, 77.5946],
        citizen: 'WhatsApp User',
        symptoms: analysis.symptoms || [],
        nlpAnalysis: analysis.analysis || '',
        urgencyScore: analysis.urgency_score || 0.5
      };

      await fetch('/api/emergency/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setChatMessages(prev => [...prev, { 
        role: 'bot', 
        text: `REPORT VERIFIED. System has detected: ${analysis.emergency_type}. Assistance is being dispatched to your GPS location.` 
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Error processing request. Please use direct SOS." }]);
    } finally {
      setAnalyzing(false);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your emergency.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Default to Hindi, but browser/Gemini handles multi-lingual well

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const lastResult = event.results[event.results.length - 1][0];
      if (lastResult.confidence) {
        setConfidenceScore(lastResult.confidence);
      }

      setEmergencyText(prev => {
        const currentBatch = lastResult.transcript;
        return currentBatch;
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const handleSos = async () => {
    setSosPhase('reporting');
    setPushedSos(true);
  };

  const submitEmergency = async () => {
    if (!emergencyText && !isRecording) return;
    setAnalyzing(true);
    
    try {
      const analysis = await analyzeEmergency(emergencyText || "Simulated voice input: Car crash on MG Road, urgent medical help needed.");
      
      const payload = {
        type: analysis.emergency_type || 'Unknown',
        subtype: analysis.analysis?.split(' ').slice(0, 3).join(' ') || 'General Emergency',
        priority: analysis.urgency_score > 0.8 ? 'Critical' : 'Moderate',
        location: [12.9716, 77.5946], // Mock current location
        citizen: 'Authorized Citizen',
        symptoms: analysis.symptoms || [],
        nlpAnalysis: analysis.analysis || '',
        urgencyScore: analysis.urgency_score || 0.5
      };

      const res = await fetch('/api/emergency/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setCurrentEmergency(data);
      setSosPhase('dispatched');
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 mr-2"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black italic">
            A
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight leading-none text-sm uppercase">ANEIS</h1>
            <p className="text-[10px] text-blue-600 font-bold tracking-wider uppercase">Emergency Support</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Live Signal Active</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-6 space-y-8">
        <AnimatePresence mode="wait">
          {sosPhase === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-10 py-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-900">National Emergency Portal</h2>
                <p className="text-slate-500 text-sm font-medium">Verified distress signal for India</p>
              </div>

              <div className="w-full bg-white rounded-3xl border border-slate-200 p-10 flex flex-col items-center gap-8 shadow-sm">
                <p className="text-slate-400 text-center font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Press & Hold to Request Intervention</p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSos}
                  className="w-48 h-48 bg-white border-4 border-red-500 rounded-full flex flex-col items-center justify-center text-red-600 shadow-xl shadow-red-100 flex-shrink-0 relative overflow-hidden group"
                >
                  <Shield size={48} className="mb-2" />
                  <span className="font-black text-2xl tracking-tighter uppercase">Request Help</span>
                  <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <div className="w-full h-px bg-slate-100" />

                <div className="grid grid-cols-3 gap-3 w-full">
                  <QuickActionButton icon={Phone} label="112 Call" href="tel:112" />
                  <QuickActionButton icon={Mic} label="Voice" onClick={() => setSosPhase('reporting')} />
                  <QuickActionButton icon={MessageSquare} label="WhatsApp" onClick={() => setSosPhase('whatsapp')} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
                </div>
              </div>
            </motion.div>
          )}

          {sosPhase === 'whatsapp' && (
            <motion.div 
              key="whatsapp"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[600px] flex flex-col bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSosPhase('idle')} className="p-1 hover:bg-white/10 rounded-lg">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">W</div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm">Emergency Bot</h3>
                    <p className="text-[10px] text-emerald-100 uppercase font-bold">Verifying Service</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 backdrop-blur-sm custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                      <MessageSquare size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">WhatsApp Intervention</h4>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">Send a text description or audio note (using keyboard mic) to report an incident.</p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-medium shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {analyzing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendWhatsAppMessage()}
                  placeholder="Report emergency here..."
                  className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button 
                  onClick={sendWhatsAppMessage}
                  disabled={analyzing || !chatInput.trim()}
                  className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {sosPhase === 'reporting' && (
            <motion.div 
              key="reporting"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setSosPhase('idle')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                  <ArrowLeft size={16} />
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligence Input</span>
              </div>
              <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm overflow-hidden relative">
                <AnimatePresence>
                  {isRecording && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 40 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-1 overflow-hidden"
                    >
                      {[...Array(24)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: [8, 32 * Math.random() + 8, 8],
                            backgroundColor: ['#60a5fa', '#3b82f6', '#60a5fa'] 
                          }}
                          transition={{ 
                            duration: 0.4 + Math.random() * 0.2, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            delay: i * 0.02 
                          }}
                          className="w-1 rounded-full bg-blue-400"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-blue-600">
                    <motion.div 
                      animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`p-2 rounded-full ${isRecording ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
                    >
                      <Mic size={24} />
                    </motion.div>
                    <h3 className="font-bold">{isRecording ? "Listening Multilingual..." : "Describe Situation"}</h3>
                  </div>
                  {confidenceScore !== null && emergencyText && (
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">AI Confidence: {(confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
                
                <textarea 
                  value={emergencyText}
                  onChange={(e) => setEmergencyText(e.target.value)}
                  placeholder="Tell us what is happening (Supports Hindi, Kannada, Tamil, English)..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 min-h-[160px] focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder:text-slate-300 font-medium text-sm transition-all shadow-inner"
                />

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={toggleRecording}
                    className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all ${isRecording ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    {isRecording ? "Finish Recording" : <><Mic size={18} /> Tap to Speak (हिन्दी/தமிழ்/ಕನ್ನಡ)</>}
                  </button>
                  <button 
                    onClick={submitEmergency}
                    disabled={analyzing || isRecording}
                    className="bg-blue-600 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {analyzing ? <Loader2 className="animate-spin" size={18} /> : "Validate & Submit Intelligence"}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSosPhase('idle')} 
                className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center hover:text-slate-600"
              >
                Return to Home
              </button>
            </motion.div>
          )}

          {sosPhase === 'dispatched' && (
            <motion.div 
              key="dispatched"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setSosPhase('idle')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                  <ArrowLeft size={16} />
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Dispatch View</span>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Request Verified & Unit Dispatched
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Support is on the way</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Assigned Unit</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Navigation size={14} className="rotate-45" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{currentEmergency?.assignedResource || 'DISPATCH-1'}</span>
                    </div>
                  </div>
                  <motion.div 
                    initial={false}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-blue-600 p-3 rounded-2xl border border-blue-500 shadow-lg shadow-blue-100"
                  >
                    <p className="text-[10px] text-blue-100 font-bold uppercase mb-1">Estimated Arrival</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 bg-white/20 text-white rounded-lg">
                        <Activity size={14} />
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">{getEta()}</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="h-64 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
                <GlobalMap 
                  center={citizenMapCenter} 
                  emergencies={currentEmergency ? [currentEmergency] : []}
                  resources={resources}
                  hospitals={hospitals}
                  interactive={false}
                />
                {assignedResource && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur pb-1 pt-1.5 px-3 rounded-full border border-blue-200 shadow-lg z-[1000] flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-blue-700 tracking-tight">Tracking Unit {assignedResource.id}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[10px] text-blue-600 uppercase tracking-widest">Medical Directive</h4>
                  <Hospital size={16} className="text-blue-500" />
                </div>
                <p className="text-slate-700 font-medium text-xs leading-relaxed italic">
                  "Our system has notified the Trauma team at the nearest facility. Stay calm and clear the road. First responders are navigating via Green Corridor."
                </p>
              </div>

              <button 
                onClick={() => setSosPhase('idle')}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm"
              >
                I am Safe / Resolve Signal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em]">
        ANEIS Infrastructure v2.4.0 • MEITY GOVT OF INDIA
      </footer>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, href, color }: { icon: any, label: string, onClick?: (e: React.MouseEvent) => void, href?: string, color?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    if (href?.startsWith('tel:')) {
      e.preventDefault();
      // Try multiple ways to trigger the call for best compatibility
      window.location.href = href;
      // Fallback/Reinforcement
      const a = document.createElement('a');
      a.href = href;
      a.target = '_top';
      a.click();
    }
    if (onClick) onClick(e);
  };

  return (
    <button 
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 ${color || 'bg-slate-50 border-slate-100 text-slate-600'} border rounded-2xl hover:brightness-95 active:scale-95 transition-all font-bold text-[10px] shadow-sm w-full`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
