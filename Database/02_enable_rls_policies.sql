-- =====================================================
-- NELY MVP - Row Level Security (RLS) Policies
-- Version: 1.0.0
-- Purpose: Enforce family-based data isolation and role permissions
-- Created: 2025-10-02
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_family_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderly_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FAMILY GROUPS POLICIES
-- =====================================================

-- Users can view their own family group
CREATE POLICY "Users can view their own family group"
ON family_groups FOR SELECT
USING (
    id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Users can view family groups when joining (for validation)
CREATE POLICY "Users can view family groups by code when joining"
ON family_groups FOR SELECT
USING (true); -- Allow reading for code validation, actual joining is controlled by functions

-- Users can create family groups
CREATE POLICY "Users can create family groups"
ON family_groups FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Only creators or admins can update family groups
CREATE POLICY "Family admins can update family groups"
ON family_groups FOR UPDATE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_groups.id
        AND role = 'admin'
        AND is_active = true
    )
);

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Users can view family members' profiles
CREATE POLICY "Users can view family members"
ON users FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can create own profile"
ON users FOR INSERT
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- USER FAMILY ROLES POLICIES
-- =====================================================

-- Users can view roles in their family
CREATE POLICY "Users can view roles in their family"
ON user_family_roles FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Only admins can assign/update roles
CREATE POLICY "Admins can manage roles"
ON user_family_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles AS ufr
        WHERE ufr.user_id = auth.uid()
        AND ufr.family_id = user_family_roles.family_id
        AND ufr.role = 'admin'
        AND ufr.is_active = true
    )
);

-- System can insert roles (for auto-assignment during registration)
CREATE POLICY "System can insert roles for new users"
ON user_family_roles FOR INSERT
WITH CHECK (true); -- Controlled by database functions

-- =====================================================
-- ELDERLY PROFILES POLICIES
-- =====================================================

-- Users can view elderly profiles in their family
CREATE POLICY "Users can view elderly profiles in their family"
ON elderly_profiles FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Admins and carers can create elderly profiles
CREATE POLICY "Admins and carers can create elderly profiles"
ON elderly_profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = elderly_profiles.family_id
        AND role IN ('admin', 'carer')
        AND is_active = true
    )
);

-- Admins and carers can update elderly profiles
CREATE POLICY "Admins and carers can update elderly profiles"
ON elderly_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = elderly_profiles.family_id
        AND role IN ('admin', 'carer')
        AND is_active = true
    )
);

-- Only admins can delete elderly profiles
CREATE POLICY "Admins can delete elderly profiles"
ON elderly_profiles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = elderly_profiles.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- =====================================================
-- VITAL SIGNS POLICIES
-- =====================================================

-- All family members can view vital signs
CREATE POLICY "Family members can view vital signs"
ON vital_signs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN users u ON u.family_id = ep.family_id
        WHERE ep.id = vital_signs.elderly_id
        AND u.id = auth.uid()
    )
);

-- Non-viewers can record vital signs (admins and carers)
CREATE POLICY "Admins and carers can record vital signs"
ON vital_signs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = vital_signs.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Admins can update vital signs
CREATE POLICY "Admins can update vital signs"
ON vital_signs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = vital_signs.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role = 'admin'
        AND ufr.is_active = true
    )
);

-- Only admins can delete vital signs
CREATE POLICY "Admins can delete vital signs"
ON vital_signs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = vital_signs.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role = 'admin'
        AND ufr.is_active = true
    )
);

-- =====================================================
-- MEDICATIONS POLICIES
-- =====================================================

-- All family members can view medications
CREATE POLICY "Family members can view medications"
ON medications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN users u ON u.family_id = ep.family_id
        WHERE ep.id = medications.elderly_id
        AND u.id = auth.uid()
    )
);

-- Admins and carers can add medications
CREATE POLICY "Admins and carers can add medications"
ON medications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = medications.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Admins and carers can update medications
CREATE POLICY "Admins and carers can update medications"
ON medications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = medications.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Only admins can delete medications
CREATE POLICY "Admins can delete medications"
ON medications FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = medications.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role = 'admin'
        AND ufr.is_active = true
    )
);

-- =====================================================
-- MEDICATION SCHEDULES POLICIES
-- =====================================================

-- All family members can view medication schedules
CREATE POLICY "Family members can view medication schedules"
ON medication_schedules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN users u ON u.family_id = ep.family_id
        WHERE ep.id = medication_schedules.elderly_id
        AND u.id = auth.uid()
    )
);

