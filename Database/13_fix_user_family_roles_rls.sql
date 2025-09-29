-- Nely MVP Database Schema
-- Migration 13: Fix User Family Roles RLS Infinite Recursion
-- Fixes the infinite recursion issue in user_family_roles RLS policies

-- Drop the problematic RLS policies
DROP POLICY IF EXISTS "Only admins can manage family roles" ON user_family_roles;
DROP POLICY IF EXISTS "Users can view family roles for their families" ON user_family_roles;
DROP POLICY IF EXISTS "System can auto-assign roles" ON user_family_roles;

-- Create a simple, non-recursive view policy for reading
CREATE POLICY "Users can view family roles for their families" ON user_family_roles
  FOR SELECT
  USING (
    family_id IN (
      SELECT u.family_id
      FROM users u
      WHERE u.id = auth.uid()
      AND u.family_id IS NOT NULL
    )
  );

-- Create a separate policy for auto-assignment during family creation
CREATE POLICY "System can auto-assign roles" ON user_family_roles
  FOR INSERT
  WITH CHECK (assigned_by IS NULL); -- Auto-assignments have no assigned_by

-- Create admin management policy using a function to avoid recursion
CREATE OR REPLACE FUNCTION is_user_family_admin(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_family_roles
    WHERE user_id = auth.uid()
    AND family_id = p_family_id
    AND role = 'admin'
    AND is_active = true
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_user_family_admin TO authenticated;

-- Create admin management policy using the helper function
CREATE POLICY "Admins can manage family roles" ON user_family_roles
  FOR ALL
  USING (is_user_family_admin(family_id))
  WITH CHECK (is_user_family_admin(family_id));

-- Create a security definer function for safe role updates to avoid RLS issues
CREATE OR REPLACE FUNCTION update_user_family_role_secure(
  p_target_user_id UUID,
  p_family_id UUID,
  p_new_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_id UUID;
  result JSON;
BEGIN
  -- Get the current authenticated user ID
  v_admin_user_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF v_admin_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  -- Check if the requesting user is an admin in this family (bypassing RLS)
  IF NOT EXISTS (
    SELECT 1
    FROM user_family_roles
    WHERE user_id = v_admin_user_id
    AND family_id = p_family_id
    AND role = 'admin'
    AND is_active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only family administrators can change user roles'
    );
  END IF;

  -- Validate the new role
  IF p_new_role NOT IN ('admin', 'carer', 'family_viewer') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role specified'
    );
  END IF;

  -- Update the role (bypassing RLS with SECURITY DEFINER)
  UPDATE user_family_roles
  SET
    role = p_new_role,
    assigned_by = v_admin_user_id,
    updated_at = NOW()
  WHERE user_id = p_target_user_id
  AND family_id = p_family_id
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in family or role assignment not active'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'new_role', p_new_role
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_family_role_secure TO authenticated;

-- Drop the old problematic function
DROP FUNCTION IF EXISTS update_user_family_role(UUID, UUID, TEXT, UUID);

-- Add comment
COMMENT ON FUNCTION update_user_family_role_secure IS 'Securely updates user family roles with proper admin authorization checks';
COMMENT ON FUNCTION is_user_family_admin IS 'Helper function to check if user is admin in a family without causing RLS recursion';