-- Nely MVP Database Schema
-- Migration 10: Create User Family Roles System
-- Implements the family role management system as defined in FamilyRole.md

-- Create User Family Roles Table
CREATE TABLE user_family_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'carer', 'family_viewer')),
  assigned_by UUID REFERENCES users(id), -- Who assigned this role (NULL for auto-assignments)
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one active role per user per family
  UNIQUE(user_id, family_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_family_roles_user_id ON user_family_roles(user_id);
CREATE INDEX idx_user_family_roles_family_id ON user_family_roles(family_id);
CREATE INDEX idx_user_family_roles_role ON user_family_roles(role);
CREATE INDEX idx_user_family_roles_active ON user_family_roles(is_active) WHERE is_active = true;

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_family_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_family_roles_updated_at_trigger
  BEFORE UPDATE ON user_family_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_family_roles_updated_at();

-- Enable Row Level Security
ALTER TABLE user_family_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Users can view roles for families they belong to
CREATE POLICY "Users can view family roles for their families" ON user_family_roles
  FOR SELECT
  USING (
    family_id IN (
      SELECT u.family_id
      FROM users u
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy 2: Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage family roles" ON user_family_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_family_roles ufr
      WHERE ufr.user_id = auth.uid()
      AND ufr.family_id = user_family_roles.family_id
      AND ufr.role = 'admin'
      AND ufr.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_family_roles ufr
      WHERE ufr.user_id = auth.uid()
      AND ufr.family_id = user_family_roles.family_id
      AND ufr.role = 'admin'
      AND ufr.is_active = true
    )
  );

-- RLS Policy 3: System can insert roles during family creation/joining (for auto-assignment)
CREATE POLICY "System can auto-assign roles" ON user_family_roles
  FOR INSERT
  WITH CHECK (assigned_by IS NULL); -- Auto-assignments have no assigned_by

-- Function to get user's role in a specific family
CREATE OR REPLACE FUNCTION get_user_family_role(p_user_id UUID, p_family_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_family_roles
  WHERE user_id = p_user_id
  AND family_id = p_family_id
  AND is_active = true;

  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has admin role in family
CREATE OR REPLACE FUNCTION is_family_admin(p_user_id UUID, p_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_family_roles
    WHERE user_id = p_user_id
    AND family_id = p_family_id
    AND role = 'admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign role based on FamilyRole.md rules
CREATE OR REPLACE FUNCTION auto_assign_family_role(
  p_user_id UUID,
  p_family_id UUID,
  p_is_elderly BOOLEAN,
  p_is_creator BOOLEAN
)
RETURNS TEXT AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Apply FamilyRole.md rules
  IF p_is_creator THEN
    -- Both elderly and non-elderly creators become admin
    assigned_role := 'admin';
  ELSE
    -- Both elderly and non-elderly joiners become family_viewer
    assigned_role := 'family_viewer';
  END IF;

  -- Insert the role assignment
  INSERT INTO user_family_roles (user_id, family_id, role, assigned_by)
  VALUES (p_user_id, p_family_id, assigned_role, NULL); -- NULL means auto-assigned

  RETURN assigned_role;
END;
$$ LANGUAGE plpgsql;

-- Function to update user's family role (by admin)
CREATE OR REPLACE FUNCTION update_user_family_role(
  p_target_user_id UUID,
  p_family_id UUID,
  p_new_role TEXT,
  p_admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify the admin has permission
  IF NOT is_family_admin(p_admin_user_id, p_family_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only family admins can change user roles'
    );
  END IF;

  -- Validate the new role
  IF p_new_role NOT IN ('admin', 'carer', 'family_viewer') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role specified'
    );
  END IF;

  -- Update the role
  UPDATE user_family_roles
  SET
    role = p_new_role,
    assigned_by = p_admin_user_id,
    updated_at = NOW()
  WHERE user_id = p_target_user_id
  AND family_id = p_family_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in family'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'new_role', p_new_role
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all family members with their roles
CREATE OR REPLACE FUNCTION get_family_members_with_roles(p_family_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  is_elderly BOOLEAN,
  assigned_at TIMESTAMPTZ,
  assigned_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.email,
    COALESCE(ufr.role, 'none') as role,
    (u.role = 'elderly') as is_elderly,
    ufr.assigned_at,
    assignee.name as assigned_by_name
  FROM users u
  LEFT JOIN user_family_roles ufr ON u.id = ufr.user_id AND ufr.family_id = p_family_id AND ufr.is_active = true
  LEFT JOIN users assignee ON ufr.assigned_by = assignee.id
  WHERE u.family_id = p_family_id
  AND u.is_active = true
  ORDER BY
    CASE ufr.role
      WHEN 'admin' THEN 1
      WHEN 'carer' THEN 2
      WHEN 'family_viewer' THEN 3
      ELSE 4
    END,
    u.name;
END;
$$ LANGUAGE plpgsql;

-- Add comment to table
COMMENT ON TABLE user_family_roles IS 'Manages family-specific user roles and permissions for the Nely healthcare platform';

-- Add column comments
COMMENT ON COLUMN user_family_roles.role IS 'Family role: admin (full access), carer (health management), family_viewer (read-only)';
COMMENT ON COLUMN user_family_roles.assigned_by IS 'User who assigned this role (NULL for auto-assignments during family creation/joining)';
COMMENT ON COLUMN user_family_roles.is_active IS 'Whether this role assignment is currently active';