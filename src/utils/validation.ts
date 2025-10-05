/**
 * Input validation utilities for Nely Healthcare App
 * Provides comprehensive validation for user inputs to ensure data integrity
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Vital Signs Validation
 */

export const validateBloodPressure = (systolic: number, diastolic: number): ValidationResult => {
  // Systolic: 70-250 mmHg, Diastolic: 40-150 mmHg
  if (systolic < 70 || systolic > 250) {
    return { isValid: false, error: 'Systolic pressure must be between 70-250 mmHg' };
  }
  if (diastolic < 40 || diastolic > 150) {
    return { isValid: false, error: 'Diastolic pressure must be between 40-150 mmHg' };
  }
  if (systolic <= diastolic) {
    return { isValid: false, error: 'Systolic must be higher than diastolic' };
  }
  return { isValid: true };
};

export const validateSpO2 = (spo2: number): ValidationResult => {
  // SpO2: 70-100%
  if (spo2 < 70 || spo2 > 100) {
    return { isValid: false, error: 'SpO2 must be between 70-100%' };
  }
  return { isValid: true };
};

export const validatePulse = (pulse: number): ValidationResult => {
  // Pulse: 30-250 bpm
  if (pulse < 30 || pulse > 250) {
    return { isValid: false, error: 'Pulse must be between 30-250 bpm' };
  }
  return { isValid: true };
};

export const validateTemperature = (temp: number, unit: 'celsius' | 'fahrenheit'): ValidationResult => {
  if (unit === 'celsius') {
    // 32-45°C
    if (temp < 32 || temp > 45) {
      return { isValid: false, error: 'Temperature must be between 32-45°C' };
    }
  } else {
    // 89.6-113°F
    if (temp < 89.6 || temp > 113) {
      return { isValid: false, error: 'Temperature must be between 89.6-113°F' };
    }
  }
  return { isValid: true };
};

export const validateWeight = (weight: number, unit: 'kg' | 'lbs'): ValidationResult => {
  if (unit === 'kg') {
    // 20-300 kg
    if (weight < 20 || weight > 300) {
      return { isValid: false, error: 'Weight must be between 20-300 kg' };
    }
  } else {
    // 44-660 lbs
    if (weight < 44 || weight > 660) {
      return { isValid: false, error: 'Weight must be between 44-660 lbs' };
    }
  }
  return { isValid: true };
};

export const validateBloodGlucose = (glucose: number, unit: 'mmol' | 'mg'): ValidationResult => {
  if (unit === 'mmol') {
    // 2.0-30.0 mmol/L
    if (glucose < 2.0 || glucose > 30.0) {
      return { isValid: false, error: 'Blood glucose must be between 2.0-30.0 mmol/L' };
    }
  } else {
    // 36-540 mg/dL
    if (glucose < 36 || glucose > 540) {
      return { isValid: false, error: 'Blood glucose must be between 36-540 mg/dL' };
    }
  }
  return { isValid: true };
};

/**
 * Text Input Validation
 */

export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Name cannot be empty' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }
  // Allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Email must be less than 255 characters' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  const trimmed = phone.trim();
  // Malaysian phone format: +60xxxxxxxxx or 01xxxxxxxx
  const phoneRegex = /^(\+?60|0)1[0-9]{8,9}$/;
  if (!phoneRegex.test(trimmed.replace(/[\s-]/g, ''))) {
    return { isValid: false, error: 'Invalid Malaysian phone number format' };
  }
  return { isValid: true };
};

export const validateAge = (age: number): ValidationResult => {
  if (!Number.isInteger(age)) {
    return { isValid: false, error: 'Age must be a whole number' };
  }
  if (age < 0 || age > 150) {
    return { isValid: false, error: 'Age must be between 0 and 150' };
  }
  return { isValid: true };
};

export const validateNotes = (notes: string): ValidationResult => {
  const trimmed = notes.trim();
  if (trimmed.length > 5000) {
    return { isValid: false, error: 'Notes must be less than 5000 characters' };
  }
  // Basic XSS prevention - reject if contains script tags or javascript:
  if (/<script|javascript:/i.test(trimmed)) {
    return { isValid: false, error: 'Notes contain invalid content' };
  }
  return { isValid: true };
};

/**
 * Medication Validation
 */

export const validateMedicationName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Medication name cannot be empty' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Medication name must be at least 2 characters' };
  }
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Medication name must be less than 200 characters' };
  }
  return { isValid: true };
};

export const validateDosage = (dosage: string): ValidationResult => {
  const trimmed = dosage.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Dosage cannot be empty' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Dosage must be less than 100 characters' };
  }
  // Allow numbers, spaces, mg, ml, g, tablets, etc.
  if (!/^[0-9.\s]+\s*(mg|ml|g|mcg|tablet|capsule|drop|spray|puff|unit|iu|cc)s?$/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid dosage format (e.g., "500 mg", "2 tablets")' };
  }
  return { isValid: true };
};

export const validateFrequency = (frequency: string): ValidationResult => {
  const validFrequencies = [
    'once daily',
    'twice daily',
    'three times daily',
    'four times daily',
    'every 4 hours',
    'every 6 hours',
    'every 8 hours',
    'every 12 hours',
    'as needed',
    'before meals',
    'after meals',
    'at bedtime',
  ];

  const trimmed = frequency.trim().toLowerCase();
  if (!validFrequencies.includes(trimmed)) {
    return { isValid: false, error: 'Please select a valid frequency' };
  }
  return { isValid: true };
};

/**
 * Date/Time Validation
 */

export const validateFutureDate = (date: Date): ValidationResult => {
  const now = new Date();
  if (date <= now) {
    return { isValid: false, error: 'Date must be in the future' };
  }
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  if (date > oneYearFromNow) {
    return { isValid: false, error: 'Date cannot be more than 1 year in the future' };
  }
  return { isValid: true };
};

export const validatePastDate = (date: Date): ValidationResult => {
  const now = new Date();
  if (date > now) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  if (date < oneYearAgo) {
    return { isValid: false, error: 'Date cannot be more than 1 year in the past' };
  }
  return { isValid: true };
};

/**
 * Sanitization helpers
 */

export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/<script.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const sanitizeNumber = (value: string): number | null => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};
