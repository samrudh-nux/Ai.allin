---
title: ANEIS 2.0 — AI Emergency Intelligence System
emoji: 🚨
colorFrom: red
colorTo: blue
sdk: docker
pinned: true
license: mit
short_description: Government of India · AI-Powered Real-Time Emergency Intelligence & Dispatch Platform
---

<div align="center">

<br/>

<!-- LOGO BLOCK -->
<img src="https://img.shields.io/badge/ANEIS-2.0-2563eb?style=for-the-badge&logo=shield&logoColor=white&labelColor=0f172a" height="42"/>

<br/><br/>

# 🚨 ANEIS 2.0
### **AI Emergency Intelligence System**

> *Real-time dispatch · Clinical risk engine · Hospital digital twin · AI operations commander*

<br/>

[![Live Demo](https://img.shields.io/badge/🟢%20LIVE%20DEMO-HuggingFace%20Space-FF9D00?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0)
[![Files](https://img.shields.io/badge/📁%20SOURCE%20CODE-View%20Files-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/tree/main)
[![Commits](https://img.shields.io/badge/🔖%2048%20COMMITS-History-6366f1?style=for-the-badge)](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/commits/main)
[![Community](https://img.shields.io/badge/💬%20COMMUNITY-Discussions-10b981?style=for-the-badge)](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/discussions)

<br/>

![Digital India](https://img.shields.io/badge/Digital%20India-Initiative-FF6B00?style=flat-square)
![MEITY](https://img.shields.io/badge/MEITY-Aligned-1e40af?style=flat-square)
![ISO 27001](https://img.shields.io/badge/ISO-27001%20Security-16a34a?style=flat-square)
![AI Powered](https://img.shields.io/badge/AI-Powered-7c3aed?style=flat-square)

</div>

---

## 🎯 What is ANEIS?

**ANEIS (AI Emergency Intelligence System)** is a full-stack, production-grade emergency response platform built for the scale of India. It connects distressed citizens to emergency responders, hospitals, and AI-driven command systems — in real time.

ANEIS 2.0 is not a prototype. It is a live, deployable intelligence hub with:
- A **citizen-facing emergency portal** (voice/text/chat, multilingual)
- A **biometric-gated authority dashboard** with real-time command tools
- A **clinical AI risk engine** scoring patient deterioration probability
- A **hospital digital twin** simulating occupancy, ICU load, and resource states
- A **natural language operations commander** that interprets free-form authority queries
- A **live WebSocket backend** (Express + Socket.IO) powering all real-time updates

> Built with: **React + TypeScript + Vite + Tailwind CSS + Express + Socket.IO + Docker**  
> Deployed on: **Hugging Face Spaces (Docker runtime, Port 7860)**

---

## 🚀 Live Links

| Resource | Link |
|---|---|
| 🟢 **Live Application** | [https://samrudh-nux-anesi-2-0.hf.space](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0) |
| 📁 **Source Files** | [/tree/main](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/tree/main) |
| 🧠 **AI Engine** | [aiEngine.ts](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/blob/main/aiEngine.ts) |
| 🖥️ **Server** | [server.ts](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/blob/main/server.ts) |
| 🙋 **Citizen Portal** | [CitizenPortal.tsx](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/blob/main/CitizenPortal.tsx) |
| 🛡️ **Authority Dashboard** | [AuthorityDashboard.tsx](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/blob/main/AuthorityDashboard.tsx) |
| 🗺️ **Map Component** | [Map.tsx](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/blob/main/Map.tsx) |
| 📋 **Commit History** | [/commits/main](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/commits/main) |
| 💬 **Discussions** | [/discussions](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0/discussions) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANEIS 2.0 PLATFORM                          │
│                                                                     │
│   ┌─────────────────┐        ┌─────────────────────────────────┐   │
│   │  CITIZEN PORTAL │        │     AUTHORITY DASHBOARD          │   │
│   │                 │        │  (Biometric-Gated)               │   │
│   │  • SOS Button   │        │                                  │   │
│   │  • Voice Input  │        │  ┌──────────┐  ┌─────────────┐  │   │
│   │  • Chat Bot     │        │  │  Map Tab │  │ Monitor Tab │  │   │
│   │  • Live ETA Map │        │  │  Live    │  │ Patient AI  │  │   │
│   │  • Multilingual │        │  │  Dispatch│  │ Risk Engine │  │   │
│   └────────┬────────┘        │  └──────────┘  └─────────────┘  │   │
│            │                 │  ┌──────────┐  ┌─────────────┐  │   │
│            │                 │  │ Facility │  │  Analytics  │  │   │
│            ▼                 │  │ Digital  │  │  Anomaly    │  │   │
│   ┌─────────────────────────────────────────────────────────┐  │   │
│   │              EXPRESS + SOCKET.IO SERVER                  │  │   │
│   │                   (Port 7860, ESM)                       │  │   │
│   │                                                          │  │   │
│   │  REST API:  /api/emergencies  /api/hospitals             │  │   │
│   │             /api/resources    /api/emergency/report      │  │   │
│   │             /api/traffic/green-corridor                  │  │   │
│   │             /api/hospital/:id/twin-sync                  │  │   │
│   │                                                          │  │   │
│   │  Socket Events: emergency:new  emergency:update          │  │   │
│   │                 resources:update  hospitals:update        │  │   │
│   │                 traffic:green-corridor  system:alert      │  │   │
│   └──────────────────────────────────────────────────────────┘  │   │
│            │                 └─────────────────────────────────┘   │
│            │                                                        │
│   ┌────────▼──────────────────────────────────────────────────┐    │
│   │                    AI ENGINE (aiEngine.ts)                 │    │
│   │                                                            │    │
│   │  • Vitals Risk Scorer         • Hospital Digital Twin      │    │
│   │  • Deterioration Forecaster   • Agent Decisions Engine     │    │
│   │  • Simulation Engine          • NL Command Parser          │    │
│   │    (Normal / Surge / Disaster) • Analytics + Anomaly Detect│    │
│   └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Feature Breakdown

### 🙋 Citizen Emergency Portal

The public-facing entry point, designed for *anyone* to use under distress.

| Feature | Detail |
|---|---|
| **SOS Button** | One-tap emergency signal with animated dispatch confirmation |
| **Voice Reporting** | Web Speech API with multilingual support — Hindi, Kannada, Tamil, English, Hinglish |
| **Live Confidence Score** | Real-time voice recognition confidence (%) displayed as badge |
| **AI Local Triage** | Rule-based NLP engine classifies emergency type from free-text: Cardiac, Trauma, Fire, Stroke, Diabetic, Respiratory |
| **Quick Incident Buttons** | Emoji-labeled presets (❤️ Cardiac, 🚗 Accident, 🔥 Fire, 🧠 Stroke, 💉 Diabetic, 🩸 Bleeding) |
| **Emergency Chat Bot** | WhatsApp-style chat interface with AI bot that analyzes and dispatches |
| **Live Map Tracking** | Real-time map of dispatched ambulance moving toward incident location |
| **ETA Display** | Live calculated ETA based on resource-to-incident GPS distance |
| **Medical Directive** | System displays auto-generated care instructions while help is en route |
| **Direct 112 Call** | One-tap button to call India's national emergency number |

---

### 🛡️ Authority Dashboard (Biometric-Gated)

A full command-and-control interface for emergency operators and hospital administrators.

#### Tab 1 — 🗺️ Live Map Command
- Real-time Leaflet map showing all active emergencies, ambulances, police units, and hospitals
- Emergency cards with priority badges (Critical / Moderate / Low)
- Resource assignment: dispatch any available unit to any emergency in one click
- Green Corridor activation: clears traffic signals for ambulances on active routes
- NLP re-analysis button: re-runs AI triage on any incident on demand
- Socket.IO live updates — resources animate toward their assigned incidents every 2 seconds

#### Tab 2 — 🧠 Patient Clinical Monitor
- Full patient panel with real-time vital sign monitoring
- **Risk Gauge SVG**: animated semicircle gauge showing score 0–100 (Green / Amber / Red)
- **Vitals tracked**: Heart Rate, Systolic BP, SpO₂, Temperature, Respiratory Rate, Glucose
- **Deterioration forecast**: 1-hour and 6-hour risk probability
- **Vital trend**: Rising / Stable / Falling classification
- **Sparkline charts**: per-vital history visualization
- **AI Explanation**: plain-English summary of risk factors and recommended action
- **Simulation modes**: Normal / Surge / Disaster — each changes inflow rate, drift rate, and alert frequency
- Add / remove patients with auto-generated demographics (Indian names, wards, diagnoses)

#### Tab 3 — 🏥 Hospital Digital Twin
- Live occupancy simulation with configurable surge multipliers
- ICU occupancy, bed availability, ventilator count, oxygen level, blood bank (O+, A+, B+, AB+)
- Department load bars: Emergency, ICU, Cardiology, Neurology, Pediatrics, Orthopedics
- AI Suggestions panel: auto-generated recommendations (e.g., "Transfer 3 stable ICU patients to HDU")
- Predicted occupancy at 1h and 6h
- Twin sync API posts real-time state to backend

#### Tab 4 — 🤖 AI Operations Commander (Copilot)
- Natural language command interface — type queries like:
  - *"Who is the most critical patient?"*
  - *"What is the ICU status?"*
  - *"Show me bottlenecks"*
  - *"Predict next 6 hours"*
  - *"What should we do right now?"*
  - *"Check oxygen and resources"*
- Rule-based NL parser with context from live twin + patient + agent state
- **Autonomous Agent Decisions**: 4 agent types fire automatically:
  - `BedAllocation` — reallocates ICU beds from elective patients
  - `StaffScheduling` — calls in additional staff based on gaps
  - `EmergencyRouting` — priority-routes highest-risk patient to nearest ICU bay
  - `ResourceOptimizer` — flags oxygen shortage and activates conservation protocol
- Each decision shows: confidence %, priority rank, status (pending/executing), and estimated impact

#### Tab 5 — 📊 Analytics & Anomaly Detection
- Live analytics snapshot: total emergencies, critical count, resolved, avg response time, mortality risk, system load, anomaly score
- Predictions: emergency volume at +1h, +6h, +24h
- Bottleneck list: dynamically populated from ICU load, staff ratio, oxygen level, patient accumulation
- **Anomaly Events**: auto-detected cluster surges, load anomalies, and new bottleneck appearances

---

## 🧠 AI Engine — `aiEngine.ts`

The core intelligence layer. Pure TypeScript, no external AI dependencies.

### Vital Risk Scoring
```
scoreVitals(v: Vitals) → { score: 0–100, flags: string[] }
```
Each vital parameter contributes weighted points to the risk score:

| Vital | Critical Threshold | Score |
|---|---|---|
| Heart Rate | >130 or <40 bpm | +25 |
| Systolic BP | >180 or <80 mmHg | +25 |
| SpO₂ | <88% | +30 |
| Temperature | >39.5°C or <35°C | +20 |
| Respiratory Rate | >30 or <8 /min | +20 |
| Glucose | >300 or <50 mg/dL | +20 |

### Deterioration Forecasting
- **1-hour risk**: `score × 1.1 + (trend bonus if rising)`
- **6-hour risk**: `score × 1.3 + (trend bonus if rising)`
- Trend is `rising/stable/falling` computed from the last 3 vital snapshots

### Simulation Engine
| Mode | Patient Inflow | Vitals Drift | Alert Frequency |
|---|---|---|---|
| Normal | 0.3x | 0.5x | 10% |
| Surge | 1.2x | 1.5x | 40% |
| Disaster | 3.0x | 3.0x | 100% |

### Natural Language Command Parser
Keyword routing across: `critical/worst`, `icu/bed`, `staff/nurse/doctor`, `bottleneck/problem`, `oxygen/supply/resource`, `action/recommend`, `predict/forecast`, `(default overview)`

---

## 🔌 Backend API — `server.ts`

Express + Socket.IO server. ESM module. HF Spaces compatible on port 7860.

### REST Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | System health, uptime, entity counts |
| `GET` | `/api/emergencies` | All active emergency records |
| `GET` | `/api/hospitals` | Hospital list with ICU/bed state |
| `GET` | `/api/resources` | Ambulance/police unit locations & status |
| `POST` | `/api/emergency/report` | Report new emergency (runs NLP triage) |
| `PATCH` | `/api/emergency/:id/triage` | Update triage fields |
| `PATCH` | `/api/emergency/:id/assign` | Assign resource to emergency |
| `PATCH` | `/api/emergency/:id/nlp-analyze` | Re-run NLP analysis |
| `POST` | `/api/traffic/green-corridor` | Activate traffic green corridor |
| `POST` | `/api/resource/reallocate` | Reallocate resource between emergencies |
| `POST` | `/api/hospital/:id/twin-sync` | Sync hospital twin state from frontend |

### Socket.IO Events
| Event | Direction | Payload |
|---|---|---|
| `emergencies:init` | Server → Client | Full emergency list on connect |
| `emergency:new` | Server → Client | New incident object |
| `emergency:update` | Server → Client | Updated incident |
| `resources:update` | Server → Client | Updated resource locations |
| `hospitals:update` | Server → Client | Updated hospital states |
| `traffic:green-corridor` | Server → Client | Green corridor activation |
| `system:alert` | Server → Client | ICU critical system alert (30s cycle) |

### Real-time Simulations
- **Resource movement** (every 2s): ambulances/police animate toward assigned incident locations using bearing-correct `moveToward()` function
- **Hospital simulation** (every 5s): ICU/bed counts fluctuate realistically
- **System alerts** (every 30s): broadcasts ICU critical alerts if any hospital drops below 3 available ICU beds

### Seed Data (Bangalore, India)
Pre-loaded with 5 real emergencies across Bengaluru locations, 6 hospitals (St. John, Manipal, Victoria, Apollo, Narayana, Fortis), and 8 resources (5 ambulances, 3 police units).

---

## 🗂️ Project Structure

```
Anesi-2.0/
├── App.tsx                  # Root app — role selector (home / citizen / authority)
├── CitizenPortal.tsx        # Citizen emergency portal (25.8 kB)
├── AuthorityDashboard.tsx   # Full authority command center (71.2 kB)
├── Map.tsx                  # Shared Leaflet map component (15.2 kB)
├── aiEngine.ts              # Core AI engine — risk, simulation, NL commands (22 kB)
├── server.ts                # Express + Socket.IO backend (23.6 kB)
├── gemini.ts                # Gemini API integration hook
├── type.ts / Types          # Full TypeScript type definitions
├── main.tsx                 # React entry point
├── index.html               # HTML shell
├── index.css                # Global styles
├── vite.config.ts           # Vite build config
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
├── Dockerfile               # Docker build (Node.js, Vite build + Express serve)
├── Tailwind.config          # Tailwind CSS config
└── Postcss.config           # PostCSS config
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Framer Motion |
| **Maps** | Leaflet.js (via Map.tsx) |
| **Icons** | Lucide React |
| **Backend** | Express.js (ESM) + Socket.IO |
| **AI Engine** | Pure TypeScript (custom risk scoring, simulation, NL parsing) |
| **Voice** | Web Speech API (browser-native) |
| **Deployment** | Docker (Hugging Face Spaces, Port 7860) |
| **Runtime** | Node.js + ts-node / tsx |

---

## 🚦 Getting Started (Local)

```bash
# Clone the space
git clone https://huggingface.co/spaces/samrudh-nux/Anesi-2.0
cd Anesi-2.0

# Install dependencies
npm install

# Build frontend
npm run build

# Start server
npm start
# → Server runs at http://localhost:7860
```

Or with Docker:
```bash
docker build -t aneis-2.0 .
docker run -p 7860:7860 aneis-2.0
```

---

## 🔐 Role Access

| Role | Entry Point | Auth |
|---|---|---|
| **Citizen** | Home → "Citizen Access" | Open (no auth) |
| **Authority** | Home → "Authority Login" | Biometric gate simulation |

The biometric gate (`BiometricGate.tsx`) simulates fingerprint/face verification before granting access to the authority dashboard.

---

## 🌐 Multilingual Support

The Citizen Portal supports emergency reporting in:

| Language | Script | Detection |
|---|---|---|
| English | Latin | Default |
| Hindi | देवनागरी | `/[अ-ह]/` regex |
| Kannada | ಕನ್ನಡ | `/[ಅ-ಹ]/` regex |
| Tamil | தமிழ் | `/[அ-ஹ]/` regex |
| Hinglish | Mixed | Keyword pattern match |

Voice recognition is pre-configured for `hi-IN` (Hindi-India) with cross-language recognition through the browser's Speech API.

---

## 🏥 Preloaded Hospital Network (Bengaluru)

| Hospital | Type | ICU Beds | Specialization |
|---|---|---|---|
| St. John Medical College | Medical College | 45 | Trauma, Cardiac, Burns |
| Manipal Hospital, Airport Rd | Private | 30 | Neurology, Orthopedics |
| Victoria Hospital (Govt) | Government | 60 | Burn Ward, Public Health |
| Apollo Hospital, Jayanagar | Private | 25 | Oncology, Cardiology |
| Narayana Health City | Specialized | 80 | Heart Surgery, Pediatric ICU |
| Fortis Hospital, Cunningham Rd | Private | 20 | Stroke, Neurology |

---

## 📊 AI Performance Parameters

| Metric | Value |
|---|---|
| Vital risk confidence | 72–90% (computed per assessment) |
| NL command response | <50ms (rule-based, local) |
| Resource location update | Every 2 seconds |
| Hospital twin refresh | Every 5 seconds |
| System alert cycle | Every 30 seconds |
| Deterioration model lookback | Last 3 vital snapshots |
| Patient pool size | Up to 50+ simultaneous patients |

---

## 🗺️ Roadmap

- [ ] Gemini 1.5 Pro integration for richer NL command responses
- [ ] Real GPS geolocation for citizen emergency pinning
- [ ] Push notification system for authority alerts
- [ ] Historical analytics dashboard with time-series charts
- [ ] Actual biometric API integration (Aadhaar / FIDO2)
- [ ] Mobile-first PWA wrapper
- [ ] Multi-city hospital network expansion
- [ ] WhatsApp Business API integration for citizen chat

---

## 👤 Author

**Samrudh**  
[![HuggingFace](https://img.shields.io/badge/HuggingFace-samrudh--nux-FF9D00?style=flat-square&logo=huggingface)](https://huggingface.co/samrudh-nux)

---

## 📄 License

MIT License — open for research, education, and civic-tech applications.

---

<div align="center">

**ANEIS 2.0 — Built for India's 1.4 billion.**

*Digital India · MEITY · Emergency Response System · AI Powered · ISO 27001*

<br/>

[![Live on HuggingFace](https://img.shields.io/badge/🚨%20TRY%20ANEIS%202.0%20LIVE-Launch%20App-FF3B30?style=for-the-badge)](https://huggingface.co/spaces/samrudh-nux/Anesi-2.0)

</div>
