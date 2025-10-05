-- =====================================================
-- NELY MVP - Database Functions and Triggers
-- Version: 1.0.0
-- Purpose: Business logic, auto-assignment, and helper functions
-- Created: 2025-10-02
-- =====================================================

-- =====================================================
-- 1. AUTOMATIC ROLE ASSIGNMENT FUNCTION
-- Purpose: Auto-assign role when user joins/creates family
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_family_role(
    p_user_id UUID,
    p_family_id UUID,
    p_is_elderly BOOLEAN DEFAULT false,
    p_is_creator BOOLEAN DEFAULT false
)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
    v_user_name TEXT;
    v_user_email TEXT;
BEGIN
    -- Determine role based on context
    IF p_is_creator THEN
        v_role := 'admin';  -- Family creator is always admin
    ELSE
        v_role := 'family_viewer';  -- Joiners default to viewer
    END IF;

    -- Get user information
    SELECT name, email INTO v_user_name, v_user_email
    FROM users WHERE id = p_user_id;

    -- Insert role assignment
    INSERT INTO user_family_roles (
        user_id,
        family_id,
        role,
        user_name,
        user_email,
        assigned_by,
        is_active
    ) VALUES (
        p_user_id,
        p_family_id,
        v_role,
        v_user_name,
        v_user_email,
        p_user_id,  -- Self-assigned during creation/join
        true
    )
    ON CONFLICT (user_id, family_id) DO UPDATE
    SET role = v_role,
        user_name = v_user_name,
        user_email = v_user_email,
        is_active = true,
        assigned_at = NOW();

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE FAMILY JOIN REQUEST FUNCTION
-- Purpose: Validate and create join request
-- =====================================================

CREATE OR REPLACE FUNCTION create_family_join_request(
    p_family_code TEXT,
    p_request_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_user_email TEXT;
    v_family_id UUID;
    v_family_name TEXT;
    v_existing_request_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required'
        );
    END IF;

    -- Get user information
    SELECT name, email, family_id
    INTO v_user_name, v_user_email, v_family_id
    FROM users
    WHERE id = v_user_id;

    -- Check if user already belongs to a family
    IF v_family_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You are already a member of a family. Leave current family first.'
        );
    END IF;

    -- Validate family code and get family info
    SELECT id, family_name
    INTO v_family_id, v_family_name
    FROM family_groups
    WHERE family_code = p_family_code
    AND is_active = true;

    IF v_family_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid family code'
        );
    END IF;

    -- Check for existing pending request
    SELECT id INTO v_existing_request_id
    FROM family_join_requests
    WHERE user_id = v_user_id
    AND family_id = v_family_id
    AND status = 'pending';

    IF v_existing_request_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You already have a pending request for this family'
        );
    END IF;

    -- Create join request
    INSERT INTO family_join_requests (
        family_id,
        family_code,
        user_id,
        user_name,
        user_email,
        request_message,
        status
    ) VALUES (
        v_family_id,
        p_family_code,
        v_user_id,
        v_user_name,
        v_user_email,
        p_request_message,
        'pending'
    )
    RETURNING id INTO v_existing_request_id;

    RETURN json_build_object(
        'success', true,
        'request_id', v_existing_request_id,
        'family_name', v_family_name,
        'message', 'Join request submitted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. REVIEW FAMILY JOIN REQUEST FUNCTION
-- Purpose: Admin approve/reject join requests
-- =====================================================

CREATE OR REPLACE FUNCTION review_family_join_request(
    p_request_id UUID,
    p_action TEXT,  -- 'approve' or 'reject'
    p_review_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_reviewer_id UUID;
    v_request_record RECORD;
    v_is_admin BOOLEAN;
    v_assigned_role TEXT;
BEGIN
    -- Get current user (reviewer)
    v_reviewer_id := auth.uid();

    IF v_reviewer_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Authentication required'
        );
    END IF;

    -- Get join request details
    SELECT * INTO v_request_record
    FROM family_join_requests
    WHERE id = p_request_id
    AND status = 'pending';

    IF v_request_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Join request not found or already processed'
        );
    END IF;

    -- Verify reviewer is admin of the family
    SELECT EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = v_reviewer_id
        AND family_id = v_request_record.family_id
        AND role = 'admin'
        AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Only family admins can review join requests'
        );
    END IF;

    -- Process the action
    IF p_action = 'approve' THEN
        -- Update user's family_id
        UPDATE users
        SET family_id = v_request_record.family_id
        WHERE id = v_request_record.user_id;

        -- Auto-assign role (family_viewer for joiners)
        v_assigned_role := auto_assign_family_role(
            v_request_record.user_id,
            v_request_record.family_id,
            false,  -- is_elderly
            false   -- is_creator
        );

        -- Update request status
        UPDATE family_join_requests
        SET status = 'approved',
            reviewed_by = v_reviewer_id,
            reviewed_at = NOW(),
            review_message = p_review_message
        WHERE id = p_request_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Join request approved successfully',
            'assigned_role', v_assigned_role
        );

    ELSIF p_action = 'reject' THEN
        -- Update request status
        UPDATE family_join_requests
        SET status = 'rejected',
            reviewed_by = v_reviewer_id,
            reviewed_at = NOW(),
            review_message = p_review_message
        WHERE id = p_request_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Join request rejected'
        );

    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid action. Use "approve" or "reject"'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. GET USER FAMILY ROLE FUNCTION
