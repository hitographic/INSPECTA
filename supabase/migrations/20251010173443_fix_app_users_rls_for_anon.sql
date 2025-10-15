/*
  # Fix RLS Policies for app_users and user_permissions - Add anon role support
  
  ## Problem
  Current policies only allow 'public' role, but the app uses Supabase anon key
  which requires explicit 'anon' role policies for CRUD operations.
  
  ## Solution
  Add RLS policies for 'anon' role to allow full CRUD operations on:
  1. app_users table
  2. user_permissions table
  
  ## Security Notes
  - This is an internal admin management app
  - All operations are tracked with created_by/updated_at
  - Access control is handled at application level
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anon to read users" ON app_users;
DROP POLICY IF EXISTS "Allow anon to insert users" ON app_users;
DROP POLICY IF EXISTS "Allow anon to update users" ON app_users;
DROP POLICY IF EXISTS "Allow anon to delete users" ON app_users;
DROP POLICY IF EXISTS "Allow anon to read permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow anon to insert permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow anon to update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow anon to delete permissions" ON user_permissions;

-- RLS Policies for app_users (anon role)
CREATE POLICY "Allow anon to read users"
  ON app_users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert users"
  ON app_users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update users"
  ON app_users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete users"
  ON app_users FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for user_permissions (anon role)
CREATE POLICY "Allow anon to read permissions"
  ON user_permissions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert permissions"
  ON user_permissions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update permissions"
  ON user_permissions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete permissions"
  ON user_permissions FOR DELETE
  TO anon
  USING (true);

-- Also add for permission_definitions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permission_definitions' 
    AND policyname = 'Allow anon to read permission definitions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon to read permission definitions"
      ON permission_definitions FOR SELECT
      TO anon
      USING (true)';
  END IF;
END $$;
