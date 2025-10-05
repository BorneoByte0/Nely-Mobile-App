-- =====================================================
-- NELY MVP - Performance Indexes (FIXED)
-- Version: 1.0.1
-- Purpose: Optimize query performance for common access patterns
-- Created: 2025-10-02
-- Fixed: Removed non-immutable functions from index predicates
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable pg_trgm extension for full-text search (optional but recommended)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- NOTE: Many indexes are already created in 01_create_core_tables.sql
-- This file contains additional composite and covering indexes for optimization
-- =====================================================

-- =====================================================
-- 1. FAMILY GROUPS - ADDITIONAL INDEXES
-- =====================================================

-- Index for active families lookup by creator
CREATE INDEX IF NOT EXISTS idx_family_groups_creator_active
ON family_groups(created_by, is_active)
WHERE is_active = true;

-- =====================================================
-- 2. USERS - ADDITIONAL INDEXES
-- =====================================================

-- Composite index for family + active status lookups
CREATE INDEX IF NOT EXISTS idx_users_family_active
ON users(family_id, is_active)
WHERE family_id IS NOT NULL AND is_active = true;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role) WHERE role = 'elderly';

-- Index for language preference
CREATE INDEX IF NOT EXISTS idx_users_language
ON users(preferred_language);

-- =====================================================
-- 3. USER FAMILY ROLES - ADDITIONAL INDEXES
-- =====================================================

-- Composite index for role + family queries
CREATE INDEX IF NOT EXISTS idx_ufr_family_role_active
ON user_family_roles(family_id, role, is_active)
WHERE is_active = true;

-- Index for admin role lookups
CREATE INDEX IF NOT EXISTS idx_ufr_admin_lookups
ON user_family_roles(family_id, user_id)
WHERE role = 'admin' AND is_active = true;

-- =====================================================
-- 4. ELDERLY PROFILES - ADDITIONAL INDEXES
-- =====================================================

-- Index for care level queries
CREATE INDEX IF NOT EXISTS idx_elderly_care_level
ON elderly_profiles(family_id, care_level);

-- Index for age-based queries
CREATE INDEX IF NOT EXISTS idx_elderly_age
ON elderly_profiles(age) WHERE age >= 60;

