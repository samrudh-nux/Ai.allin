export type EmergencyPriority = 'Low' | 'Moderate' | 'Critical';
export type EmergencyStatus = 'Analyzing' | 'Dispatched' | 'En Route' | 'In Progress' | 'Resolved';

export interface EmergencyRecord {
  id: string;
  type: string;
  subtype?: string;
  priority: EmergencyPriority;
  status: EmergencyStatus;
  location: [number, number];
  locationName?: string;
  urgencyScore: number;
  timestamp: string;
  citizen: string;
  assignedResource?: string;
  assignedHospital?: string;
  symptoms?: string[];
  nlpAnalysis?: string;
  casualties?: number;
  timeline?: { time: string; event: string }[];
}

export interface HospitalRecord {
  id: string;
  name: string;
  type: 'Private' | 'Government' | 'Medical College' | 'Specialized';
  location: [number, number];
  icuBeds: number;
  totalBeds: number;
  availableIcu: number;
  availableBeds: number;
  specialization: string[];
  load: 'Low' | 'Medium' | 'High';
}

export interface ResourceRecord {
  id: string;
  type: 'Ambulance' | 'Police' | 'Fire';
  status: 'Available' | 'On Mission' | 'En Route' | 'Maintenance';
  location: [number, number];
}
