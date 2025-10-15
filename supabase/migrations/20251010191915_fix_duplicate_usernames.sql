/*
  # Fix Duplicate Usernames Issue

  1. Problem
    - Multiple users with same username exist in app_users table
    - This causes login to fail with .maybeSingle() when duplicates exist
    - 85+ usernames have duplicates (some have 21 duplicates!)

  2. Solution
    - Keep only the FIRST record for each username (oldest by created_at)
    - Delete all duplicate records
    - Add UNIQUE constraint on username column to prevent future duplicates

  3. Changes
    - DELETE duplicate records (keep first occurrence)
    - ALTER TABLE to add UNIQUE constraint on username
    - This ensures one user per username going forward

  4. Safety
    - Uses DISTINCT ON to identify first record
    - Deletes only duplicates, not original records
    - Transaction ensures atomicity
*/

-- Step 1: Delete duplicate records (keep only the first one based on created_at)
DELETE FROM app_users
WHERE id NOT IN (
  SELECT DISTINCT ON (username) id
  FROM app_users
  ORDER BY username, created_at ASC
);

-- Step 2: Add UNIQUE constraint to username column to prevent future duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'app_users_username_unique'
  ) THEN
    ALTER TABLE app_users 
    ADD CONSTRAINT app_users_username_unique UNIQUE (username);
  END IF;
END $$;

-- Step 3: Verify no duplicates remain
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT username, COUNT(*) as count
    FROM app_users
    GROUP BY username
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicates still exist after cleanup!';
  END IF;
END $$;
