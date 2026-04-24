import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const PORT = process.env.PORT || 7860;

  // Mock Data Store
  let emergencies: any[] = [
    {
      id: 'EM-1024',
      type: 'Medical',
      subtype: 'Cardiac Arrest',
      status: 'In Progress',
      priority: 'Critical',
      location: [12.9716, 77.5946],
      locationName: 'Vittal Mallya Road',
      urgencyScore: 0.95,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      citizen: 'Rahul S.',
      assignedResource: 'AMB-12',
      assignedHospital: 'St. John Medical College',
      casualties: 1,
      symptoms: ['Unresponsive', 'No Pulse', 'Chest Pain'],
      timeline: [
        { time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), event: 'Incident Reported' },
        { time: new Date(Date.now() - 1000 * 60 * 14).toISOString(), event: 'System Analysis Complete: Cardiac Arrest detected' },
        { time: new Date(Date.now() - 1000 * 60 * 12).toISOString(), event: 'Unit AMB-12 Dispatched' }
      ]
    },
    {
      id: 'EM-1025',
      type: 'Accident',
      subtype: 'Road Traffic Accident',
      status: 'Dispatched',
      priority: 'Critical',
      location: [12.9279, 77.6271],
      locationName: 'Sarjapur Main Road',
      urgencyScore: 0.88,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      citizen: 'Priya K.',
      assignedResource: 'AMB-05',
      assignedHospital: 'Manipal Hospital, Old Airport Rd',
      casualties: 2,
      symptoms: ['Multiple Fractures', 'Severe Bleeding', 'Head Injury'],
      timeline: [
        { time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), event: 'Incident Reported' },
        { time: new Date(Date.now() - 1000 * 60 * 4).toISOString(), event: 'Unit AMB-05 Dispatched' }
      ]
    },
    {
      id: 'EM-1026',
      type: 'Medical',
      subtype: 'Severe Dehydration',
      status: 'Analyzing',
      priority: 'Moderate',
      location: [12.9620, 77.5750],
      locationName: 'Victoria Hospital Area',
      urgencyScore: 0.65,
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      citizen: 'Anil M.',
      assignedResource: null,
      casualties: 0,
      symptoms: ['Dizziness', 'Weakness', 'Extreme Thirst'],
      timeline: [
        { time: new Date(Date.now() - 1000 * 60 * 2).toISOString(), event: 'Incident Reported via Call' }
      ]
    },
    {
      id: 'EM-1027',
      type: 'Public Safety',
      subtype: 'Street Fight',
      status: 'Analyzing',
      priority: 'Low',
      location: [13.0033, 77.5891],
      locationName: 'Hebbal Flyover',
      urgencyScore: 0.35,
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      citizen: 'Vikram J.',
      assignedResource: null,
      casualties: 0,
      symptoms: ['Minor Bruises', 'Loud Noise', 'Property Damage'],
      timeline: [
        { time: new Date(Date.now() - 1000 * 60 * 8).toISOString(), event: 'Incident Reported' }
      ]
    }
  ];

  let hospitals = [
    {
      id: 'HOS-01',
      name: 'St. John Medical College',
      type: 'Medical College',
      location: [12.9716, 77.5946],
      icuBeds: 45,
      totalBeds: 1200,
      availableIcu: 8,
      availableBeds: 142,
      specialization: ['Trauma', 'Cardiac', 'Emergency care'],
      load: 'High'
    },
    {
      id: 'HOS-02',
      name: 'Manipal Hospital, Old Airport Rd',
      type: 'Private',
      location: [12.9279, 77.6271],
      icuBeds: 30,
      totalBeds: 600,
      availableIcu: 12,
      availableBeds: 85,
      specialization: ['Multi-specialty', 'Neurology'],
      load: 'Medium'
    },
    {
      id: 'HOS-03',
      name: 'Victoria Hospital (Govt)',
      type: 'Government',
      location: [12.9620, 77.5750],
      icuBeds: 60,
      totalBeds: 2500,
      availableIcu: 2,
      availableBeds: 310,
      specialization: ['Public Health', 'Burn Ward', 'Infectious Disease'],
      load: 'High'
    },
    {
      id: 'HOS-04',
      name: 'Apollo Hospital, Jayanagar',
      type: 'Private',
      location: [12.9100, 77.5850],
      icuBeds: 25,
      totalBeds: 450,
      availableIcu: 18,
      availableBeds: 120,
      specialization: ['Oncology', 'Organ Transplant'],
      load: 'Low'
    },
    {
      id: 'HOS-05',
      name: 'Narayana Health City',
      type: 'Specialized',
      location: [12.8250, 77.6850],
      icuBeds: 80,
      totalBeds: 1500,
      availableIcu: 24,
      availableBeds: 400,
      specialization: ['Heart Surgery', 'Bone Marrow Transplant'],
      load: 'Medium'
    }
  ];

  let resources = [
    { id: 'AMB-12', type: 'Ambulance', status: 'On Mission', location: [12.9750, 77.5900] },
    { id: 'AMB-05', type: 'Ambulance', status: 'En Route', location: [12.9300, 77.6200] },
    { id: 'AMB-22', type: 'Ambulance', status: 'Available', location: [13.0100, 77.6000] },
    { id: 'POL-09', type: 'Police', status: 'Patrol', location: [12.9900, 77.5800] }
  ];

  app.use(express.json());

  // API Endpoints
  app.get('/api/emergencies', (req, res) => {
    res.json(emergencies);
  });

  app.get('/api/hospitals', (req, res) => {
    res.json(hospitals);
  });

  app.get('/api/resources', (req, res) => {
    res.json(resources);
  });

  app.post('/api/emergency/report', (req, res) => {
    const newEmergency = {
      id: `EM-${Math.floor(1000 + Math.random() * 9000)}`,
      ...req.body,
      status: 'Analyzing',
      timestamp: new Date().toISOString(),
      casualties: Math.floor(Math.random() * 3),
      timeline: [
        { time: new Date().toISOString(), event: 'Incident Reported via Intelligence Portal' }
      ]
    };
    emergencies.unshift(newEmergency);
    io.emit('emergency:new', newEmergency);
    res.status(201).json(newEmergency);
  });

  app.patch('/api/emergency/:id/triage', (req, res) => {
    const { id } = req.params;
    const index = emergencies.findIndex(e => e.id === id);
    if (index !== -1) {
      emergencies[index] = { ...emergencies[index], ...req.body };
      io.emit('emergency:update', emergencies[index]);
      res.json(emergencies[index]);
    } else {
      res.status(404).json({ error: 'Emergency not found' });
    }
  });

  app.post('/api/traffic/green-corridor', (req, res) => {
    const { route, ambulanceId } = req.body;
    io.emit('traffic:green-corridor', { ambulanceId, route, status: 'Active' });
    res.json({ success: true, message: 'Green corridor activated for route.' });
  });

  app.patch('/api/emergency/:id/assign', (req, res) => {
    const { id } = req.params;
    const { resourceId } = req.body;
    const index = emergencies.findIndex(e => e.id === id);
    const resourceIndex = resources.findIndex(r => r.id === resourceId);

    if (index !== -1 && resourceIndex !== -1) {
      const timelineEvent = { time: new Date().toISOString(), event: `Unit ${resourceId} dispatched to scene` };
      emergencies[index] = {
        ...emergencies[index],
        assignedResource: resourceId,
        status: 'Dispatched',
        timeline: [...(emergencies[index].timeline || []), timelineEvent]
      };
      resources[resourceIndex] = {
        ...resources[resourceIndex],
        status: 'On Mission'
      };
      io.emit('emergency:update', emergencies[index]);
      io.emit('resources:update', resources);
      res.json(emergencies[index]);
    } else {
      res.status(404).json({ error: 'Emergency or Resource not found' });
    }
  });

  // Global intervals — run once for all clients, broadcast to everyone
  setInterval(() => {
    resources = resources.map(r => {
      if (r.status === 'On Mission') {
        const emergency = emergencies.find(e => e.assignedResource === r.id);
        if (emergency) {
          const [eLat, eLng] = emergency.location;
          const [rLat, rLng] = r.location as [number, number];
          const speed = 0.0005;
          const dLat = eLat - rLat;
          const dLng = eLng - rLng;
          const distance = Math.sqrt(dLat * dLat + dLng * dLng);
          if (distance > 0.0005) {
            return {
              ...r,
              location: [
                rLat + (dLat / distance) * speed,
                rLng + (dLng / distance) * speed
              ]
            };
          }
        }
      }
      return {
        ...r,
        location: [
          (r.location as [number, number])[0] + (Math.random() - 0.5) * 0.0005,
          (r.location as [number, number])[1] + (Math.random() - 0.5) * 0.0005
        ]
      };
    });
    io.emit('resources:update', resources);
  }, 2000);

  setInterval(() => {
    hospitals = hospitals.map(h => {
      const icuChange = Math.floor(Math.random() * 3) - 1;
      const bedChange = Math.floor(Math.random() * 7) - 3;
      const newIcu = Math.max(0, Math.min(h.icuBeds, h.availableIcu + icuChange));
      const newBeds = Math.max(0, Math.min(h.totalBeds, h.availableBeds + bedChange));
      const loadScore = (h.icuBeds - newIcu) / h.icuBeds;
      const load = loadScore > 0.8 ? 'High' : loadScore > 0.4 ? 'Medium' : 'Low';
      return { ...h, availableIcu: newIcu, availableBeds: newBeds, load };
    });
    io.emit('hospitals:update', hospitals);
  }, 5000);

  // Socket connection — send initial state on join
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send full current state to newly connected client
    socket.emit('emergencies:init', emergencies);
    socket.emit('hospitals:init', hospitals);
    socket.emit('resources:init', resources);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Serve built frontend
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ANEIS Intelligence Hub running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
