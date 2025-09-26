-- Migration 07: Update Care Notes Categories
-- Add daily_care and behavior categories to the care_notes table

-- Drop the existing constraint
ALTER TABLE care_notes DROP CONSTRAINT IF EXISTS care_notes_category_check;

-- Add the new constraint with all categories including daily_care and behavior
ALTER TABLE care_notes ADD CONSTRAINT care_notes_category_check
  CHECK (category IN ('general', 'health', 'medication', 'appointment', 'emergency', 'daily_care', 'behavior'));