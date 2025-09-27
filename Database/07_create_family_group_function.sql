-- Nely MVP Database Schema
-- Migration 07: Create Family Group Secure Function
-- For Supabase Web SQL Editor

-- Function to securely create a family group with elderly profile
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
  v_result JSON;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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

  -- 4. Return success result
  SELECT json_build_object(
    'success', true,
    'family_id', v_family_id,
    'family_code', p_family_code,
    'elderly_id', v_elderly_id,
    'message', 'Family group created successfully'
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_family_group_secure TO authenticated;