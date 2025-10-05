-- =====================================================
-- NELY MVP - Core Database Schema Migration
-- Version: 1.0.0
-- Purpose: Core tables for family healthcare management
-- Created: 2025-10-02
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. FAMILY GROUPS TABLE
-- Purpose: Central family group management
-- =====================================================

CREATE TABLE family_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_name TEXT NOT NULL,
    family_code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL, -- References auth.users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- Constraints
    CONSTRAINT family_code_length CHECK (LENGTH(family_code) = 6),
    CONSTRAINT family_name_not_empty CHECK (LENGTH(TRIM(family_name)) > 0)
);

-- Family code generation function (called by trigger)
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM family_groups WHERE family_code = new_code) INTO code_exists;

        -- Exit loop if unique code found
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate family code
CREATE OR REPLACE FUNCTION generate_family_code_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.family_code := generate_family_code();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate family code
CREATE TRIGGER set_family_code_trigger
BEFORE INSERT ON family_groups
FOR EACH ROW
WHEN (NEW.family_code IS NULL OR NEW.family_code = '')
EXECUTE FUNCTION generate_family_code_trigger();

-- Indexes for family_groups
CREATE INDEX idx_family_groups_code ON family_groups(family_code) WHERE is_active = true;
CREATE INDEX idx_family_groups_created_by ON family_groups(created_by);

-- =====================================================
-- 2. USERS TABLE
-- Purpose: User profiles and authentication data
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY, -- References auth.users(id)
    family_id UUID REFERENCES family_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('elderly', 'not elderly')),
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ms')),
    avatar TEXT, -- URL or base64
    is_active BOOLEAN DEFAULT true,
    date_joined TIMESTAMPTZ DEFAULT NOW(),

    -- Notification settings
    push_token TEXT,
    notification_preferences JSONB DEFAULT '{
        "medicationReminders": true,
        "healthAlerts": true,
        "familyUpdates": true,
        "criticalOnly": false,
        "quietHours": {
            "enabled": false,
            "start": "22:00",
            "end": "07:00"
        }
    }'::jsonb,

    -- Constraints
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for users
CREATE INDEX idx_users_family_id ON users(family_id) WHERE family_id IS NOT NULL;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- =====================================================
-- 3. USER FAMILY ROLES TABLE
-- Purpose: Role-based access control within families
-- =====================================================

CREATE TABLE user_family_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth.users(id)
    family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'carer', 'family_viewer')),

    -- Cached user data for performance
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,

    -- Metadata
    assigned_by UUID, -- References auth.users(id)
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- Constraints
    UNIQUE(user_id, family_id),
    CONSTRAINT role_valid CHECK (role IN ('admin', 'carer', 'family_viewer'))
);

-- Indexes for user_family_roles
CREATE INDEX idx_user_family_roles_user ON user_family_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_user_family_roles_family ON user_family_roles(family_id) WHERE is_active = true;
CREATE INDEX idx_user_family_roles_role ON user_family_roles(role);

-- =====================================================
-- 4. ELDERLY PROFILES TABLE
-- Purpose: Detailed elderly person health profiles
-- =====================================================

CREATE TABLE elderly_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    relationship TEXT NOT NULL,
    care_level TEXT NOT NULL CHECK (care_level IN ('independent', 'dependent', 'bedridden')),
    conditions TEXT[] DEFAULT '{}', -- Array of medical conditions
    emergency_contact TEXT,
    emergency_contact_phone TEXT,
    avatar TEXT,

    -- Physical information
    weight NUMERIC(5,2), -- kg
    height NUMERIC(5,2), -- cm
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),

    -- Medical contacts
    doctor_name TEXT,
    clinic_name TEXT,

    -- Metadata
    date_created TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT age_valid CHECK (age > 0 AND age < 150),
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT weight_valid CHECK (weight IS NULL OR (weight > 0 AND weight <= 500)),
    CONSTRAINT height_valid CHECK (height IS NULL OR (height > 0 AND height <= 300))
);

-- Indexes for elderly_profiles
CREATE INDEX idx_elderly_profiles_family ON elderly_profiles(family_id);
CREATE INDEX idx_elderly_profiles_name ON elderly_profiles(name);

-- =====================================================
-- 5. VITAL SIGNS TABLE
-- Purpose: Time-series health vital recordings
-- =====================================================

