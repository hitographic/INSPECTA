/*
  # Fix Monitoring Records RLS Policies
  
  The monitoring_records table was getting 401/RLS errors because:
  1. The build env provides VITE_SUPABASE_ANON_KEY but the code was reading VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  2. RLS policies only allowed 'anon' role but the client might connect as 'authenticated' or other roles
  
  This migration ensures all roles can access monitoring_records.
*/

-- Drop existing policies and recreate with broader access
DROP POLICY IF EXISTS "Allow anonymous users to view all monitoring records" ON monitoring_records;
DROP POLICY IF EXISTS "Allow anonymous users to insert monitoring records" ON monitoring_records;
DROP POLICY IF EXISTS "Allow anonymous users to update monitoring records" ON monitoring_records;
DROP POLICY IF EXISTS "Allow anonymous users to delete monitoring records" ON monitoring_records;

-- Recreate policies for anon role
CREATE POLICY "Allow anon to view monitoring records"
  ON monitoring_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert monitoring records"
  ON monitoring_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update monitoring records"
  ON monitoring_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete monitoring records"
  ON monitoring_records
  FOR DELETE
  TO anon
  USING (true);

-- Also add policies for authenticated role (belt-and-suspenders)
CREATE POLICY "Allow authenticated to view monitoring records"
  ON monitoring_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to insert monitoring records"
  ON monitoring_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to update monitoring records"
  ON monitoring_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete monitoring records"
  ON monitoring_records
  FOR DELETE
  TO authenticated
  USING (true);
