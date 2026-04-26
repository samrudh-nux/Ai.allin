import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Types (inline to keep server self-contained) ─────────────────────────────
interface TimelineEvent { time: string; event: string; }

interface EmergencyRecord {
  id: string; type: string; subtype: string;
  status: 'Analyzing' | 'Dispatched' | 'In Progress' | 'Resolved' | 'Critical';
  priority: 'Critical' | 'Moderate' | 'Low';
  location: [number, number]; locationName: string;
  urgencyScore: number; timestamp: string; citizen: string;
  assignedResource?: string | null; assignedHospital?: string;
  casualties?: number; symptoms: string[];
  timeline?: TimelineEvent[]; nlpAnalysis?: string;
}

interface HospitalRecord {
  id: string; name: string; type: string;
  location: [number, number];
  icuBeds: number; totalBeds: number;
  availableIcu: number; availableBeds: number;
  specialization: string[];
  load: 'High' | 'Medium' | 'Low';
}

interface ResourceRecord {
  id: string; type: string; status: string;
  location: [number, number];
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
let emergencies: EmergencyRecord[] = [
  {
    id: 'EM-1024', type: 'Medical', subtype: 'Cardiac Arrest',
    status: 'In Progress', priority: 'Critical',
    location: [12.9716, 77.5946], locationName: 'Vittal Mallya Road',
    urgencyScore: 0.95, timestamp: new Date(Date.now() - 900_000).toISOString(),
    citizen: 'Rahul S.', assignedResource: 'AMB-12',
    assignedHospital: 'St. John Medical College',
    casualties: 1, symptoms: ['Unresponsive', 'No Pulse', 'Chest Pain'],
    timeline: [
      { time: new Date(Date.now() - 900_000).toISOString(), event: 'Incident Reported' },
      { time: new Date(Date.now() - 840_000).toISOString(), event: 'AI Analysis: Cardiac Arrest detected (94% confidence)' },
      { time: new Date(Date.now() - 720_000).toISOString(), event: 'Unit AMB-12 Dispatched' },
      { time: new Date(Date.now() - 600_000).toISOString(), event: 'Green Corridor activated on MG Road' },
    ],
    nlpAnalysis: 'High-confidence cardiac event. Defibrillation may be required. Nearest cath lab: St. John (8 min ETA).',
  },
  {
    id: 'EM-1025', type: 'Accident', subtype: 'Road Traffic Accident',
    status: 'Dispatched', priority: 'Critical',
    location: [12.9279, 77.6271], locationName: 'Sarjapur Main Road',
    urgencyScore: 0.88, timestamp: new Date(Date.now() - 300_000).toISOString(),
    citizen: 'Priya K.', assignedResource: 'AMB-05',
    assignedHospital: 'Manipal Hospital',
    casualties: 2, symptoms: ['Multiple Fractures', 'Severe Bleeding', 'Head Injury'],
    timeline: [
      { time: new Date(Date.now() - 300_000).toISOString(), event: 'Incident Reported' },
      { time: new Date(Date.now() - 240_000).toISOString(), event: 'AI Triage: Polytrauma — Priority 1' },
      { time: new Date(Date.now() - 180_000).toISOString(), event: 'Unit AMB-05 Dispatched' },
    ],
    nlpAnalysis: 'Multi-vehicle collision. 2 casualties. Trauma surgery team should be on standby.',
  },
  {
    id: 'EM-1026', type: 'Medical', subtype: 'Severe Dehydration',
    status: 'Analyzing', priority: 'Moderate',
    location: [12.9620, 77.5750], locationName: 'Victoria Hospital Area',
    urgencyScore: 0.65, timestamp: new Date(Date.now() - 120_000).toISOString(),
    citizen: 'Anil M.', assignedResource: null,
    casualties: 0, symptoms: ['Dizziness', 'Weakness', 'Extreme Thirst'],
    timeline: [
      { time: new Date(Date.now() - 120_000).toISOString(), event: 'Incident Reported via Call' },
      { time: new Date(Date.now() - 60_000).toISOString(),  event: 'AI Triage: Moderate — IV fluids recommended' },
    ],
  },
  {
    id: 'EM-1027', type: 'Public Safety', subtype: 'Street Fight',
    status: 'Analyzing', priority: 'Low',
    location: [13.0033, 77.5891], locationName: 'Hebbal Flyover',
    urgencyScore: 0.35, timestamp: new Date(Date.now() - 480_000).toISOString(),
    citizen: 'Vikram J.', assignedResource: null,
    casualties: 0, symptoms: ['Minor Bruises', 'Property Damage'],
    timeline: [
      { time: new Date(Date.now() - 480_000).toISOString(), event: 'Incident Reported' },
    ],
  },
  {
    id: 'EM-1028', type: 'Fire', subtype: 'Building Fire',
    status: 'Critical', priority: 'Critical',
    location: [12.9850, 77.6100], locationName: 'Indiranagar 100ft Road',
    urgencyScore: 0.97, timestamp: new Date(Date.now() - 60_000).toISOString(),
    citizen: 'Sunita R.', assignedResource: 'AMB-22',
    casualties: 3, symptoms: ['Smoke Inhalation', 'Burns', 'Trapped Persons'],
    timeline: [
      { time: new Date(Date.now() - 60_000).toISOString(), event: 'Fire reported — 4-storey commercial building' },
      { time: new Date(Date.now() - 30_000).toISOString(), event: 'Units AMB-22, POL-09 dispatched' },
    ],
    nlpAnalysis: 'Active fire in commercial building. Multiple trapped. Burns unit at St. John on alert.',
  },
];

let hospitals: HospitalRecord[] = [
  {
    id: 'HOS-01', name: 'St. John Medical College', type: 'Medical College',
    location: [12.9716, 77.5946],
    icuBeds: 45, totalBeds: 1200, availableIcu: 8, availableBeds: 142,
    specialization: ['Trauma', 'Cardiac', 'Emergency', 'Burns'], load: 'High',
  },
  {
    id: 'HOS-02', name: 'Manipal Hospital, Old Airport Rd', type: 'Private',
    location: [12.9279, 77.6271],
    icuBeds: 30, totalBeds: 600, availableIcu: 12, availableBeds: 85,
    specialization: ['Multi-specialty', 'Neurology', 'Orthopedics'], load: 'Medium',
  },
  {
    id: 'HOS-03', name: 'Victoria Hospital (Govt)', type: 'Government',
    location: [12.9620, 77.5750],
    icuBeds: 60, totalBeds: 2500, availableIcu: 2, availableBeds: 310,
    specialization: ['Public Health', 'Burn Ward', 'Trauma'], load: 'High',
  },
  {
    id: 'HOS-04', name: 'Apollo Hospital, Jayanagar', type: 'Private',
    location: [12.9100, 77.5850],
    icuBeds: 25, totalBeds: 450, availableIcu: 18, availableBeds: 120,
    specialization: ['Oncology', 'Organ Transplant', 'Cardiology'], load: 'Low',
  },
  {
    id: 'HOS-05', name: 'Narayana Health City', type: 'Specialized',
    location: [12.8250, 77.6850],
    icuBeds: 80, totalBeds: 1500, availableIcu: 24, availableBeds: 400,
    specialization: ['Heart Surgery', 'Bone Marrow Transplant', 'Pediatric ICU'], load: 'Medium',
  },
  {
    id: 'HOS-06', name: 'Fortis Hospital, Cunningham Road', type: 'Private',
    location: [12.9890, 77.5960],
    icuBeds: 20, totalBeds: 350, availableIcu: 14, availableBeds: 95,
    specialization: ['Stroke', 'Neurology', 'Emergency'], load: 'Medium',
  },
];

let resources: ResourceRecord[] = [
  { id: 'AMB-12', type: 'Ambulance', status: 'On Mission', location: [12.9750, 77.5900] },
  { id: 'AMB-05', type: 'Ambulance', status: 'En Route',   location: [12.9300, 77.6200] },
  { id: 'AMB-22', type: 'Ambulance', status: 'On Mission', location: [12.9820, 77.6050] },
  { id: 'AMB-31', type: 'Ambulance', status: 'Available',  location: [12.9560, 77.6400] },
  { id: 'AMB-07', type: 'Ambulance', status: 'Available',  location: [12.9400, 77.5700] },
  { id: 'POL-09', type: 'Police',    status: 'On Mission', location: [12.9880, 77.6080] },
  { id: 'POL-14', type: 'Police',    status: 'Patrol',     location: [12.9650, 77.6000] },
  { id: 'POL-03', type: 'Police',    status: 'Available',  location: [12.9100, 77.6300] },
];

// ─── NLP Triage Engine (server-side rule-based) ───────────────────────────────
function nlpTriage(symptoms: string[], type: string): { priority: 'Critical' | 'Moderate' | 'Low'; urgencyScore: number; analysis: string } {
  const text = [...symptoms, type].join(' ').toLowerCase();
  const criticalKeywords = ['cardiac', 'arrest', 'unconscious', 'unresponsive', 'no pulse', 'severe bleeding', 'stroke', 'fire', 'trapped', 'burns', 'fracture', 'head injury', 'respiratory'];
  const moderateKeywords = ['dehydration', 'dizziness', 'fracture', 'wound', 'fever', 'diabetic', 'asthma', 'allergic'];
  const critCount = criticalKeywords.filter(k => text.includes(k)).length;
  const modCount  = moderateKeywords.filter(k => text.includes(k)).length;

  if (critCount >= 2 || text.includes('arrest') || text.includes('unresponsive')) {
    return { priority: 'Critical', urgencyScore: 0.85 + Math.random() * 0.14, analysis: `Critical indicators detected: ${criticalKeywords.filter(k => text.includes(k)).join(', ')}. Immediate dispatch recommended.` };
  }
  if (critCount >= 1 || modCount >= 2) {
    return { priority: 'Moderate', urgencyScore: 0.5 + Math.random() * 0.3, analysis: `Moderate severity. Monitor vitals. Dispatch within 10 minutes.` };
  }
  return { priority: 'Low', urgencyScore: 0.1 + Math.random() * 0.35, analysis: `Low urgency indicators. Standard response protocol.` };
}

// ─── Bearing-correct resource movement ────────────────────────────────────────
function moveToward(from: [number, number], to: [number, number], stepKm = 0.05): [number, number] {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const dist  = Math.sqrt(dLat * dLat + dLng * dLng);
  if (dist < 0.0003) return to; // arrived
  const step = Math.min(stepKm / 111, dist); // 1 deg ≈ 111 km
  return [
    from[0] + (dLat / dist) * step,
    from[1] + (dLng / dist) * step,
  ];
}

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
async function startServer() {
  const app        = express();
  const httpServer = createServer(app);
  const io         = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] } });
  const PORT       = Number(process.env.PORT) || 7860;

  app.use(express.json());

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      emergencies: emergencies.length,
      resources:   resources.length,
      hospitals:   hospitals.length,
      timestamp:   new Date().toISOString(),
    });
  });

  // ── Read endpoints ──────────────────────────────────────────────────────────
  app.get('/api/emergencies', (_req, res) => res.json(emergencies));
  app.get('/api/hospitals',   (_req, res) => res.json(hospitals));
  app.get('/api/resources',   (_req, res) => res.json(resources));

  // ── Report new emergency ────────────────────────────────────────────────────
  app.post('/api/emergency/report', (req, res) => {
    const body = req.body as Partial<EmergencyRecord>;
    const triage = nlpTriage(body.symptoms || [], body.type || '');
    const e: EmergencyRecord = {
      id:           `EM-${Math.floor(1000 + Math.random() * 9000)}`,
      type:         body.type         || 'Unknown',
      subtype:      body.subtype      || body.type || 'Unknown',
      status:       'Analyzing',
      priority:     triage.priority,
      location:     body.location     || [12.9716, 77.5946],
      locationName: body.locationName || 'Unknown Location',
      urgencyScore: triage.urgencyScore,
      timestamp:    new Date().toISOString(),
      citizen:      body.citizen      || 'Anonymous',
      assignedResource: null,
      casualties:   body.casualties   || 0,
      symptoms:     body.symptoms     || [],
      timeline:     [{ time: new Date().toISOString(), event: 'Incident Reported via ANEIS Portal' }],
      nlpAnalysis:  triage.analysis,
    };
    emergencies.unshift(e);
    io.emit('emergency:new', e);
    res.status(201).json(e);
  });

  // ── Triage update ───────────────────────────────────────────────────────────
  app.patch('/api/emergency/:id/triage', (req, res) => {
    const idx = emergencies.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    emergencies[idx] = { ...emergencies[idx], ...req.body };
    io.emit('emergency:update', emergencies[idx]);
    return res.json(emergencies[idx]);
  });

  // ── Assign resource ─────────────────────────────────────────────────────────
  app.patch('/api/emergency/:id/assign', (req, res) => {
    const { resourceId } = req.body as { resourceId: string };
    const eIdx = emergencies.findIndex(e => e.id === req.params.id);
    const rIdx = resources.findIndex(r => r.id === resourceId);
    if (eIdx === -1 || rIdx === -1) return res.status(404).json({ error: 'Not found' });

    // Free previous resource if any
    const prevResource = emergencies[eIdx].assignedResource;
    if (prevResource && prevResource !== resourceId) {
      const prevIdx = resources.findIndex(r => r.id === prevResource);
      if (prevIdx !== -1) resources[prevIdx] = { ...resources[prevIdx], status: 'Available' };
    }

    const evt: TimelineEvent = { time: new Date().toISOString(), event: `Unit ${resourceId} dispatched` };
    emergencies[eIdx] = {
      ...emergencies[eIdx],
      assignedResource: resourceId,
      status: 'Dispatched',
      timeline: [...(emergencies[eIdx].timeline || []), evt],
    };
    resources[rIdx] = { ...resources[rIdx], status: 'On Mission' };

    io.emit('emergency:update', emergencies[eIdx]);
    io.emit('resources:update', resources);
    return res.json(emergencies[eIdx]);
  });

  // ── NLP Re-analyze ──────────────────────────────────────────────────────────
  app.patch('/api/emergency/:id/nlp-analyze', (req, res) => {
    const idx = emergencies.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const em = emergencies[idx];
    const triage = nlpTriage(em.symptoms, em.type);
    const evt: TimelineEvent = { time: new Date().toISOString(), event: `AI Re-analysis: ${triage.priority} (score: ${triage.urgencyScore.toFixed(2)})` };
    emergencies[idx] = {
      ...em,
      priority:     triage.priority,
      urgencyScore: triage.urgencyScore,
      nlpAnalysis:  triage.analysis,
      timeline:     [...(em.timeline || []), evt],
    };
    io.emit('emergency:update', emergencies[idx]);
    return res.json(emergencies[idx]);
  });

  // ── Green Corridor ──────────────────────────────────────────────────────────
  app.post('/api/traffic/green-corridor', (req, res) => {
    const { ambulanceId, route } = req.body as { ambulanceId: string; route: string };
    const payload = {
      ambulanceId,
      route: route || 'Route A',
      status: 'Active',
      activatedAt: new Date().toISOString(),
      estimatedDuration: `${5 + Math.floor(Math.random() * 10)} minutes`,
    };
    io.emit('traffic:green-corridor', payload);
    // Log to emergency timeline
    const em = emergencies.find(e => e.assignedResource === ambulanceId);
    if (em) {
      em.timeline = [...(em.timeline || []), { time: new Date().toISOString(), event: `Green Corridor activated: ${route}` }];
      io.emit('emergency:update', em);
    }
    return res.json({ success: true, ...payload });
  });

  // ── Resource reallocation (bulk) ────────────────────────────────────────────
  app.post('/api/resource/reallocate', (req, res) => {
    const { resourceId, fromEmergencyId, toEmergencyId } = req.body as {
      resourceId: string; fromEmergencyId?: string; toEmergencyId: string;
    };
    const rIdx = resources.findIndex(r => r.id === resourceId);
    const toIdx = emergencies.findIndex(e => e.id === toEmergencyId);
    if (rIdx === -1 || toIdx === -1) return res.status(404).json({ error: 'Resource or target emergency not found' });

    // Clear from old emergency
    if (fromEmergencyId) {
      const fromIdx = emergencies.findIndex(e => e.id === fromEmergencyId);
      if (fromIdx !== -1) {
        emergencies[fromIdx] = { ...emergencies[fromIdx], assignedResource: null, status: 'Analyzing' };
        io.emit('emergency:update', emergencies[fromIdx]);
      }
    }

    const evt: TimelineEvent = { time: new Date().toISOString(), event: `Unit ${resourceId} reallocated from ${fromEmergencyId || 'standby'}` };
    emergencies[toIdx] = {
      ...emergencies[toIdx],
      assignedResource: resourceId,
      status: 'Dispatched',
      timeline: [...(emergencies[toIdx].timeline || []), evt],
    };
    resources[rIdx] = { ...resources[rIdx], status: 'On Mission' };

    io.emit('emergency:update', emergencies[toIdx]);
    io.emit('resources:update', resources);
    return res.json({ success: true, resource: resources[rIdx], emergency: emergencies[toIdx] });
  });

  // ── Hospital twin sync (update ICU/bed state from frontend AI twin) ─────────
  app.post('/api/hospital/:id/twin-sync', (req, res) => {
    const idx = hospitals.findIndex(h => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Hospital not found' });
    const { availableIcu, availableBeds } = req.body as Partial<HospitalRecord>;
    if (availableIcu !== undefined) hospitals[idx].availableIcu = availableIcu;
    if (availableBeds !== undefined) hospitals[idx].availableBeds = availableBeds;
    const loadScore = (hospitals[idx].icuBeds - hospitals[idx].availableIcu) / hospitals[idx].icuBeds;
    hospitals[idx].load = loadScore > 0.8 ? 'High' : loadScore > 0.4 ? 'Medium' : 'Low';
    io.emit('hospitals:update', hospitals);
    return res.json(hospitals[idx]);
  });

  // ── Socket.IO ───────────────────────────────────────────────────────────────
  io.on('connection', socket => {
    console.log(`[ANEIS] Client connected: ${socket.id}`);
    // Send full state on connect
    socket.emit('emergencies:init', emergencies);
    socket.emit('hospitals:init',   hospitals);
    socket.emit('resources:init',   resources);
    socket.on('disconnect', () => console.log(`[ANEIS] Disconnected: ${socket.id}`));
  });

  // ── Resource movement simulation (2 s) ─────────────────────────────────────
  setInterval(() => {
    let moved = false;
    resources = resources.map(r => {
      if (r.status === 'On Mission' || r.status === 'En Route') {
        const em = emergencies.find(e => e.assignedResource === r.id);
        if (em) {
          const newLoc = moveToward(r.location as [number, number], em.location as [number, number]);
          if (newLoc[0] !== r.location[0] || newLoc[1] !== r.location[1]) {
            moved = true;
            return { ...r, location: newLoc };
          }
          // Arrived → mark In Progress
          if (em.status === 'Dispatched') {
            const idx = emergencies.findIndex(e => e.id === em.id);
            if (idx !== -1) {
              const evt: TimelineEvent = { time: new Date().toISOString(), event: `Unit ${r.id} arrived on scene` };
              emergencies[idx] = { ...emergencies[idx], status: 'In Progress', timeline: [...(emergencies[idx].timeline || []), evt] };
              io.emit('emergency:update', emergencies[idx]);
            }
          }
          return r;
        }
      }
      // Idle drift (±30m)
      moved = true;
      return {
        ...r,
        location: [
          r.location[0] + (Math.random() - 0.5) * 0.0003,
          r.location[1] + (Math.random() - 0.5) * 0.0003,
        ] as [number, number],
      };
    });
    if (moved) io.emit('resources:update', resources);
  }, 2000);

  // ── Hospital simulation (5 s) ───────────────────────────────────────────────
  setInterval(() => {
    hospitals = hospitals.map(h => {
      const newIcu  = Math.max(0, Math.min(h.icuBeds,   h.availableIcu  + Math.floor(Math.random() * 3) - 1));
      const newBeds = Math.max(0, Math.min(h.totalBeds, h.availableBeds + Math.floor(Math.random() * 7) - 3));
      const loadScore = (h.icuBeds - newIcu) / h.icuBeds;
      return { ...h, availableIcu: newIcu, availableBeds: newBeds, load: loadScore > 0.8 ? 'High' : loadScore > 0.4 ? 'Medium' : 'Low' };
    });
    io.emit('hospitals:update', hospitals);
  }, 5000);

  // ── System alert simulation (30 s) ──────────────────────────────────────────
  setInterval(() => {
    const criticalHospitals = hospitals.filter(h => h.availableIcu < 3);
    if (criticalHospitals.length > 0) {
      io.emit('system:alert', {
        type: 'icu_critical',
        message: `ICU nearly full at: ${criticalHospitals.map(h => h.name).join(', ')}`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
      });
    }
  }, 30_000);

  // ── Static frontend ─────────────────────────────────────────────────────────
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ANEIS] Intelligence Hub running → http://0.0.0.0:${PORT}`);
    console.log(`[ANEIS] Loaded: ${emergencies.length} emergencies | ${hospitals.length} hospitals | ${resources.length} resources`);
  });
}

startServer().catch(err => {
  console.error('[ANEIS] Fatal startup error:', err);
  process.exit(1);
});
