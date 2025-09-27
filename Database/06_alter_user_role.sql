-- Nely MVP - Alter User Role Constraint
-- Migration 06: Update role constraint from 'caregiver' to 'not elderly'
-- For Supabase Web SQL Editor

-- Step 1: Update existing data FIRST (before changing constraint)
UPDATE users SET role = 'not elderly' WHERE role = 'caregiver';

-- Step 2: Verify data update (optional - check if any invalid roles remain)
-- SELECT DISTINCT role FROM users;

-- Step 3: Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 4: Add the new constraint with updated values
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['elderly'::text, 'not elderly'::text]));