-- Nely MVP Database Schema
-- Migration 03: Helper Functions and Triggers
-- For Supabase Web SQL Editor
-- Current App Functionality Only

-- Function to generate random 6-digit codes
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    SELECT EXISTS(SELECT 1 FROM family_groups WHERE family_code = new_code) INTO code_exists;

    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    SELECT EXISTS(
      SELECT 1 FROM family_invitations
      WHERE invite_code = new_code
      AND status = 'pending'
      AND expires_at > NOW()
    ) INTO code_exists;

    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Function to auto-generate family code when creating family group
CREATE OR REPLACE FUNCTION set_family_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.family_code IS NULL OR NEW.family_code = '' THEN
    NEW.family_code := generate_family_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Function to auto-generate invite code when creating invitation
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Function to update user preferences updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to update family member last_active
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE family_members
  SET last_active = NOW()
  WHERE user_id = auth.uid();
  RETURN NULL;
END;
$$;

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Create default user preferences
  INSERT INTO user_preferences (user_id, language, theme, units, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.preferred_language, 'en'),
    'system',
    'metric',
    'Asia/Kuala_Lumpur'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default notification settings
  INSERT INTO notification_settings (
    user_id,
    health_alerts,
    medication_reminders,
    appointment_reminders,
    family_updates,
    quiet_hours_start,
    quiet_hours_end
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    '22:00',
    '07:00'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE family_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at <= NOW();
END;
$$;

-- Function to calculate medication adherence
CREATE OR REPLACE FUNCTION calculate_medication_adherence(
  elderly_profile_id UUID,
  days_back INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result JSONB;
  taken_count INTEGER;
  total_count INTEGER;
  adherence_rate DECIMAL;
BEGIN
  SELECT
    COUNT(CASE WHEN taken = true THEN 1 END),
    COUNT(*)
  INTO taken_count, total_count
  FROM medication_schedules
  WHERE elderly_id = elderly_profile_id
  AND date >= CURRENT_DATE - INTERVAL '%s days' % days_back;

  IF total_count = 0 THEN
    adherence_rate := 0;
  ELSE
    adherence_rate := ROUND((taken_count::DECIMAL / total_count::DECIMAL) * 100, 1);
  END IF;

  result := jsonb_build_object(
    'taken_count', taken_count,
    'total_count', total_count,
    'adherence_rate', adherence_rate,
    'period_days', days_back
  );

  RETURN result;
END;
$$;

-- Function to get latest vital signs
CREATE OR REPLACE FUNCTION get_latest_vitals(elderly_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(vs.*)
  INTO result
  FROM vital_signs vs
  WHERE vs.elderly_id = elderly_profile_id
  ORDER BY vs.recorded_at DESC
  LIMIT 1;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_set_family_code ON family_groups;
DROP TRIGGER IF EXISTS trigger_set_invite_code ON family_invitations;
DROP TRIGGER IF EXISTS trigger_update_user_preferences_timestamp ON user_preferences;
DROP TRIGGER IF EXISTS trigger_update_notification_settings_timestamp ON notification_settings;
DROP TRIGGER IF EXISTS trigger_create_user_defaults ON users;
DROP TRIGGER IF EXISTS trigger_update_last_active_vital_signs ON vital_signs;
DROP TRIGGER IF EXISTS trigger_update_last_active_medication_schedules ON medication_schedules;
DROP TRIGGER IF EXISTS trigger_update_last_active_care_notes ON care_notes;

-- Create triggers
CREATE TRIGGER trigger_set_family_code
  BEFORE INSERT ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_family_code();

CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

CREATE TRIGGER trigger_update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_notification_settings_timestamp
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_create_user_defaults
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_defaults();

-- Create triggers to update last_active when users interact with data
CREATE TRIGGER trigger_update_last_active_vital_signs
  AFTER INSERT OR UPDATE ON vital_signs
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

CREATE TRIGGER trigger_update_last_active_medication_schedules
  AFTER UPDATE ON medication_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

CREATE TRIGGER trigger_update_last_active_care_notes
  AFTER INSERT ON care_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();