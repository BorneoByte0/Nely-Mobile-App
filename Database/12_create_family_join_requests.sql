-- Nely MVP Database Schema
-- Migration 12: Create Family Join Requests Table
-- Implements the family join request approval workflow as defined in FamilyRole.md

-- Create Family Join Requests Table
CREATE TABLE family_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  family_code TEXT NOT NULL,
  request_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id), -- Admin who approved/rejected
  reviewed_at TIMESTAMPTZ,
  review_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one active request per user per family
  UNIQUE(user_id, family_id)
);

-- Create indexes for performance
CREATE INDEX idx_family_join_requests_user_id ON family_join_requests(user_id);
CREATE INDEX idx_family_join_requests_family_id ON family_join_requests(family_id);
CREATE INDEX idx_family_join_requests_status ON family_join_requests(status);
CREATE INDEX idx_family_join_requests_pending ON family_join_requests(status, requested_at) WHERE status = 'pending';

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_family_join_requests_updated_at_trigger
  BEFORE UPDATE ON family_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_family_join_requests_updated_at();

-- Enable Row Level Security
ALTER TABLE family_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Users can view their own join requests
CREATE POLICY "Users can view their own join requests" ON family_join_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy 2: Family admins can view requests for their families
CREATE POLICY "Family admins can view family join requests" ON family_join_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_family_roles ufr
      WHERE ufr.user_id = auth.uid()
      AND ufr.family_id = family_join_requests.family_id
      AND ufr.role = 'admin'
      AND ufr.is_active = true
    )
  );

-- RLS Policy 3: Authenticated users can create join requests
CREATE POLICY "Users can create join requests" ON family_join_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policy 4: Only family admins can update join requests (approve/reject)
CREATE POLICY "Only family admins can update join requests" ON family_join_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_family_roles ufr
      WHERE ufr.user_id = auth.uid()
      AND ufr.family_id = family_join_requests.family_id
      AND ufr.role = 'admin'
      AND ufr.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_family_roles ufr
      WHERE ufr.user_id = auth.uid()
      AND ufr.family_id = family_join_requests.family_id
      AND ufr.role = 'admin'
      AND ufr.is_active = true
    )
  );

