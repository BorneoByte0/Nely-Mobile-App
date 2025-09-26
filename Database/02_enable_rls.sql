-- Nely MVP Database Schema
-- Migration 02: Enable RLS and Create Policies
-- For Supabase Web SQL Editor
-- Avoids recursive policies and multiple permissive warnings

-- Enable RLS on all tables
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderly_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user's family_id (avoids recursive lookups)
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM users WHERE id = auth.uid();
$$;

-- Create function to check if user can access elderly profile
CREATE OR REPLACE FUNCTION can_access_elderly_profile(elderly_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM elderly_profiles ep
    WHERE ep.id = elderly_profile_id
    AND ep.family_id = get_user_family_id()
  );
$$;

-- Drop all existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own family group" ON family_groups;
DROP POLICY IF EXISTS "Users can update their own family group" ON family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;

DROP POLICY IF EXISTS "Users can view elderly profiles in their family" ON elderly_profiles;
DROP POLICY IF EXISTS "Users can manage elderly profiles in their family" ON elderly_profiles;
DROP POLICY IF EXISTS "Users can access elderly profiles in their family" ON elderly_profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

DROP POLICY IF EXISTS "Users can view family members in their group" ON family_members;
DROP POLICY IF EXISTS "Users can manage family members in their group" ON family_members;
DROP POLICY IF EXISTS "Users can access family members in their group" ON family_members;

DROP POLICY IF EXISTS "Users can view vital signs for their family elderly" ON vital_signs;
DROP POLICY IF EXISTS "Users can manage vital signs for their family elderly" ON vital_signs;
DROP POLICY IF EXISTS "Users can access vital signs for their family elderly" ON vital_signs;

DROP POLICY IF EXISTS "Users can view medications for their family elderly" ON medications;
DROP POLICY IF EXISTS "Users can manage medications for their family elderly" ON medications;
DROP POLICY IF EXISTS "Users can access medications for their family elderly" ON medications;

DROP POLICY IF EXISTS "Users can view medication schedules for their family elderly" ON medication_schedules;
DROP POLICY IF EXISTS "Users can manage medication schedules for their family elderly" ON medication_schedules;
DROP POLICY IF EXISTS "Users can access medication schedules for their family elderly" ON medication_schedules;

DROP POLICY IF EXISTS "Users can view health alerts for their family elderly" ON health_alerts;
DROP POLICY IF EXISTS "Users can manage health alerts for their family elderly" ON health_alerts;
DROP POLICY IF EXISTS "Users can access health alerts for their family elderly" ON health_alerts;

DROP POLICY IF EXISTS "Users can view appointments for their family elderly" ON appointments;
DROP POLICY IF EXISTS "Users can manage appointments for their family elderly" ON appointments;
DROP POLICY IF EXISTS "Users can access appointments for their family elderly" ON appointments;

DROP POLICY IF EXISTS "Users can view care notes for their family elderly" ON care_notes;
DROP POLICY IF EXISTS "Users can create care notes for their family elderly" ON care_notes;
DROP POLICY IF EXISTS "Users can update their own care notes" ON care_notes;
DROP POLICY IF EXISTS "Users can delete their own care notes" ON care_notes;

DROP POLICY IF EXISTS "Users can view invitations for their family" ON family_invitations;
DROP POLICY IF EXISTS "Users can create invitations for their family" ON family_invitations;
DROP POLICY IF EXISTS "Users can update invitations they created" ON family_invitations;
DROP POLICY IF EXISTS "Users can delete invitations they created" ON family_invitations;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can manage their own notification settings" ON notification_settings;

-- 1. Family Groups Policies
CREATE POLICY "Users can view their own family group"
  ON family_groups FOR SELECT
  TO authenticated
  USING (id = get_user_family_id());

CREATE POLICY "Users can update their own family group"
  ON family_groups FOR UPDATE
  TO authenticated
  USING (id = get_user_family_id());

CREATE POLICY "Users can create family groups"
  ON family_groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- 2. Elderly Profiles Policies
CREATE POLICY "Users can access elderly profiles in their family"
  ON elderly_profiles FOR ALL
  TO authenticated
  USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- 3. Users Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- 4. Family Members Policies
CREATE POLICY "Users can access family members in their group"
  ON family_members FOR ALL
  TO authenticated
  USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- 5. Vital Signs Policies
CREATE POLICY "Users can access vital signs for their family elderly"
  ON vital_signs FOR ALL
  TO authenticated
  USING (can_access_elderly_profile(elderly_id))
  WITH CHECK (can_access_elderly_profile(elderly_id));

-- 6. Medications Policies
CREATE POLICY "Users can access medications for their family elderly"
  ON medications FOR ALL
  TO authenticated
  USING (can_access_elderly_profile(elderly_id))
  WITH CHECK (can_access_elderly_profile(elderly_id));

-- 7. Medication Schedules Policies
CREATE POLICY "Users can access medication schedules for their family elderly"
  ON medication_schedules FOR ALL
  TO authenticated
  USING (can_access_elderly_profile(elderly_id))
  WITH CHECK (can_access_elderly_profile(elderly_id));

-- 8. Health Alerts Policies
CREATE POLICY "Users can access health alerts for their family elderly"
  ON health_alerts FOR ALL
  TO authenticated
  USING (can_access_elderly_profile(elderly_id))
  WITH CHECK (can_access_elderly_profile(elderly_id));

-- 9. Appointments Policies
CREATE POLICY "Users can access appointments for their family elderly"
  ON appointments FOR ALL
  TO authenticated
  USING (can_access_elderly_profile(elderly_id))
  WITH CHECK (can_access_elderly_profile(elderly_id));

-- 10. Care Notes Policies
CREATE POLICY "Users can view care notes for their family elderly"
  ON care_notes FOR SELECT
  TO authenticated
  USING (can_access_elderly_profile(elderly_id));

CREATE POLICY "Users can create care notes for their family elderly"
  ON care_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    can_access_elderly_profile(elderly_id) AND
    author_id = (select auth.uid())
  );

CREATE POLICY "Users can update their own care notes"
  ON care_notes FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Users can delete their own care notes"
  ON care_notes FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- 11. Family Invitations Policies
CREATE POLICY "Users can view invitations for their family"
  ON family_invitations FOR SELECT
  TO authenticated
  USING (family_id = get_user_family_id());

CREATE POLICY "Users can create invitations for their family"
  ON family_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = get_user_family_id() AND
    inviter_id = (select auth.uid())
  );

CREATE POLICY "Users can update invitations they created"
  ON family_invitations FOR UPDATE
  TO authenticated
  USING (inviter_id = (select auth.uid()))
  WITH CHECK (inviter_id = (select auth.uid()));

CREATE POLICY "Users can delete invitations they created"
  ON family_invitations FOR DELETE
  TO authenticated
  USING (inviter_id = (select auth.uid()));

-- 12. User Preferences Policies
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 13. Notification Settings Policies
CREATE POLICY "Users can manage their own notification settings"
  ON notification_settings FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));