CREATE TABLE vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,

    -- Vital measurements (nullable - not all vitals recorded each time)
    systolic INTEGER, -- Blood pressure
    diastolic INTEGER,
    spo2 INTEGER, -- Oxygen saturation
    pulse INTEGER, -- Heart rate
    temperature NUMERIC(4,2), -- Celsius
    weight NUMERIC(5,2), -- kg
    blood_glucose NUMERIC(5,2), -- mmol/L
    blood_glucose_type TEXT CHECK (blood_glucose_type IN ('fasting', 'random', 'post_meal')),

    -- Metadata
    recorded_by TEXT NOT NULL, -- User name who recorded
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,

    -- Constraints
    CONSTRAINT systolic_valid CHECK (systolic IS NULL OR (systolic >= 0 AND systolic <= 300)),
    CONSTRAINT diastolic_valid CHECK (diastolic IS NULL OR (diastolic >= 0 AND diastolic <= 200)),
    CONSTRAINT spo2_valid CHECK (spo2 IS NULL OR (spo2 >= 0 AND spo2 <= 100)),
    CONSTRAINT pulse_valid CHECK (pulse IS NULL OR (pulse >= 0 AND pulse <= 300)),
    CONSTRAINT temperature_valid CHECK (temperature IS NULL OR (temperature >= 30 AND temperature <= 50)),
    CONSTRAINT weight_vs_valid CHECK (weight IS NULL OR (weight > 0 AND weight <= 500)),
    CONSTRAINT blood_glucose_valid CHECK (blood_glucose IS NULL OR (blood_glucose >= 0 AND blood_glucose <= 50))
);

-- Indexes for vital_signs (optimized for time-series queries)
CREATE INDEX idx_vital_signs_elderly_date ON vital_signs(elderly_id, recorded_at DESC);
CREATE INDEX idx_vital_signs_recorded_at ON vital_signs(recorded_at DESC);

-- =====================================================
-- 6. MEDICATIONS TABLE
-- Purpose: Active and historical medication records
-- =====================================================

CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL, -- e.g., "5mg", "500mg"
    frequency TEXT NOT NULL, -- e.g., "Daily", "Twice daily"
    instructions TEXT,
    prescribed_by TEXT, -- Doctor name
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT dosage_not_empty CHECK (LENGTH(TRIM(dosage)) > 0),
    CONSTRAINT frequency_not_empty CHECK (LENGTH(TRIM(frequency)) > 0),
    CONSTRAINT date_range_valid CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes for medications
CREATE INDEX idx_medications_elderly_active ON medications(elderly_id) WHERE is_active = true;
CREATE INDEX idx_medications_elderly_all ON medications(elderly_id, created_at DESC);

-- =====================================================
-- 7. MEDICATION SCHEDULES TABLE
-- Purpose: Daily medication adherence tracking
-- =====================================================

CREATE TABLE medication_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    scheduled_time TIME NOT NULL,

    -- Adherence tracking
    taken BOOLEAN DEFAULT false,
    taken_at TIMESTAMPTZ,
    taken_by TEXT, -- User name who administered
    dosage_taken TEXT, -- Actual dosage if different

    -- Skip tracking
    skipped BOOLEAN DEFAULT false,
    skip_reason TEXT,

    notes TEXT,

    -- Constraints
    UNIQUE(elderly_id, medication_id, date, scheduled_time),
    CONSTRAINT taken_fields_consistent CHECK (
        (taken = false AND taken_at IS NULL AND taken_by IS NULL) OR
        (taken = true AND taken_at IS NOT NULL AND taken_by IS NOT NULL)
    )
);

-- Indexes for medication_schedules
CREATE INDEX idx_medication_schedules_date ON medication_schedules(date DESC, scheduled_time);
CREATE INDEX idx_medication_schedules_elderly ON medication_schedules(elderly_id, date DESC);
CREATE INDEX idx_medication_schedules_medication ON medication_schedules(medication_id, date DESC);

-- =====================================================
-- 8. APPOINTMENTS TABLE
-- Purpose: Medical appointment scheduling and tracking
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    clinic TEXT NOT NULL,
    appointment_type TEXT, -- e.g., 'Follow-up', 'Routine', 'Emergency'
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT doctor_name_not_empty CHECK (LENGTH(TRIM(doctor_name)) > 0),
    CONSTRAINT clinic_not_empty CHECK (LENGTH(TRIM(clinic)) > 0)
);

-- Indexes for appointments
CREATE INDEX idx_appointments_elderly_date ON appointments(elderly_id, date, time);
CREATE INDEX idx_appointments_status ON appointments(status, date) WHERE status = 'upcoming';

-- =====================================================
-- 9. APPOINTMENT OUTCOMES TABLE
-- Purpose: Detailed post-appointment records
-- =====================================================

