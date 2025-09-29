-- Nely MVP Database Schema
-- Migration 14: Fix Missing Admin Role for Family Creators
-- Manually assigns admin role to family creators who are missing their role

-- Function to fix missing admin roles for family creators
CREATE OR REPLACE FUNCTION fix_missing_family_creator_roles()
RETURNS TABLE (
  fixed_user_id UUID,
  fixed_family_id UUID,
  assigned_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find users who created families but don't have admin roles
  RETURN QUERY
  WITH family_creators AS (
    SELECT
      fg.created_by as user_id,
      fg.id as family_id,
      u.email
    FROM family_groups fg
    JOIN users u ON fg.created_by = u.id
    LEFT JOIN user_family_roles ufr ON ufr.user_id = fg.created_by
      AND ufr.family_id = fg.id
      AND ufr.is_active = true
    WHERE ufr.id IS NULL -- No role found
  )
  INSERT INTO user_family_roles (user_id, family_id, role, assigned_by, is_active)
  SELECT
    fc.user_id,
    fc.family_id,
    'admin'::TEXT,
    NULL, -- Auto-assigned
    true
  FROM family_creators fc
  RETURNING user_id, family_id, role;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fix_missing_family_creator_roles TO authenticated;

-- Execute the fix
SELECT * FROM fix_missing_family_creator_roles();

-- Also create a simpler function to manually assign admin role to a specific user
CREATE OR REPLACE FUNCTION assign_admin_role_to_family_creator(
  p_user_id UUID,
  p_family_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is actually the creator of the family
  IF NOT EXISTS (
    SELECT 1 FROM family_groups
    WHERE id = p_family_id AND created_by = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is not the creator of this family'
    );
  END IF;

  -- Check if role already exists
  IF EXISTS (
    SELECT 1 FROM user_family_roles
    WHERE user_id = p_user_id AND family_id = p_family_id AND is_active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already has a role in this family'
    );
  END IF;

  -- Insert admin role
  INSERT INTO user_family_roles (user_id, family_id, role, assigned_by, is_active)
  VALUES (p_user_id, p_family_id, 'admin', NULL, true);

  RETURN json_build_object(
    'success', true,
    'message', 'Admin role assigned successfully',
    'role', 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION assign_admin_role_to_family_creator TO authenticated;