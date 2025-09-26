-- Nely MVP Database Schema
-- Migration 05: Add Avatar Columns
-- For Supabase Web SQL Editor
-- Add avatar support to existing tables

-- Add avatar column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar TEXT;
  END IF;
END $$;

-- Add avatar column to elderly_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elderly_profiles'
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE elderly_profiles ADD COLUMN avatar TEXT;
  END IF;
END $$;