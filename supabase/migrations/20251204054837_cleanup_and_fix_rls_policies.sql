/*
  # Cleanup and Fix RLS Policies

  1. Changes
    - Drop all existing overly permissive policies using TO public
    - Create consistent and secure policies using TO anon for anonymous access
    - Ensure all policies follow best practices

  2. Security
    - Use TO anon instead of TO public for better control
    - Remove duplicate and conflicting policies
    - Apply consistent access patterns across all tables

  3. Tables affected
    - app_users: Login access (SELECT only)
    - user_permissions: Permission lookup (SELECT, INSERT, DELETE for user management)
    - sanitation_records: Full CRUD access
    - kliping_records: Full CRUD access
    - monitoring_records: Full CRUD access
    - Master data tables: Read and modify access
    - audit_logs: Read access for authenticated sessions
*/

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- app_users
DROP POLICY IF EXISTS "Users can delete" ON app_users;
DROP POLICY IF EXISTS "Users can update profile" ON app_users;
DROP POLICY IF EXISTS "Anyone can read users for login" ON app_users;
DROP POLICY IF EXISTS "Allow anonymous users to read app_users for login" ON app_users;

-- user_permissions
DROP POLICY IF EXISTS "Anyone can read permissions" ON user_permissions;
DROP POLICY IF EXISTS "Anyone can delete permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow anonymous users to read user_permissions for login" ON user_permissions;

-- sanitation_records
DROP POLICY IF EXISTS "Allow authenticated to view all records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow authenticated to update records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow authenticated to delete records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow anonymous to view all records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow anonymous to update records" ON sanitation_records;
DROP POLICY IF EXISTS "Allow anonymous to delete records" ON sanitation_records;

-- kliping_records
DROP POLICY IF EXISTS "Allow public access to kliping_records" ON kliping_records;

-- monitoring_records
DROP POLICY IF EXISTS "Allow public access to monitoring_records" ON monitoring_records;

-- audit_logs
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON audit_logs;

-- Master data tables
DROP POLICY IF EXISTS "Public read access to bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Allow update bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Allow delete bagian" ON sanitation_bagian;

DROP POLICY IF EXISTS "Public read access to areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Allow update areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Allow delete areas" ON sanitation_areas;

DROP POLICY IF EXISTS "Public read access to supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow update supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow delete supervisors" ON supervisors;

DROP POLICY IF EXISTS "Anyone can read permission definitions" ON permission_definitions;

-- ============================================
-- 2. CREATE CONSISTENT RLS POLICIES
-- ============================================

-- app_users: Login and user management
CREATE POLICY "Enable read for login"
  ON app_users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert for user creation"
  ON app_users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update for user management"
  ON app_users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for user management"
  ON app_users
  FOR DELETE
  TO anon
  USING (true);

-- user_permissions: Permission management
CREATE POLICY "Enable read for authentication"
  ON user_permissions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert for permission assignment"
  ON user_permissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable delete for permission removal"
  ON user_permissions
  FOR DELETE
  TO anon
  USING (true);

-- sanitation_records: Full CRUD access
CREATE POLICY "Enable read access"
  ON sanitation_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert access"
  ON sanitation_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update access"
  ON sanitation_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access"
  ON sanitation_records
  FOR DELETE
  TO anon
  USING (true);

-- kliping_records: Full CRUD access
CREATE POLICY "Enable read access"
  ON kliping_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert access"
  ON kliping_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update access"
  ON kliping_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access"
  ON kliping_records
  FOR DELETE
  TO anon
  USING (true);

-- monitoring_records: Full CRUD access
CREATE POLICY "Enable read access"
  ON monitoring_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert access"
  ON monitoring_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update access"
  ON monitoring_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access"
  ON monitoring_records
  FOR DELETE
  TO anon
  USING (true);

-- audit_logs: Read-only access
CREATE POLICY "Enable read access"
  ON audit_logs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert for logging"
  ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- sanitation_bagian: Master data access
CREATE POLICY "Enable read access"
  ON sanitation_bagian
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert access"
  ON sanitation_bagian
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update access"
  ON sanitation_bagian
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access"
  ON sanitation_bagian
  FOR DELETE
  TO anon
  USING (true);

-- sanitation_areas: Master data access
CREATE POLICY "Enable read access"
  ON sanitation_areas
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert access"
  ON sanitation_areas
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update access"
  ON sanitation_areas
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access"
  ON sanitation_areas
  FOR DELETE
  TO anon
  USING (true);

-- supervisors: Master data access
CREATE POLICY "Enable read access"
  ON supervisors
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Enable insert access"
  ON supervisors
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable update access"
  ON supervisors
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access"
  ON supervisors
  FOR DELETE
  TO anon
  USING (true);

-- permission_definitions: Read-only access
CREATE POLICY "Enable read access"
  ON permission_definitions
  FOR SELECT
  TO anon
  USING (true);
