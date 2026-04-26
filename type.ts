export interface TimelineEvent {
  time: string;
  event: string;
}

export interface EmergencyRecord {
  id: string;
  type: string;
  subtype: string;
  status: 'Analyzing' | 'Dispatched' | 'In Progress' | 'Resolved' | 'Critical';
  priority: 'Critical' | 'Moderate' | 'Low';
  location: [number, number];
  locationName: string;
  urgencyScore: number;
  timestamp: string;
  citizen: string;
  assignedResource?: string | null;
  assignedHospital?: string;
  casualties?: number;
  symptoms: string[];
  timeline?: TimelineEvent[];
  nlpAnalysis?: string;
}

export interface HospitalRecord {
  id: string;
  name: string;
  type: string;
  location: [number, number];
  icuBeds: number;
  totalBeds: number;
  availableIcu: number;
  availableBeds: number;
  specialization: string[];
  load: 'High' | 'Medium' | 'Low';
}

export interface ResourceRecord {
  id: string;
  type: string;
  status: string;
  location: [number, number];
}

export interface Vitals {
  heartRate: number;
  systolicBP: number;
  oxygenSat: number;
  temperature: number;
  respiratoryRate: number;
  glucoseLevel: number;
  timestamp: string;
}

export interface PatientRiskProfile {
  patientId: string;
  name: string;
  age: number;
  ward: string;
  admitTime: string;
  diagnosis: string;
  riskScore: number;
  riskTrend: 'rising' | 'stable' | 'falling';
  deteriorationRisk1h: number;
  deteriorationRisk6h: number;
  vitals: Vitals;
  vitalHistory: Vitals[];
  aiExplanation: string;
  alerts: RiskAlert[];
  confidenceScore: number;
}

export interface RiskAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  factor: string;
}

export interface HospitalTwin {
  id: string;
  name: string;
  currentOccupancy: number;
  icuOccupancy: number;
  predictedOccupancy1h: number;
  predictedOccupancy6h: number;
  patientInflow: number;
  patientOutflow: number;
  staffOnDuty: number;
  staffRequired: number;
  oxygenLevel: number;
  ventilators: { total: number; inUse: number };
  bloodBanks: { [type: string]: number };
  aiSuggestions: AISuggestion[];
  departments: DepartmentLoad[];
}

export interface DepartmentLoad {
  name: string;
  capacity: number;
  current: number;
  waitTime: number;
}

export interface AISuggestion {
  id: string;
  module: 'facility' | 'units' | 'risk' | 'analytics';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  confidence: number;
  impact: string;
  timestamp: string;
}

export interface AgentDecision {
  agentId: string;
  agentType: 'BedAllocation' | 'StaffScheduling' | 'EmergencyRouting' | 'ResourceOptimizer';
  decision: string;
  reasoning: string;
  confidence: number;
  priority: number;
  status: 'pending' | 'executing' | 'completed' | 'rejected';
  timestamp: string;
  impact: string;
}

export interface CommandMessage {
  id: string;
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp: string;
  agentDecisions?: AgentDecision[];
}

export interface AnalyticsSnapshot {
  timestamp: string;
  totalEmergencies: number;
  criticalCount: number;
  resolvedCount: number;
  avgResponseTime: number;
  avgUrgencyScore: number;
  mortalityRisk: number;
  systemLoad: number;
  anomalyScore: number;
  bottlenecks: string[];
  predictions: { next1h: number; next6h: number; next24h: number };
}

export interface AnomalyEvent {
  id: string;
  type: 'surge' | 'bottleneck' | 'critical_cluster' | 'resource_shortage' | 'unusual_pattern';
  severity: 'critical' | 'warning';
  description: string;
  affectedArea: string;
  detectedAt: string;
  confidence: number;
}

export type SimulationMode = 'normal' | 'surge' | 'disaster';

export interface SimulationConfig {
  mode: SimulationMode;
  patientInjectRate: number;
  vitalsDriftRate: number;
  alertFrequency: number;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
