-- Nely MVP Database Schema
-- Migration 09: Create Appointment Outcomes Table
-- For storing detailed appointment results and follow-up information

-- Create Appointment Outcomes Table
CREATE TABLE appointment_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  elderly_id UUID REFERENCES elderly_profiles(id) ON DELETE CASCADE,

  -- Core outcome information
  diagnosis TEXT NOT NULL,
  doctor_notes TEXT NOT NULL,

  -- Additional medical information
  test_results TEXT,
  vital_signs_recorded JSONB, -- Store BP, pulse, weight etc. taken during appointment

  -- Prescriptions and medications
  new_medications TEXT, -- New medications prescribed
  medication_changes TEXT, -- Changes to existing medications
  prescriptions TEXT, -- Detailed prescription information

  -- Recommendations and follow-up
  recommendations TEXT,
  follow_up_instructions TEXT,
  next_appointment_recommended BOOLEAN DEFAULT false,
  next_appointment_timeframe TEXT, -- e.g., "2 weeks", "3 months"

  -- Referrals
  referrals TEXT, -- Referrals to other specialists

  -- Outcome metadata
  outcome_recorded_by TEXT NOT NULL, -- Who recorded this outcome
  outcome_recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Additional fields
  appointment_duration_minutes INTEGER,
  patient_satisfaction_rating INTEGER CHECK (patient_satisfaction_rating >= 1 AND patient_satisfaction_rating <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_appointment_outcomes_appointment_id ON appointment_outcomes(appointment_id);
CREATE INDEX idx_appointment_outcomes_elderly_id ON appointment_outcomes(elderly_id);
CREATE INDEX idx_appointment_outcomes_recorded_at ON appointment_outcomes(outcome_recorded_at DESC);

-- Add constraint to ensure one outcome per appointment
ALTER TABLE appointment_outcomes ADD CONSTRAINT unique_appointment_outcome UNIQUE (appointment_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appointment_outcomes_updated_at_trigger
  BEFORE UPDATE ON appointment_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_outcomes_updated_at();

-- Add comment to table
COMMENT ON TABLE appointment_outcomes IS 'Stores detailed outcomes and results from completed medical appointments';

-- Enable Row Level Security
ALTER TABLE appointment_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Users can only access appointment outcomes for elderly profiles in their family
CREATE POLICY "Users can view appointment outcomes for their family" ON appointment_outcomes
  FOR SELECT
  USING (
    elderly_id IN (
      SELECT ep.id
      FROM elderly_profiles ep
      JOIN family_groups fg ON ep.family_id = fg.id
      JOIN users u ON u.family_id = fg.id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy 2: Users can insert appointment outcomes for elderly profiles in their family
CREATE POLICY "Users can create appointment outcomes for their family" ON appointment_outcomes
  FOR INSERT
  WITH CHECK (
    elderly_id IN (
      SELECT ep.id
      FROM elderly_profiles ep
      JOIN family_groups fg ON ep.family_id = fg.id
      JOIN users u ON u.family_id = fg.id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy 3: Users can update appointment outcomes for elderly profiles in their family
CREATE POLICY "Users can update appointment outcomes for their family" ON appointment_outcomes
  FOR UPDATE
  USING (
    elderly_id IN (
      SELECT ep.id
      FROM elderly_profiles ep
      JOIN family_groups fg ON ep.family_id = fg.id
      JOIN users u ON u.family_id = fg.id
      WHERE u.id = auth.uid()
    )
  )
  WITH CHECK (
    elderly_id IN (
      SELECT ep.id
      FROM elderly_profiles ep
      JOIN family_groups fg ON ep.family_id = fg.id
      JOIN users u ON u.family_id = fg.id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy 4: Users can delete appointment outcomes for elderly profiles in their family
-- (Though deletion might be restricted in practice)
CREATE POLICY "Users can delete appointment outcomes for their family" ON appointment_outcomes
  FOR DELETE
  USING (
    elderly_id IN (
      SELECT ep.id
      FROM elderly_profiles ep
      JOIN family_groups fg ON ep.family_id = fg.id
      JOIN users u ON u.family_id = fg.id
      WHERE u.id = auth.uid()
    )
  );

-- Additional security: Ensure appointment_id belongs to the same elderly person
-- This prevents users from creating outcomes for appointments that don't belong to their family
CREATE OR REPLACE FUNCTION validate_appointment_outcome_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the appointment belongs to the same elderly person
  IF NOT EXISTS (
    SELECT 1
    FROM appointments a
    WHERE a.id = NEW.appointment_id
    AND a.elderly_id = NEW.elderly_id
  ) THEN
    RAISE EXCEPTION 'Appointment ID does not match the elderly profile ID';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate consistency
CREATE TRIGGER validate_appointment_outcome_consistency_trigger
  BEFORE INSERT OR UPDATE ON appointment_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_outcome_consistency();