-- Full-text search index on name (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_elderly_name_trgm
ON elderly_profiles USING gin(name gin_trgm_ops);

-- =====================================================
-- 5. VITAL SIGNS - ADDITIONAL INDEXES
-- =====================================================

-- Composite index for critical vital queries
CREATE INDEX IF NOT EXISTS idx_vital_signs_elderly_critical
ON vital_signs(elderly_id, recorded_at DESC)
WHERE (
    systolic >= 180 OR diastolic >= 110 OR  -- Critical BP
    spo2 < 88 OR                            -- Critical SpO2
    pulse < 50 OR pulse > 120 OR            -- Critical pulse
    temperature >= 39.5 OR temperature <= 35.0 OR  -- Critical temp
    blood_glucose >= 15.0 OR blood_glucose < 3.0   -- Critical glucose
);

-- Index for recent vitals - removed date filter (not immutable)
-- Query should filter by date instead: WHERE recorded_at >= CURRENT_DATE - INTERVAL '7 days'
CREATE INDEX IF NOT EXISTS idx_vital_signs_recent
ON vital_signs(elderly_id, recorded_at DESC);

-- Index for blood pressure queries
CREATE INDEX IF NOT EXISTS idx_vital_signs_bp
ON vital_signs(elderly_id, recorded_at DESC)
WHERE systolic IS NOT NULL AND diastolic IS NOT NULL;

-- Index for blood glucose queries
CREATE INDEX IF NOT EXISTS idx_vital_signs_glucose
ON vital_signs(elderly_id, recorded_at DESC, blood_glucose_type)
WHERE blood_glucose IS NOT NULL;

-- =====================================================
-- 6. MEDICATIONS - ADDITIONAL INDEXES
-- =====================================================

-- Composite index for active medications with dates
CREATE INDEX IF NOT EXISTS idx_medications_active_dates
ON medications(elderly_id, start_date DESC, end_date)
WHERE is_active = true;

-- Full-text search on medication names (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_medications_name_trgm
ON medications USING gin(name gin_trgm_ops);

-- Index for expiring medications
CREATE INDEX IF NOT EXISTS idx_medications_expiring
ON medications(elderly_id, end_date)
WHERE is_active = true AND end_date IS NOT NULL;

-- =====================================================
-- 7. MEDICATION SCHEDULES - ADDITIONAL INDEXES
-- =====================================================

-- Index for medication schedules - removed CURRENT_DATE filter
-- Query should filter by date instead: WHERE date = CURRENT_DATE
CREATE INDEX IF NOT EXISTS idx_med_schedules_today
ON medication_schedules(elderly_id, date, scheduled_time, taken);

-- Index for missed medications - removed date comparison
-- Query should filter: WHERE taken = false AND skipped = false AND date < CURRENT_DATE
CREATE INDEX IF NOT EXISTS idx_med_schedules_missed
ON medication_schedules(elderly_id, date DESC, scheduled_time)
WHERE taken = false AND skipped = false;

-- Index for adherence reporting
CREATE INDEX IF NOT EXISTS idx_med_schedules_adherence
ON medication_schedules(elderly_id, date DESC, taken);

-- Composite index for medication history
CREATE INDEX IF NOT EXISTS idx_med_schedules_history
ON medication_schedules(medication_id, date DESC, taken_at DESC)
WHERE taken = true;

-- =====================================================
-- 8. APPOINTMENTS - ADDITIONAL INDEXES
-- =====================================================

-- Index for upcoming appointments - removed date comparison
-- Query should filter: WHERE status = 'upcoming' AND date >= CURRENT_DATE
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming
ON appointments(elderly_id, date, time, status)
WHERE status = 'upcoming';

-- Index for appointment type analytics
CREATE INDEX IF NOT EXISTS idx_appointments_type
ON appointments(elderly_id, appointment_type, date DESC);

-- Index for follow-up required
CREATE INDEX IF NOT EXISTS idx_appointments_followup
ON appointments(elderly_id, date DESC)
WHERE follow_up_required = true;

-- Composite index for completed appointments
CREATE INDEX IF NOT EXISTS idx_appointments_completed
ON appointments(elderly_id, date DESC)
WHERE status = 'completed';

-- =====================================================
-- 9. APPOINTMENT OUTCOMES - ADDITIONAL INDEXES
-- =====================================================

-- Index for recent outcomes - removed date filter
-- Query should filter: WHERE outcome_recorded_at >= CURRENT_DATE - INTERVAL '30 days'
CREATE INDEX IF NOT EXISTS idx_outcomes_recent
ON appointment_outcomes(elderly_id, outcome_recorded_at DESC);

-- Index for outcomes requiring follow-up
CREATE INDEX IF NOT EXISTS idx_outcomes_followup
ON appointment_outcomes(elderly_id, outcome_recorded_at DESC)
WHERE next_appointment_recommended = true;

-- Full-text search on diagnosis (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_outcomes_diagnosis_trgm
ON appointment_outcomes USING gin(diagnosis gin_trgm_ops);

-- =====================================================
-- 10. CARE NOTES - ADDITIONAL INDEXES
-- =====================================================

-- Composite index for recent notes by category
CREATE INDEX IF NOT EXISTS idx_care_notes_cat_recent
ON care_notes(elderly_id, category, date_created DESC);

-- Index for emergency notes
CREATE INDEX IF NOT EXISTS idx_care_notes_emergency
ON care_notes(elderly_id, date_created DESC)
WHERE category = 'emergency';

-- Full-text search on content (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_care_notes_content_trgm
ON care_notes USING gin(content gin_trgm_ops);

-- Index for important notes by author
CREATE INDEX IF NOT EXISTS idx_care_notes_important_author
ON care_notes(author_id, date_created DESC)
WHERE is_important = true;

-- =====================================================
-- 11. FAMILY JOIN REQUESTS - ADDITIONAL INDEXES
-- =====================================================

-- Index for pending requests by family
CREATE INDEX IF NOT EXISTS idx_join_requests_family_pending_date
ON family_join_requests(family_id, requested_at DESC)
WHERE status = 'pending';

-- Index for user's request history
CREATE INDEX IF NOT EXISTS idx_join_requests_user_history
ON family_join_requests(user_id, status, requested_at DESC);

-- Index for expired requests - removed NOW() comparison
-- Query should filter: WHERE status = 'pending' AND expires_at < NOW()
CREATE INDEX IF NOT EXISTS idx_join_requests_expired
ON family_join_requests(expires_at, status)
WHERE status = 'pending';

-- =====================================================
-- 12. FAMILY INVITATIONS - ADDITIONAL INDEXES
-- =====================================================

-- Index for active invitations - removed NOW() comparison
-- Query should filter: WHERE status = 'pending' AND expires_at > NOW()
CREATE INDEX IF NOT EXISTS idx_invitations_active
ON family_invitations(family_id, status, created_at DESC, expires_at)
WHERE status = 'pending';

-- Index for invitee lookups
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_pending
ON family_invitations(invitee_email, status)
WHERE status = 'pending';

-- Index for expired invitations - removed NOW() comparison
-- Query should filter: WHERE status = 'pending' AND expires_at < NOW()
CREATE INDEX IF NOT EXISTS idx_invitations_expired
ON family_invitations(expires_at, status)
WHERE status = 'pending';

-- =====================================================
-- 13. FAMILY MEMBERS - ADDITIONAL INDEXES
-- =====================================================

-- Composite index for active members
CREATE INDEX IF NOT EXISTS idx_family_members_active_name
ON family_members(family_id, name)
WHERE is_active = true;

-- Index for user-to-family mapping
CREATE INDEX IF NOT EXISTS idx_family_members_user_family
ON family_members(user_id, family_id)
WHERE user_id IS NOT NULL;

-- =====================================================
-- 14. COVERING INDEXES FOR COMMON QUERIES
-- Purpose: Include frequently accessed columns to avoid table lookups
-- =====================================================

-- Covering index for medication list view
CREATE INDEX IF NOT EXISTS idx_medications_list_covering
ON medications(elderly_id, is_active, name, dosage, frequency, start_date)
WHERE is_active = true;

-- Covering index for vital signs chart
CREATE INDEX IF NOT EXISTS idx_vital_signs_chart_covering
ON vital_signs(elderly_id, recorded_at DESC)
INCLUDE (systolic, diastolic, spo2, pulse, temperature, blood_glucose);

-- Covering index for appointment list
CREATE INDEX IF NOT EXISTS idx_appointments_list_covering
ON appointments(elderly_id, date, time, status)
INCLUDE (doctor_name, clinic, appointment_type)
WHERE status = 'upcoming';

-- =====================================================
-- 15. STATISTICS AND MAINTENANCE
-- =====================================================

-- Update table statistics for query planner
ANALYZE family_groups;
ANALYZE users;
ANALYZE user_family_roles;
ANALYZE elderly_profiles;
ANALYZE vital_signs;
ANALYZE medications;
ANALYZE medication_schedules;
ANALYZE appointments;
ANALYZE appointment_outcomes;
ANALYZE care_notes;
ANALYZE family_join_requests;
ANALYZE family_invitations;
ANALYZE family_members;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON INDEX idx_vital_signs_elderly_critical IS 'Optimizes queries for critical vital signs requiring immediate attention';
COMMENT ON INDEX idx_med_schedules_missed IS 'Identifies missed medications - filter by date in query: date < CURRENT_DATE';
COMMENT ON INDEX idx_appointments_upcoming IS 'Optimizes upcoming appointments - filter by date in query: date >= CURRENT_DATE';
COMMENT ON INDEX idx_care_notes_emergency IS 'Fast access to emergency care notes for critical situations';
COMMENT ON INDEX idx_medications_expiring IS 'Identifies medications nearing end date for renewal reminders';

-- =====================================================
-- NOTES ON DATE FILTERING
-- =====================================================

-- Several indexes had date-based filters removed because CURRENT_DATE and NOW()
-- are not IMMUTABLE functions. Instead, add date filters in your queries:
--
-- For recent vitals:
--   WHERE recorded_at >= CURRENT_DATE - INTERVAL '7 days'
--
-- For today's medication schedule:
--   WHERE date = CURRENT_DATE
--
-- For missed medications:
--   WHERE taken = false AND skipped = false AND date < CURRENT_DATE
--
-- For upcoming appointments:
--   WHERE status = 'upcoming' AND date >= CURRENT_DATE
--
-- For expired requests:
--   WHERE status = 'pending' AND expires_at < NOW()
--
-- The indexes will still be used efficiently with these query-level filters.

-- =====================================================
-- END OF INDEXES MIGRATION
-- =====================================================
