// Core Types for Nely MVP
export interface ElderlyProfile {
  id: string;
  name: string;
  age: number;
  relationship: string; // Nenek, Atuk, Mama, Papa, etc.
  avatar?: string;
  careLevel: 'independent' | 'dependent' | 'bedridden';
  conditions: string[];
  currentMedications: Medication[];
  emergencyContact: string; // Keep for backward compatibility
  dateCreated: string;
  // Physical information
  weight?: number; // in kilograms
  height?: number; // in centimeters
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  // Contact & emergency
  doctorName?: string;
  clinicName?: string;
  emergencyContactPhone?: string;
}

export interface VitalSigns {
  id: string;
  elderlyId: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
    status: HealthStatus;
  };
  spO2: {
    value: number;
    status: HealthStatus;
  };
  pulse: {
    value: number;
    status: HealthStatus;
  };
  respiratoryRate: {
    value: number;
    status: HealthStatus;
  };
  temperature: {
    value: number;
    status: HealthStatus;
  };
  weight?: {
    value: number;
    unit: 'kg';
    status: HealthStatus;
  };
  bloodGlucose?: {
    value: number;
    unit: 'mmol/L';
    status: HealthStatus;
    testType: 'fasting' | 'random' | 'post_meal';
  };
  lastRecorded: string;
  recordedBy: string;
  notes?: string;
}

export interface Medication {
  id: string;
  elderlyId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface MedicationSchedule {
  id: string;
  elderlyId: string;
  medicationId: string;
  scheduledTime: string;
  taken: boolean;
  takenAt?: string;
  takenBy?: string;
  skipped: boolean;
  skipReason?: string;
  date: string;
}

export interface Appointment {
  id: string;
  elderlyId: string;
  doctorName: string;
  clinic: string;
  appointmentType: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  followUpRequired?: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string; // Anak lelaki, Anak perempuan, Menantu, etc.
  phone: string;
  email: string;
  role: 'primary_caregiver' | 'family_member';
  isActive: boolean;
  lastActive: string;
}

export interface CareNote {
  id: string;
  elderlyId: string;
  authorId: string;
  authorName: string;
  content: string;
  category: 'general' | 'health' | 'medication' | 'appointment' | 'emergency' | 'daily_care' | 'behavior';
  dateCreated: string;
  isImportant: boolean;
}

export interface HealthAlert {
  id: string;
  elderlyId: string;
  type: 'red' | 'yellow' | 'green';
  title: string;
  message: string;
  dateCreated: string;
  isRead: boolean;
  actionRequired: boolean;
}

export type HealthStatus = 'normal' | 'concerning' | 'critical';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'elderly' | 'not elderly';
  familyId: string;
  avatar?: string;
  isActive: boolean;
  preferredLanguage: 'en' | 'ms';
  dateJoined: string;
}