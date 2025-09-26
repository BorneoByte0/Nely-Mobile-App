-- Nely MVP Database Schema Enhancements
-- Migration 06: Schema Improvements Based on TypeScript Integration Analysis
-- Addresses gaps identified during Phase 2 database integration

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Add missing columns to appointments table for better tracking
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS completed_date DATE,
ADD COLUMN IF NOT EXISTS has_outcome BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 480),
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- 2. Add medication adherence tracking table for better medication management
CREATE TABLE IF NOT EXISTS medication_adherence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  actual_taken_at TIMESTAMPTZ,
  taken_by TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'taken', 'missed', 'skipped')),
  skip_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance vital_signs table with additional tracking fields
ALTER TABLE vital_signs
ADD COLUMN IF NOT EXISTS measurement_context TEXT CHECK (measurement_context IN ('routine', 'symptomatic', 'post_medication', 'emergency')),
ADD COLUMN IF NOT EXISTS device_used TEXT,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- 4. Add medication interaction and allergy tracking
CREATE TABLE IF NOT EXISTS medication_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  medication1_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  medication2_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('minor', 'moderate', 'major')),
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  allergy_type TEXT NOT NULL CHECK (allergy_type IN ('mild', 'moderate', 'severe')),
  symptoms TEXT NOT NULL,
  date_identified DATE DEFAULT CURRENT_DATE,
  identified_by TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enhanced family member permissions and roles
CREATE TABLE IF NOT EXISTS family_member_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  can_view_vitals BOOLEAN DEFAULT true,
  can_edit_vitals BOOLEAN DEFAULT false,
  can_view_medications BOOLEAN DEFAULT true,
  can_edit_medications BOOLEAN DEFAULT false,
  can_view_appointments BOOLEAN DEFAULT true,
  can_edit_appointments BOOLEAN DEFAULT false,
  can_view_notes BOOLEAN DEFAULT true,
  can_edit_notes BOOLEAN DEFAULT true,
  can_receive_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Health trends and analytics support
CREATE TABLE IF NOT EXISTS health_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'weight', 'blood_glucose', 'spo2', 'pulse', 'temperature')),
  trend_direction TEXT NOT NULL CHECK (trend_direction IN ('improving', 'stable', 'concerning', 'critical')),
  trend_period TEXT NOT NULL CHECK (trend_period IN ('7_days', '30_days', '90_days')),
  current_value DECIMAL(10,2),
  previous_value DECIMAL(10,2),
  percentage_change DECIMAL(5,2),
  analysis_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enhanced user activity tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notification_token TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- 8. Care plan and goals tracking
CREATE TABLE IF NOT EXISTS care_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS care_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_plan_id UUID REFERENCES care_plans(id) ON DELETE CASCADE,
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value TEXT,
  current_value TEXT,
  measurement_unit TEXT,
  target_date DATE,
  is_achieved BOOLEAN DEFAULT false,
  achieved_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Emergency contacts and procedures
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_medical BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  procedure_steps TEXT NOT NULL,
  emergency_medications TEXT,
  doctor_instructions TEXT,
  hospital_preference TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enhanced notification system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medication_reminder', 'appointment_reminder', 'health_alert', 'family_update', 'system_notification')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  action_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance indexes for new tables
CREATE INDEX IF NOT EXISTS idx_medication_adherence_elderly_date ON medication_adherence(elderly_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_medication_adherence_status ON medication_adherence(elderly_id, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_elderly ON medication_interactions(elderly_id, is_active);
CREATE INDEX IF NOT EXISTS idx_medication_allergies_elderly_active ON medication_allergies(elderly_id, is_active);
CREATE INDEX IF NOT EXISTS idx_family_member_permissions_member ON family_member_permissions(family_member_id, elderly_id);
CREATE INDEX IF NOT EXISTS idx_health_trends_elderly_metric ON health_trends(elderly_id, metric_type, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_care_plans_elderly_status ON care_plans(elderly_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_care_goals_plan ON care_goals(care_plan_id, is_achieved);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_elderly_primary ON emergency_contacts(elderly_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_emergency_procedures_elderly_active ON emergency_procedures(elderly_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for, is_sent);

-- Add constraints for data integrity
ALTER TABLE medication_adherence ADD CONSTRAINT IF NOT EXISTS unique_medication_adherence_schedule UNIQUE (elderly_id, medication_id, scheduled_date, scheduled_time);
ALTER TABLE medication_interactions ADD CONSTRAINT IF NOT EXISTS check_different_medications CHECK (medication1_id != medication2_id);
ALTER TABLE care_goals ADD CONSTRAINT IF NOT EXISTS valid_target_date CHECK (target_date IS NULL OR target_date >= CURRENT_DATE);
ALTER TABLE emergency_contacts ADD CONSTRAINT IF NOT EXISTS valid_phone_primary CHECK (length(phone_primary) >= 8);

-- Update existing tables with better data integrity
ALTER TABLE appointments ADD CONSTRAINT IF NOT EXISTS valid_completion_date CHECK (completed_date IS NULL OR completed_date >= date);
ALTER TABLE vital_signs ADD CONSTRAINT IF NOT EXISTS valid_recording_date CHECK (recorded_at <= NOW() + INTERVAL '1 hour');

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_medication_adherence_updated_at BEFORE UPDATE ON medication_adherence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_family_member_permissions_updated_at BEFORE UPDATE ON family_member_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_care_goals_updated_at BEFORE UPDATE ON care_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_emergency_procedures_updated_at BEFORE UPDATE ON emergency_procedures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE medication_adherence IS 'Tracks detailed medication taking records for better adherence monitoring';
COMMENT ON TABLE medication_interactions IS 'Stores potential medication interactions for safety checks';
COMMENT ON TABLE medication_allergies IS 'Records known medication allergies and adverse reactions';
COMMENT ON TABLE family_member_permissions IS 'Granular permissions for family members access to elderly data';
COMMENT ON TABLE health_trends IS 'Calculated health trends and analytics for insights';
COMMENT ON TABLE care_plans IS 'Structured care plans with goals and timelines';
COMMENT ON TABLE care_goals IS 'Specific measurable goals within care plans';
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts with detailed relationship information';
COMMENT ON TABLE emergency_procedures IS 'Condition-specific emergency procedures and instructions';
COMMENT ON TABLE notifications IS 'Enhanced notification system with scheduling and priority';