-- Purpose: Bypass RLS to get user's role
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_family_role(
    p_user_id UUID,
    p_family_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM user_family_roles
    WHERE user_id = p_user_id
    AND family_id = p_family_id
    AND is_active = true;

    RETURN COALESCE(v_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. UPDATE USER FAMILY ROLE (ADMIN ONLY)
-- Purpose: Change user's role within family
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_family_role_secure(
    p_target_user_id UUID,
    p_family_id UUID,
    p_new_role TEXT
)
RETURNS JSON AS $$
DECLARE
    v_admin_id UUID;
    v_is_admin BOOLEAN;
    v_target_user_name TEXT;
    v_target_user_email TEXT;
BEGIN
    -- Get current user
    v_admin_id := auth.uid();

    IF v_admin_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required'
        );
    END IF;

    -- Verify requester is admin
    SELECT EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = v_admin_id
        AND family_id = p_family_id
        AND role = 'admin'
        AND is_active = true
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only family admins can change roles'
        );
    END IF;

    -- Validate new role
    IF p_new_role NOT IN ('admin', 'carer', 'family_viewer') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid role. Must be admin, carer, or family_viewer'
        );
    END IF;

    -- Get target user info
    SELECT name, email INTO v_target_user_name, v_target_user_email
    FROM users WHERE id = p_target_user_id;

    -- Update role
    UPDATE user_family_roles
    SET role = p_new_role,
        assigned_by = v_admin_id,
        assigned_at = NOW()
    WHERE user_id = p_target_user_id
    AND family_id = p_family_id;

    -- If no row was updated, insert new role
    IF NOT FOUND THEN
        INSERT INTO user_family_roles (
            user_id,
            family_id,
            role,
            user_name,
            user_email,
            assigned_by,
            is_active
        ) VALUES (
            p_target_user_id,
            p_family_id,
            p_new_role,
            v_target_user_name,
            v_target_user_email,
            v_admin_id,
            true
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Role updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. IS FAMILY ADMIN CHECK
-- Purpose: Check if user is admin of their family
-- =====================================================

CREATE OR REPLACE FUNCTION is_family_admin(
    p_user_id UUID,
    p_family_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_family_roles
        WHERE user_id = p_user_id
        AND family_id = p_family_id
        AND role = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VALIDATE FAMILY CODE FOR JOIN
-- Purpose: Check if family code is valid without requiring auth
-- =====================================================

CREATE OR REPLACE FUNCTION validate_family_code_for_join(
    family_code_param TEXT
)
RETURNS JSON AS $$
DECLARE
    v_family_id UUID;
    v_family_name TEXT;
BEGIN
    -- Check if family code exists and is active
    SELECT id, family_name
    INTO v_family_id, v_family_name
    FROM family_groups
    WHERE family_code = family_code_param
    AND is_active = true;

    IF v_family_id IS NULL THEN
        RETURN json_build_object(
            'isValid', false,
            'error', 'Invalid family code'
        );
    END IF;

    RETURN json_build_object(
        'isValid', true,
        'familyId', v_family_id,
        'familyName', v_family_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GET USER JOIN REQUEST STATUS (DETAILED)
-- Purpose: Get comprehensive join request status for current user
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_join_request_status_detailed(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_request RECORD;
    v_family_name TEXT;
BEGIN
    -- Get most recent join request for user
    SELECT fjr.*, fg.family_name
    INTO v_request
    FROM family_join_requests fjr
    JOIN family_groups fg ON fg.id = fjr.family_id
    WHERE fjr.user_id = p_user_id
    ORDER BY fjr.requested_at DESC
    LIMIT 1;

    IF v_request IS NULL THEN
        RETURN json_build_object(
            'has_request', false
        );
    END IF;

    RETURN json_build_object(
        'has_request', true,
        'request_id', v_request.id,
        'family_name', v_request.family_name,
        'family_code', v_request.family_code,
        'status', v_request.status,
        'request_message', v_request.request_message,
        'requested_at', v_request.requested_at,
        'reviewed_at', v_request.reviewed_at,
        'review_message', v_request.review_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. GET FAMILY MEMBERS WITH ROLES
-- Purpose: List all family members with role information
-- =====================================================

CREATE OR REPLACE FUNCTION get_family_members_with_roles(
    p_family_id UUID
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    role TEXT,
    is_active BOOLEAN,
    assigned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ufr.user_id,
        ufr.user_name,
        ufr.user_email,
        ufr.role,
        ufr.is_active,
        ufr.assigned_at
    FROM user_family_roles ufr
    WHERE ufr.family_id = p_family_id
    AND ufr.is_active = true
    ORDER BY
        CASE ufr.role
            WHEN 'admin' THEN 1
            WHEN 'carer' THEN 2
            WHEN 'family_viewer' THEN 3
            ELSE 4
        END,
        ufr.assigned_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. UPDATE APPOINTMENT OUTCOME TIMESTAMP TRIGGER
-- Purpose: Auto-update updated_at on appointment outcomes
-- =====================================================

CREATE OR REPLACE FUNCTION update_appointment_outcome_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointment_outcome_timestamp_trigger
BEFORE UPDATE ON appointment_outcomes
FOR EACH ROW
EXECUTE FUNCTION update_appointment_outcome_timestamp();

-- =====================================================
-- 11. SYNC USER FAMILY ROLE CACHE TRIGGER
-- Purpose: Keep cached user data in sync with users table
-- =====================================================

CREATE OR REPLACE FUNCTION sync_user_family_role_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cached user data in user_family_roles when user profile changes
    UPDATE user_family_roles
    SET user_name = NEW.name,
        user_email = NEW.email
    WHERE user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_family_role_cache_trigger
AFTER UPDATE OF name, email ON users
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION sync_user_family_role_cache();

-- =====================================================
-- 12. SYNC FAMILY JOIN REQUEST CACHE TRIGGER
-- Purpose: Keep cached user data in sync with users table
-- =====================================================

CREATE OR REPLACE FUNCTION sync_family_join_request_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cached user data in family_join_requests when user profile changes
    UPDATE family_join_requests
    SET user_name = NEW.name,
        user_email = NEW.email
    WHERE user_id = NEW.id
    AND status = 'pending';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_family_join_request_cache_trigger
AFTER UPDATE OF name, email ON users
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION sync_family_join_request_cache();

-- =====================================================
-- 13. AUTO-ASSIGN ROLE ON FAMILY CREATION TRIGGER
-- Purpose: Automatically assign admin role when family is created
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_admin_on_family_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_email TEXT;
BEGIN
    -- Get user information
    SELECT name, email INTO v_user_name, v_user_email
    FROM users WHERE id = NEW.created_by;

    -- Auto-assign admin role to family creator
    INSERT INTO user_family_roles (
        user_id,
        family_id,
        role,
        user_name,
        user_email,
        assigned_by,
        is_active
    ) VALUES (
        NEW.created_by,
        NEW.id,
        'admin',
        v_user_name,
        v_user_email,
        NEW.created_by,
        true
    )
    ON CONFLICT (user_id, family_id) DO NOTHING;

    -- Update user's family_id
    UPDATE users
    SET family_id = NEW.id
    WHERE id = NEW.created_by;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_admin_trigger
AFTER INSERT ON family_groups
FOR EACH ROW
EXECUTE FUNCTION auto_assign_admin_on_family_creation();

-- =====================================================
-- 14. EXPIRE OLD JOIN REQUESTS FUNCTION
-- Purpose: Clean up expired join requests
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_join_requests()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE family_join_requests
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. HEALTH STATUS CALCULATION FUNCTIONS
-- Purpose: Calculate vital sign health status
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_blood_pressure_status(
    p_systolic INTEGER,
    p_diastolic INTEGER
)
RETURNS TEXT AS $$
BEGIN
    IF p_systolic = 0 OR p_diastolic = 0 THEN
        RETURN 'normal';
    ELSIF p_systolic >= 180 OR p_diastolic >= 110 THEN
        RETURN 'critical';
    ELSIF p_systolic >= 140 OR p_diastolic >= 90 THEN
        RETURN 'concerning';
    ELSIF p_systolic < 90 OR p_diastolic < 60 THEN
        RETURN 'concerning';
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_spo2_status(p_value INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_value = 0 OR p_value = 98 THEN
        RETURN 'normal';
    ELSIF p_value < 88 THEN
        RETURN 'critical';
    ELSIF p_value < 95 THEN
        RETURN 'concerning';
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_pulse_status(p_value INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_value = 0 OR p_value = 72 THEN
        RETURN 'normal';
    ELSIF p_value < 50 OR p_value > 120 THEN
        RETURN 'critical';
    ELSIF p_value < 60 OR p_value > 100 THEN
        RETURN 'concerning';
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_temperature_status(p_value NUMERIC)
RETURNS TEXT AS $$
BEGIN
    IF p_value = 0 OR p_value = 36.5 THEN
        RETURN 'normal';
    ELSIF p_value >= 39.5 OR p_value <= 35.0 THEN
        RETURN 'critical';
    ELSIF p_value >= 38.0 OR p_value <= 35.5 THEN
        RETURN 'concerning';
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_blood_glucose_status(
    p_value NUMERIC,
    p_test_type TEXT
)
RETURNS TEXT AS $$
BEGIN
    IF p_value = 0 THEN
        RETURN 'normal';
    END IF;

    IF p_test_type = 'fasting' THEN
        IF p_value >= 11.1 OR p_value < 3.0 THEN
            RETURN 'critical';
        ELSIF p_value >= 7.0 OR p_value < 4.0 THEN
            RETURN 'concerning';
        END IF;
    ELSE
        IF p_value >= 15.0 OR p_value < 3.0 THEN
            RETURN 'critical';
        ELSIF p_value >= 11.1 OR p_value < 4.0 THEN
            RETURN 'concerning';
        END IF;
    END IF;

    RETURN 'normal';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF FUNCTIONS AND TRIGGERS MIGRATION
-- =====================================================