-- Function to create a family join request
CREATE OR REPLACE FUNCTION create_family_join_request(
  p_family_code TEXT,
  p_request_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_family_name TEXT;
  v_user_family_id UUID;
  v_existing_request_id UUID;
  v_request_id UUID;
  v_result JSON;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user is already in a family
  SELECT family_id INTO v_user_family_id FROM users WHERE id = v_user_id;
  IF v_user_family_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is already part of a family group',
      'message', 'Leave current family before requesting to join a new one'
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

  -- Check if user already has a pending request for this family
  SELECT id INTO v_existing_request_id
  FROM family_join_requests
  WHERE user_id = v_user_id
  AND family_id = v_family_id
  AND status = 'pending';

  IF v_existing_request_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request already exists',
      'message', 'You already have a pending request for this family'
    );
  END IF;

  -- Create the join request
  INSERT INTO family_join_requests (user_id, family_id, family_code, request_message)
  VALUES (v_user_id, v_family_id, p_family_code, p_request_message)
  RETURNING id INTO v_request_id;

  -- Return success result
  SELECT json_build_object(
    'success', true,
    'request_id', v_request_id,
    'family_name', v_family_name,
    'message', 'Join request submitted successfully. Waiting for admin approval.'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create join request'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function to approve/reject a family join request
CREATE OR REPLACE FUNCTION review_family_join_request(
  p_request_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_review_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_request_user_id UUID;
  v_family_id UUID;
  v_request_status TEXT;
  v_user_role TEXT;
  v_is_elderly BOOLEAN;
  v_assigned_role TEXT;
  v_result JSON;
BEGIN
  -- Get the current authenticated user ID
  v_admin_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate action
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid action',
      'message', 'Action must be either approve or reject'
    );
  END IF;

  -- Get request details
  SELECT user_id, family_id, status
  INTO v_request_user_id, v_family_id, v_request_status
  FROM family_join_requests
  WHERE id = p_request_id;

  IF v_request_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found',
      'message', 'Join request does not exist'
    );
  END IF;

  -- Check if request is still pending
  IF v_request_status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request already processed',
      'message', 'This request has already been ' || v_request_status
    );
  END IF;

  -- Verify admin has permission for this family
  IF NOT is_family_admin(v_admin_id, v_family_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission denied',
      'message', 'Only family admins can review join requests'
    );
  END IF;

  -- Update request status
  UPDATE family_join_requests
  SET
    status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    review_message = p_review_message
  WHERE id = p_request_id;

  -- If approved, add user to family and assign role
  IF p_action = 'approve' THEN
    -- Get user's elderly status
    SELECT role INTO v_user_role FROM users WHERE id = v_request_user_id;
    v_is_elderly := (v_user_role = 'elderly');

    -- Update user's family_id
    UPDATE users
    SET family_id = v_family_id
    WHERE id = v_request_user_id;

    -- Auto-assign family role (joiners always become family_viewer per FamilyRole.md)
    SELECT auto_assign_family_role(v_request_user_id, v_family_id, v_is_elderly, false) INTO v_assigned_role;

    v_result := json_build_object(
      'success', true,
      'action', 'approved',
      'assigned_role', v_assigned_role,
      'message', 'Join request approved successfully. User added to family with ' || v_assigned_role || ' role.'
    );
  ELSE
    v_result := json_build_object(
      'success', true,
      'action', 'rejected',
      'message', 'Join request rejected successfully.'
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to review join request'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function to get pending join requests for a family (admin only)
CREATE OR REPLACE FUNCTION get_pending_join_requests(p_family_id UUID)
RETURNS TABLE (
  request_id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  is_elderly BOOLEAN,
  request_message TEXT,
  requested_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Security check: only family admins can view pending requests
  IF NOT is_family_admin(auth.uid(), p_family_id) THEN
    RAISE EXCEPTION 'Only family admins can view pending join requests';
  END IF;

  RETURN QUERY
  SELECT
    fjr.id,
    u.id,
    u.name,
    u.email,
    (u.role = 'elderly') as is_elderly,
    fjr.request_message,
    fjr.requested_at
  FROM family_join_requests fjr
  JOIN users u ON fjr.user_id = u.id
  WHERE fjr.family_id = p_family_id
  AND fjr.status = 'pending'
  ORDER BY fjr.requested_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's join request status for a specific family
CREATE OR REPLACE FUNCTION get_user_join_request_status(p_family_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_request family_join_requests%ROWTYPE;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Find family by code
  SELECT id INTO v_family_id FROM family_groups WHERE family_code = p_family_code;

  IF v_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Family not found'
    );
  END IF;

  -- Get user's latest request for this family
  SELECT * INTO v_request
  FROM family_join_requests
  WHERE user_id = v_user_id
  AND family_id = v_family_id
  ORDER BY requested_at DESC
  LIMIT 1;

  IF v_request.id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'has_request', false,
      'can_request', true
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'has_request', true,
    'status', v_request.status,
    'requested_at', v_request.requested_at,
    'reviewed_at', v_request.reviewed_at,
    'review_message', v_request.review_message,
    'can_request', (v_request.status != 'pending')
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_family_join_request TO authenticated;
GRANT EXECUTE ON FUNCTION review_family_join_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_join_requests TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_join_request_status TO authenticated;

-- Add comments to table and functions
COMMENT ON TABLE family_join_requests IS 'Manages family join requests that require admin approval';
COMMENT ON FUNCTION create_family_join_request IS 'Creates a new family join request for admin approval';
COMMENT ON FUNCTION review_family_join_request IS 'Allows family admins to approve or reject join requests';
COMMENT ON FUNCTION get_pending_join_requests IS 'Returns pending join requests for a family (admin only)';
COMMENT ON FUNCTION get_user_join_request_status IS 'Returns user''s join request status for a specific family';