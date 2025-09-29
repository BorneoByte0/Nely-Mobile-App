-- ALTER script for user_family_roles table
-- Add user_name and user_email columns to cache user information

-- Add new columns to user_family_roles table
ALTER TABLE user_family_roles
ADD COLUMN user_name VARCHAR(255),
ADD COLUMN user_email VARCHAR(255);

-- Update existing records with user data from users table
UPDATE user_family_roles
SET
    user_name = users.name,
    user_email = users.email
FROM users
WHERE user_family_roles.user_id = users.id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_family_roles_user_email ON user_family_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_user_family_roles_user_name ON user_family_roles(user_name);

-- Add comments to document the new columns
COMMENT ON COLUMN user_family_roles.user_name IS 'Cached user name for display purposes';
COMMENT ON COLUMN user_family_roles.user_email IS 'Cached user email for display purposes';

-- Update the review_family_join_request RPC function to populate user_name and user_email when creating user_family_roles
CREATE OR REPLACE FUNCTION review_family_join_request(
  p_request_id UUID,
  p_action TEXT,
  p_review_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request family_join_requests%ROWTYPE;
  v_admin_user_id UUID;
  v_user_name VARCHAR(255);
  v_user_email VARCHAR(255);
BEGIN
  -- Get the current user (admin reviewing the request)
  v_admin_user_id := auth.uid();

  -- Get the join request details
  SELECT * INTO v_request
  FROM family_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Join request not found or already processed'
    );
  END IF;

  -- Get user details for caching
  SELECT name, email INTO v_user_name, v_user_email
  FROM users
  WHERE id = v_request.user_id;

  IF v_user_name IS NULL THEN
    -- Use cached data from join request if user not found in users table
    v_user_name := v_request.user_name;
    v_user_email := v_request.user_email;
  END IF;

  -- Update the request status
  UPDATE family_join_requests
  SET
    status = p_action,
    reviewed_by = v_admin_user_id,
    reviewed_at = NOW(),
    review_message = p_review_message
  WHERE id = p_request_id;

  -- If approved, add user to family and create role assignment
  IF p_action = 'approve' THEN
    -- Update user's family_id
    UPDATE users
    SET family_id = v_request.family_id
    WHERE id = v_request.user_id;

    -- Create user_family_role record with cached user info
    INSERT INTO user_family_roles (
      user_id,
      user_name,
      user_email,
      family_id,
      role,
      assigned_by,
      assigned_at,
      is_active
    ) VALUES (
      v_request.user_id,
      v_user_name,
      v_user_email,
      v_request.family_id,
      'family_viewer', -- Default role for approved members
      v_admin_user_id,
      NOW(),
      true
    ) ON CONFLICT (user_id, family_id) DO UPDATE SET
      user_name = EXCLUDED.user_name,
      user_email = EXCLUDED.user_email,
      role = EXCLUDED.role,
      assigned_by = EXCLUDED.assigned_by,
      assigned_at = EXCLUDED.assigned_at,
      is_active = EXCLUDED.is_active;
  END IF;

  RETURN json_build_object(
    'success', true,
    'action', p_action,
    'request_id', p_request_id
  );
END;
$$;

-- Verify the changes
SELECT
    ufr.user_id,
    ufr.user_name,
    ufr.user_email,
    ufr.family_id,
    ufr.role,
    ufr.assigned_at,
    ufr.is_active
FROM user_family_roles ufr
ORDER BY ufr.assigned_at DESC;