-- Nely MVP Database Schema
-- Migration 15: Fix auto_assign_family_role Function
-- Ensures that family creators automatically get admin role during family creation

-- Drop and recreate the auto_assign_family_role function with better error handling
DROP FUNCTION IF EXISTS auto_assign_family_role(UUID, UUID, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION auto_assign_family_role(
  p_user_id UUID,
  p_family_id UUID,
  p_is_elderly BOOLEAN,
  p_is_creator BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  existing_role TEXT;
BEGIN
  -- Check if user already has a role in this family
  SELECT role INTO existing_role
  FROM user_family_roles
  WHERE user_id = p_user_id
  AND family_id = p_family_id
  AND is_active = true;

  -- If role already exists, return it
  IF existing_role IS NOT NULL THEN
    RETURN existing_role;
  END IF;

  -- Apply FamilyRole.md rules
  IF p_is_creator THEN
    -- Both elderly and non-elderly creators become admin
    assigned_role := 'admin';
  ELSE
    -- Both elderly and non-elderly joiners become family_viewer
    assigned_role := 'family_viewer';
  END IF;

  -- Insert the role assignment with proper error handling
  BEGIN
    INSERT INTO user_family_roles (user_id, family_id, role, assigned_by, is_active)
    VALUES (p_user_id, p_family_id, assigned_role, NULL, true);

    -- Log successful assignment
    RAISE NOTICE 'Successfully assigned % role to user % in family %', assigned_role, p_user_id, p_family_id;

  EXCEPTION
    WHEN unique_violation THEN
      -- Handle race condition where role was inserted between check and insert
      SELECT role INTO assigned_role
      FROM user_family_roles
      WHERE user_id = p_user_id
      AND family_id = p_family_id
      AND is_active = true;

      RAISE NOTICE 'Role already exists for user % in family %: %', p_user_id, p_family_id, assigned_role;

    WHEN OTHERS THEN
      -- Log the error and re-raise
      RAISE EXCEPTION 'Failed to assign role for user % in family %: %', p_user_id, p_family_id, SQLERRM;
  END;

  RETURN assigned_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_assign_family_role TO authenticated;

-- Also update the create_family_group_secure function to have better error handling
CREATE OR REPLACE FUNCTION create_family_group_secure(
  p_family_code TEXT,
  p_family_name TEXT,
  p_elderly_name TEXT,
  p_elderly_age INTEGER,
  p_elderly_relationship TEXT,
  p_elderly_care_level TEXT DEFAULT 'independent'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_elderly_id UUID;
  v_user_role TEXT;
  v_is_elderly BOOLEAN;
  v_assigned_role TEXT;
  v_result JSON;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get user's elderly status
  SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
  v_is_elderly := (v_user_role = 'elderly');

  -- 1. Create family group
  INSERT INTO family_groups (family_code, family_name, created_by)
  VALUES (p_family_code, p_family_name, v_user_id)
  RETURNING id INTO v_family_id;

  RAISE NOTICE 'Created family group % with ID %', p_family_name, v_family_id;

  -- 2. Create elderly profile
  INSERT INTO elderly_profiles (family_id, name, age, relationship, care_level, conditions)
  VALUES (v_family_id, p_elderly_name, p_elderly_age, p_elderly_relationship, p_elderly_care_level, '{}')
  RETURNING id INTO v_elderly_id;

  RAISE NOTICE 'Created elderly profile % with ID %', p_elderly_name, v_elderly_id;

  -- 3. Update user's family_id
  UPDATE users
  SET family_id = v_family_id
  WHERE id = v_user_id;

  RAISE NOTICE 'Updated user % family_id to %', v_user_id, v_family_id;

  -- 4. Auto-assign family role (creators always become admin per FamilyRole.md)
  SELECT auto_assign_family_role(v_user_id, v_family_id, v_is_elderly, true) INTO v_assigned_role;

  RAISE NOTICE 'Assigned role % to user %', v_assigned_role, v_user_id;

  -- 5. Return success result
  SELECT json_build_object(
    'success', true,
    'family_id', v_family_id,
    'family_code', p_family_code,
    'elderly_id', v_elderly_id,
    'assigned_role', v_assigned_role,
    'message', 'Family group created successfully with ' || v_assigned_role || ' role assigned'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details with more information
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'message', 'Failed to create family group: ' || SQLERRM
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_family_group_secure TO authenticated;

-- Add comments
COMMENT ON FUNCTION auto_assign_family_role IS 'Automatically assigns family roles based on FamilyRole.md rules with improved error handling';
COMMENT ON FUNCTION create_family_group_secure IS 'Creates family group and assigns admin role to creator with comprehensive error handling';