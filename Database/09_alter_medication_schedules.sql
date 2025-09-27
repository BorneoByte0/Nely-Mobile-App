-- Add missing fields to medication_schedules table for better medication taking tracking
-- Date: September 27, 2025

-- Add dosage_taken field to track actual dosage taken (could differ from prescribed)
ALTER TABLE medication_schedules
ADD COLUMN dosage_taken TEXT;

-- Add notes field to track any notes when taking medication (side effects, how they feel, etc.)
ALTER TABLE medication_schedules
ADD COLUMN notes TEXT;

-- Add index for efficient querying of taken medications with notes
CREATE INDEX idx_medication_schedules_taken_notes ON medication_schedules(elderly_id, taken, taken_at DESC) WHERE notes IS NOT NULL;