-- ALTER script for family_join_requests table
-- Add name and email columns to store user information directly

-- Add new columns to family_join_requests table
ALTER TABLE family_join_requests
ADD COLUMN user_name VARCHAR(255),
ADD COLUMN user_email VARCHAR(255);

-- Update existing records with user data from users table
UPDATE family_join_requests
SET
    user_name = users.name,
    user_email = users.email
FROM users
WHERE family_join_requests.user_id = users.id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_join_requests_user_email ON family_join_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_family_join_requests_user_name ON family_join_requests(user_name);

-- Add comments to document the new columns
COMMENT ON COLUMN family_join_requests.user_name IS 'Cached user name for display purposes';
COMMENT ON COLUMN family_join_requests.user_email IS 'Cached user email for display purposes';

-- Update the create_family_join_request RPC function to automatically populate user_name and user_email
CREATE OR REPLACE FUNCTION create_family_join_request(
  p_family_code TEXT,
  p_request_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_user_name VARCHAR(255);
  v_user_email VARCHAR(255);
  v_existing_request_id UUID;
  v_user_family_id UUID;
  v_request_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  -- Check if user exists and get their info
  SELECT name, email, family_id INTO v_user_name, v_user_email, v_user_family_id
  FROM users
  WHERE id = v_user_id;

  IF v_user_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if user is already in a family
  IF v_user_family_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is already in a family'
    );
  END IF;

  -- Find the family by code
  SELECT id INTO v_family_id
  FROM family_groups
  WHERE family_code = p_family_code;

  IF v_family_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Family not found'
    );
  END IF;

  -- Check if there's already a pending request
  SELECT id INTO v_existing_request_id
  FROM family_join_requests
  WHERE user_id = v_user_id
    AND family_id = v_family_id
    AND status = 'pending';

  IF v_existing_request_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request already exists'
    );
  END IF;

  -- Create the join request with user name and email
  INSERT INTO family_join_requests (
    user_id,
    user_name,
    user_email,
    family_id,
    family_code,
    request_message,
    status,
    requested_at
  ) VALUES (
    v_user_id,
    v_user_name,
    v_user_email,
    v_family_id,
    p_family_code,
    p_request_message,
    'pending',
    NOW()
  ) RETURNING id INTO v_request_id;

  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id,
    'family_id', v_family_id
  );
END;
$$;

-- Verify the changes
SELECT
    id,
    user_id,
    user_name,
    user_email,
    family_id,
    request_message,
    status,
    requested_at
FROM family_join_requests
ORDER BY requested_at DESC;