-- Nely MVP Database Schema
-- Migration 01: Create Tables
-- For Supabase Web SQL Editor
-- Current App Functionality Only

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Family Groups Table
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_code TEXT UNIQUE NOT NULL CHECK (length(family_code) = 6),
  family_name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Elderly Profiles Table
CREATE TABLE elderly_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  relationship TEXT NOT NULL,
  care_level TEXT NOT NULL CHECK (care_level IN ('independent', 'dependent', 'bedridden')),
  conditions TEXT[] DEFAULT '{}',
  emergency_contact TEXT,
  avatar TEXT,
  date_created TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES family_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('elderly', 'caregiver')),
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ms')),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  date_joined TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Family Members Table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('primary_caregiver', 'family_member')),
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vital Signs Table
CREATE TABLE vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  systolic INTEGER CHECK (systolic > 0 AND systolic < 300),
  diastolic INTEGER CHECK (diastolic > 0 AND diastolic < 200),
  spo2 INTEGER CHECK (spo2 > 0 AND spo2 <= 100),
  pulse INTEGER CHECK (pulse > 0 AND pulse < 300),
  temperature DECIMAL(4,1) CHECK (temperature > 30 AND temperature < 50),
  weight DECIMAL(5,1) CHECK (weight > 0 AND weight < 500),
  blood_glucose DECIMAL(5,1) CHECK (blood_glucose > 0 AND blood_glucose < 50),
  blood_glucose_type TEXT CHECK (blood_glucose_type IN ('fasting', 'random', 'post_meal')),
  recorded_by TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 6. Medications Table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  instructions TEXT,
  prescribed_by TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medication Schedules Table
CREATE TABLE medication_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL,
  taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMPTZ,
  taken_by TEXT,
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  date DATE DEFAULT CURRENT_DATE
);

-- 8. Health Alerts Table
CREATE TABLE health_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('red', 'yellow', 'green')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  date_created TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  clinic TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Care Notes Table
CREATE TABLE care_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'health', 'medication', 'appointment', 'emergency')),
  is_important BOOLEAN DEFAULT false,
  date_created TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Family Invitations Table
CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL CHECK (length(invite_code) = 6),
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ms')),
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Notification Settings Table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  health_alerts BOOLEAN DEFAULT true,
  medication_reminders BOOLEAN DEFAULT true,
  appointment_reminders BOOLEAN DEFAULT true,
  family_updates BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_elderly_profiles_family ON elderly_profiles(family_id);
CREATE INDEX idx_vital_signs_elderly_date ON vital_signs(elderly_id, recorded_at DESC);
CREATE INDEX idx_medications_elderly_active ON medications(elderly_id, is_active);
CREATE INDEX idx_medication_schedules_date ON medication_schedules(elderly_id, date, scheduled_time);
CREATE INDEX idx_health_alerts_elderly_unread ON health_alerts(elderly_id, is_read, date_created DESC);
CREATE INDEX idx_appointments_elderly_date ON appointments(elderly_id, date, time);
CREATE INDEX idx_family_members_family_active ON family_members(family_id, is_active);
CREATE INDEX idx_care_notes_elderly_date ON care_notes(elderly_id, date_created DESC);
CREATE INDEX idx_family_invitations_code ON family_invitations(invite_code);
CREATE INDEX idx_family_invitations_status ON family_invitations(family_id, status, expires_at);

-- Create indexes for foreign keys to improve performance
CREATE INDEX idx_care_notes_author_id ON care_notes(author_id);
CREATE INDEX idx_family_groups_created_by ON family_groups(created_by);
CREATE INDEX idx_family_invitations_inviter_id ON family_invitations(inviter_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_medication_schedules_medication_id ON medication_schedules(medication_id);
CREATE INDEX idx_users_family_id ON users(family_id);

-- Add constraints for data integrity
ALTER TABLE medication_schedules ADD CONSTRAINT unique_medication_schedule UNIQUE (elderly_id, medication_id, date, scheduled_time);
ALTER TABLE user_preferences ADD CONSTRAINT unique_user_preferences UNIQUE (user_id);
ALTER TABLE notification_settings ADD CONSTRAINT unique_user_notifications UNIQUE (user_id);