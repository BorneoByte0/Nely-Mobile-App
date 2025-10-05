-- Cleanup Orphaned Auth Users
-- This function identifies and optionally deletes auth users who don't have a corresponding profile
-- Run this as a scheduled job or manually via Supabase SQL Editor

-- Function to find orphaned auth users (users in auth.users but not in public.users)
-- Note: This requires admin/service role access to auth.users table
-- Can be run manually via Supabase Dashboard > SQL Editor

-- MANUAL CLEANUP QUERY (Run in Supabase SQL Editor with service role):
-- This identifies orphaned users created more than 1 hour ago
/*
SELECT
    au.id,
    au.email,
    au.created_at,
    EXTRACT(EPOCH FROM (NOW() - au.created_at))/3600 as hours_old
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.created_at < NOW() - INTERVAL '1 hour'
ORDER BY au.created_at DESC;
*/

-- TO DELETE ORPHANED USERS (Use with caution - run in Supabase SQL Editor):
-- Uncomment and run this query to actually delete orphaned auth users
/*
DELETE FROM auth.users
WHERE id IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
      AND au.created_at < NOW() - INTERVAL '1 hour'
);
*/

-- RECOMMENDED APPROACH:
-- Set up a Supabase Edge Function or cron job to run this cleanup daily
-- This prevents the database from accumulating orphaned accounts

-- Note: The client-side code now implements retry logic with exponential backoff
-- to minimize the chances of orphaned users being created in the first place.
-- This cleanup is a safety net for edge cases (network failures, etc.)

-- PREVENTION:
-- The improved signUp function in AuthContext.tsx now:
-- 1. Retries profile creation up to 3 times with exponential backoff
-- 2. Handles duplicate key errors gracefully
-- 3. Signs out the user if all retries fail
-- 4. Provides clear error messages to retry signup

-- For production: Consider setting up a pg_cron job or Supabase scheduled function
-- to run the cleanup query once per day at a low-traffic time
