-- Nely MVP Database Schema
-- Migration 08: Add Physical Information and Contact Fields to Elderly Profiles
-- For Supabase Web SQL Editor

-- Add physical information fields
ALTER TABLE elderly_profiles
ADD COLUMN weight DECIMAL(5,1) CHECK (weight > 0 AND weight < 500),
ADD COLUMN height INTEGER CHECK (height > 0 AND height < 300),
ADD COLUMN blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- Add contact and emergency fields
ALTER TABLE elderly_profiles
ADD COLUMN doctor_name TEXT,
ADD COLUMN clinic_name TEXT,
ADD COLUMN emergency_contact_phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN elderly_profiles.weight IS 'Weight in kilograms';
COMMENT ON COLUMN elderly_profiles.height IS 'Height in centimeters';
COMMENT ON COLUMN elderly_profiles.blood_type IS 'Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN elderly_profiles.doctor_name IS 'Primary doctor or physician name';
COMMENT ON COLUMN elderly_profiles.clinic_name IS 'Primary clinic or hospital name';
COMMENT ON COLUMN elderly_profiles.emergency_contact_phone IS 'Emergency contact phone number';