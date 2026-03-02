/*
  # Fix RLS Policies for sanitation_records Table
  
  ## Problem
  RLS is enabled on sanitation_records table but no policies exist,
  causing INSERT operations to fail with error code 42501.
  
  ## Solution
  Create permissive policies to allow all operations for both:
  1. Anonymous users (anon) - using Supabase anon key
  2. Authenticated users (authenticated) - if they switch to Supabase auth later
  
  ## Security Notes
  - This is an internal sanitation tracking app
  - Users are tracked via created_by field
  - All operations are logged with timestamps
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous to view all records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow anonymous to insert records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow anonymous to update records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow anonymous to delete records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow authenticated to view all records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow authenticated to insert records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow authenticated to update records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow authenticated to delete records" ON sanitation_records;

-- Policies for anonymous users (using anon key)
CREATE POLICY "Allow anonymous to view all records"
  ON sanitation_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to insert records"
  ON sanitation_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to update records"
  ON sanitation_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to delete records"
  ON sanitation_records
  FOR DELETE
  TO anon
  USING (true);

-- Policies for authenticated users
CREATE POLICY "Allow authenticated to view all records"
  ON sanitation_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to insert records"
  ON sanitation_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to update records"
  ON sanitation_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete records"
  ON sanitation_records
  FOR DELETE
  TO authenticated
  USING (true);
