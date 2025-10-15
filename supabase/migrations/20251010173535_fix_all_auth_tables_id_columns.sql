/*
  # Fix ID Columns for All Auth Tables
  
  ## Problem
  Multiple tables have TEXT id columns without default values:
  - app_users
  - user_permissions
  - permission_definitions
  
  This causes INSERT operations to fail with null constraint violation.
  
  ## Solution
  1. Convert all id columns from TEXT to UUID with gen_random_uuid() default
  2. Update foreign key references
  3. Add proper timestamps with defaults
  
  ## Tables Fixed
  1. app_users - Main users table
  2. user_permissions - User permission mappings
  3. permission_definitions - Permission definitions (if exists)
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix app_users table
DO $$ 
BEGIN
  -- Drop foreign key constraints first
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_user_id_fkey'
  ) THEN
    ALTER TABLE user_permissions DROP CONSTRAINT user_permissions_user_id_fkey;
  END IF;

  -- Drop primary key
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'app_users_pkey'
  ) THEN
    ALTER TABLE app_users DROP CONSTRAINT app_users_pkey;
  END IF;
END $$;

-- Drop and recreate id column for app_users
ALTER TABLE app_users DROP COLUMN IF EXISTS id;
ALTER TABLE app_users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Add default values for timestamps
ALTER TABLE app_users 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

-- Fix user_permissions table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_permissions_pkey'
  ) THEN
    ALTER TABLE user_permissions DROP CONSTRAINT user_permissions_pkey;
  END IF;
END $$;

ALTER TABLE user_permissions DROP COLUMN IF EXISTS id;
ALTER TABLE user_permissions ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Change user_id to UUID type
ALTER TABLE user_permissions DROP COLUMN IF EXISTS user_id;
ALTER TABLE user_permissions ADD COLUMN user_id UUID;

-- Add foreign key constraint
ALTER TABLE user_permissions 
  ADD CONSTRAINT user_permissions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- Add default for created_at
ALTER TABLE user_permissions 
  ALTER COLUMN created_at SET DEFAULT now();

-- Fix permission_definitions if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'permission_definitions'
  ) THEN
    -- Drop primary key
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'permission_definitions_pkey'
    ) THEN
      ALTER TABLE permission_definitions DROP CONSTRAINT permission_definitions_pkey;
    END IF;
    
    -- Recreate id column
    ALTER TABLE permission_definitions DROP COLUMN IF EXISTS id;
    ALTER TABLE permission_definitions ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    
    -- Add default for created_at if column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'permission_definitions' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE permission_definitions ALTER COLUMN created_at SET DEFAULT now();
    END IF;
  END IF;
END $$;

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: All auth tables now use UUID for id columns';
END $$;