-- Non-viewers can record medication taken
CREATE POLICY "Admins and carers can record medication taken"
ON medication_schedules FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = medication_schedules.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Allow upserts for medication schedules
CREATE POLICY "Admins and carers can update medication schedules"
ON medication_schedules FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = medication_schedules.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- =====================================================
-- APPOINTMENTS POLICIES
-- =====================================================

-- All family members can view appointments
CREATE POLICY "Family members can view appointments"
ON appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN users u ON u.family_id = ep.family_id
        WHERE ep.id = appointments.elderly_id
        AND u.id = auth.uid()
    )
);

-- Admins and carers can add appointments
CREATE POLICY "Admins and carers can add appointments"
ON appointments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = appointments.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Admins and carers can update appointments
CREATE POLICY "Admins and carers can update appointments"
ON appointments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = appointments.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Only admins can delete appointments
CREATE POLICY "Admins can delete appointments"
ON appointments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = appointments.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role = 'admin'
        AND ufr.is_active = true
    )
);

-- =====================================================
-- APPOINTMENT OUTCOMES POLICIES
-- =====================================================

-- All family members can view appointment outcomes
CREATE POLICY "Family members can view appointment outcomes"
ON appointment_outcomes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN users u ON u.family_id = ep.family_id
        WHERE ep.id = appointment_outcomes.elderly_id
        AND u.id = auth.uid()
    )
);

-- Admins and carers can create appointment outcomes
CREATE POLICY "Admins and carers can create appointment outcomes"
ON appointment_outcomes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = appointment_outcomes.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Admins and carers can update appointment outcomes
CREATE POLICY "Admins and carers can update appointment outcomes"
ON appointment_outcomes FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = appointment_outcomes.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- =====================================================
-- CARE NOTES POLICIES
-- =====================================================

-- All family members can view care notes
CREATE POLICY "Family members can view care notes"
ON care_notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN users u ON u.family_id = ep.family_id
        WHERE ep.id = care_notes.elderly_id
        AND u.id = auth.uid()
    )
);

-- Admins and carers can create care notes
CREATE POLICY "Admins and carers can create care notes"
ON care_notes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = care_notes.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role IN ('admin', 'carer')
        AND ufr.is_active = true
    )
);

-- Authors can update their own care notes
CREATE POLICY "Authors can update their own care notes"
ON care_notes FOR UPDATE
USING (author_id = auth.uid());

-- Admins can delete any care note in their family
CREATE POLICY "Admins can delete care notes"
ON care_notes FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM elderly_profiles ep
        JOIN user_family_roles ufr ON ufr.family_id = ep.family_id
        WHERE ep.id = care_notes.elderly_id
        AND ufr.user_id = auth.uid()
        AND ufr.role = 'admin'
        AND ufr.is_active = true
    )
);

-- =====================================================
-- FAMILY JOIN REQUESTS POLICIES
-- =====================================================

-- Users can view their own join requests
CREATE POLICY "Users can view their own join requests"
ON family_join_requests FOR SELECT
USING (user_id = auth.uid());

-- Family admins can view join requests for their family
CREATE POLICY "Admins can view join requests for their family"
ON family_join_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_join_requests.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- Users can create join requests (controlled by function)
CREATE POLICY "Users can create join requests"
ON family_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update join requests (approve/reject)
CREATE POLICY "Admins can update join requests"
ON family_join_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_join_requests.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- =====================================================
-- FAMILY INVITATIONS POLICIES
-- =====================================================

-- Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to them"
ON family_invitations FOR SELECT
USING (
    invitee_email = (SELECT email FROM users WHERE id = auth.uid())
);

-- Family admins can view all invitations for their family
CREATE POLICY "Admins can view family invitations"
ON family_invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_invitations.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON family_invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_invitations.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- Admins can update invitations
CREATE POLICY "Admins can update invitations"
ON family_invitations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_invitations.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- =====================================================
-- FAMILY MEMBERS POLICIES (Legacy)
-- =====================================================

-- Users can view family members in their family
CREATE POLICY "Users can view family members"
ON family_members FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Admins can manage family members
CREATE POLICY "Admins can manage family members"
ON family_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = auth.uid()
        AND family_id = family_members.family_id
        AND role = 'admin'
        AND is_active = true
    )
);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- Note: Some operations require bypassing RLS temporarily
-- These are handled by SECURITY DEFINER functions in the next migration
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF RLS POLICIES MIGRATION
-- =====================================================