CREATE TABLE appointment_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,

    -- Clinical information
    diagnosis TEXT NOT NULL,
    doctor_notes TEXT NOT NULL,
    test_results TEXT,
    vital_signs_recorded JSONB, -- Store vital signs from appointment

    -- Medication updates
    new_medications TEXT,
    medication_changes TEXT,
    prescriptions TEXT,

    -- Follow-up
    recommendations TEXT,
    follow_up_instructions TEXT,
    next_appointment_recommended BOOLEAN DEFAULT false,
    next_appointment_timeframe TEXT,
    referrals TEXT,

    -- Metadata
    outcome_recorded_by TEXT NOT NULL, -- User name
    outcome_recorded_at TIMESTAMPTZ DEFAULT NOW(),
    appointment_duration_minutes INTEGER,
    patient_satisfaction_rating INTEGER CHECK (patient_satisfaction_rating >= 1 AND patient_satisfaction_rating <= 5),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT diagnosis_not_empty CHECK (LENGTH(TRIM(diagnosis)) > 0),
    CONSTRAINT doctor_notes_not_empty CHECK (LENGTH(TRIM(doctor_notes)) > 0)
);

-- Indexes for appointment_outcomes
CREATE INDEX idx_appointment_outcomes_elderly ON appointment_outcomes(elderly_id, outcome_recorded_at DESC);
CREATE INDEX idx_appointment_outcomes_appointment ON appointment_outcomes(appointment_id);

-- =====================================================
-- 10. CARE NOTES TABLE
-- Purpose: Family communication and observations
-- =====================================================

CREATE TABLE care_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL, -- References auth.users(id)
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('general', 'health', 'medication', 'appointment', 'emergency', 'daily_care', 'behavior')),
    is_important BOOLEAN DEFAULT false,
    date_created TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Indexes for care_notes
CREATE INDEX idx_care_notes_elderly_date ON care_notes(elderly_id, date_created DESC);
CREATE INDEX idx_care_notes_author ON care_notes(author_id);
CREATE INDEX idx_care_notes_important ON care_notes(is_important, date_created DESC) WHERE is_important = true;
CREATE INDEX idx_care_notes_category ON care_notes(category, date_created DESC);

-- =====================================================
-- 11. FAMILY JOIN REQUESTS TABLE
-- Purpose: Manage family join request workflow
-- =====================================================

CREATE TABLE family_join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    family_code TEXT NOT NULL,

    -- Requester information (cached for performance)
    user_id UUID NOT NULL, -- References auth.users(id)
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,

    -- Request details
    request_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    -- Review information
    reviewed_by UUID, -- References auth.users(id)
    reviewed_at TIMESTAMPTZ,
    review_message TEXT,

    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

    -- Constraints
    CONSTRAINT user_not_empty CHECK (LENGTH(TRIM(user_name)) > 0),
    CONSTRAINT status_transition_valid CHECK (
        (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    )
);

-- Indexes for family_join_requests
CREATE INDEX idx_join_requests_family_pending ON family_join_requests(family_id, status) WHERE status = 'pending';
CREATE INDEX idx_join_requests_user ON family_join_requests(user_id, requested_at DESC);
CREATE INDEX idx_join_requests_status ON family_join_requests(status, requested_at DESC);

-- =====================================================
-- 12. FAMILY INVITATIONS TABLE (Legacy/Alternative)
-- Purpose: Admin-initiated family invitations
-- =====================================================

CREATE TABLE family_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL, -- References auth.users(id)
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    role TEXT DEFAULT 'family_viewer' CHECK (role IN ('admin', 'carer', 'family_viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT email_format_inv CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for family_invitations
CREATE INDEX idx_invitations_family ON family_invitations(family_id, status);
CREATE INDEX idx_invitations_email ON family_invitations(invitee_email, status);

-- =====================================================
-- 13. FAMILY MEMBERS TABLE (Legacy - may be deprecated)
-- Purpose: Alternative family member tracking
-- =====================================================

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id)
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'family_member',
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT fm_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for family_members
CREATE INDEX idx_family_members_family ON family_members(family_id) WHERE is_active = true;
CREATE INDEX idx_family_members_user ON family_members(user_id);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE family_groups IS 'Central family group management with unique 6-character codes';
COMMENT ON TABLE users IS 'User profiles with authentication data and notification preferences';
COMMENT ON TABLE user_family_roles IS 'Role-based access control within families (admin, carer, family_viewer)';
COMMENT ON TABLE elderly_profiles IS 'Detailed elderly person health profiles with medical information';
COMMENT ON TABLE vital_signs IS 'Time-series health vital sign recordings';
COMMENT ON TABLE medications IS 'Active and historical medication records';
COMMENT ON TABLE medication_schedules IS 'Daily medication adherence tracking with who/when details';
COMMENT ON TABLE appointments IS 'Medical appointment scheduling and status tracking';
COMMENT ON TABLE appointment_outcomes IS 'Detailed post-appointment clinical records';
COMMENT ON TABLE care_notes IS 'Family communication, observations, and care coordination';
COMMENT ON TABLE family_join_requests IS 'Join request workflow with approval/rejection';
COMMENT ON TABLE family_invitations IS 'Admin-initiated family invitations (alternative flow)';
COMMENT ON TABLE family_members IS 'Family member tracking (legacy table)';

-- =====================================================
-- END OF CORE TABLES MIGRATION
-- =====================================================
