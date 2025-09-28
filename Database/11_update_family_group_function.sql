-- Nely MVP Database Schema
-- Migration 11: Update Family Group Function with Role Assignment
-- Integrates the family group creation with the new user_family_roles system

-- Updated function to securely create a family group with automatic role assignment
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

  -- 2. Create elderly profile
  INSERT INTO elderly_profiles (family_id, name, age, relationship, care_level, conditions)
  VALUES (v_family_id, p_elderly_name, p_elderly_age, p_elderly_relationship, p_elderly_care_level, '{}')
  RETURNING id INTO v_elderly_id;

  -- 3. Update user's family_id
  UPDATE users
  SET family_id = v_family_id
  WHERE id = v_user_id;

  -- 4. Auto-assign family role (creators always become admin per FamilyRole.md)
  SELECT auto_assign_family_role(v_user_id, v_family_id, v_is_elderly, true) INTO v_assigned_role;

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
    -- Return error details
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create family group'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function to join an existing family group with automatic role assignment
CREATE OR REPLACE FUNCTION join_family_group_secure(
  p_family_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_user_role TEXT;
  v_is_elderly BOOLEAN;
  v_assigned_role TEXT;
  v_family_name TEXT;
  v_result JSON;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user is already in a family
  SELECT family_id INTO v_family_id FROM users WHERE id = v_user_id;
  IF v_family_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is already part of a family group',
      'message', 'Leave current family before joining a new one'
    );
  END IF;

  -- Find the family group by code
  SELECT id, family_name INTO v_family_id, v_family_name
  FROM family_groups
  WHERE family_code = p_family_code;

  IF v_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid family code',
      'message', 'Family group not found'
    );
  END IF;

  -- Get user's elderly status
  SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
  v_is_elderly := (v_user_role = 'elderly');

  -- 1. Update user's family_id
  UPDATE users
  SET family_id = v_family_id
  WHERE id = v_user_id;

  -- 2. Auto-assign family role (joiners always become family_viewer per FamilyRole.md)
  SELECT auto_assign_family_role(v_user_id, v_family_id, v_is_elderly, false) INTO v_assigned_role;

  -- 3. Return success result
  SELECT json_build_object(
    'success', true,
    'family_id', v_family_id,
    'family_name', v_family_name,
    'family_code', p_family_code,
    'assigned_role', v_assigned_role,
    'message', 'Successfully joined ' || v_family_name || ' with ' || v_assigned_role || ' role'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to join family group'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_family_group_secure TO authenticated;
GRANT EXECUTE ON FUNCTION join_family_group_secure TO authenticated;