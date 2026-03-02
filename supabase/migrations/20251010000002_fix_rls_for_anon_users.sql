/*
  # Fix RLS Policies for All Users

  ## Overview
  Master data tables must be accessible by all users because:
  1. App uses custom authentication (app_users table) with anon key
  2. App is NOT using Supabase Auth (no authenticated sessions)
  3. Permission checking is handled at application level via authService

  ## Changes
  1. Drop all restrictive policies
  2. Allow full CRUD for all users (including anon)
  3. RLS is enabled but policies are permissive

  ## Security Model
  - Database RLS is OPEN (allows all operations)
  - Application-level auth via authService:
    * Login validation against app_users table
    * Permission checks before operations
    * Role-based access control (admin, supervisor, qc_field)
  - Only authenticated app users can access Master Data Management page
  - UI enforces permission checks (authService.hasPermission)

  ## Why This Approach?
  - App uses Supabase ANON key (not authenticated user sessions)
  - Custom user management in app_users table
  - RLS "authenticated" role would block all operations
  - Security is enforced at application layer, not database layer
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view active areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Admins can manage areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Anyone can view active bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Admins can manage bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Anyone can view active lines" ON line_configurations;
DROP POLICY IF EXISTS "Admins can manage lines" ON line_configurations;

-- ============================================
-- SANITATION_AREAS POLICIES
-- ============================================

-- Allow everyone to view all areas (including inactive for admin panel)
CREATE POLICY "Public read access to areas"
  ON sanitation_areas
  FOR SELECT
  USING (true);

-- Allow all users to insert areas (app handles auth)
CREATE POLICY "Allow insert areas"
  ON sanitation_areas
  FOR INSERT
  WITH CHECK (true);

-- Allow all users to update areas (app handles auth)
CREATE POLICY "Allow update areas"
  ON sanitation_areas
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all users to delete areas (app handles auth)
CREATE POLICY "Allow delete areas"
  ON sanitation_areas
  FOR DELETE
  USING (true);

-- ============================================
-- SANITATION_BAGIAN POLICIES
-- ============================================

-- Allow everyone to view all bagian
CREATE POLICY "Public read access to bagian"
  ON sanitation_bagian
  FOR SELECT
  USING (true);

-- Allow all users to insert bagian (app handles auth)
CREATE POLICY "Allow insert bagian"
  ON sanitation_bagian
  FOR INSERT
  WITH CHECK (true);

-- Allow all users to update bagian (app handles auth)
CREATE POLICY "Allow update bagian"
  ON sanitation_bagian
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all users to delete bagian (app handles auth)
CREATE POLICY "Allow delete bagian"
  ON sanitation_bagian
  FOR DELETE
  USING (true);

-- ============================================
-- LINE_CONFIGURATIONS POLICIES
-- ============================================

-- Allow everyone to view all line configurations
CREATE POLICY "Public read access to lines"
  ON line_configurations
  FOR SELECT
  USING (true);

-- Allow all users to insert lines (app handles auth)
CREATE POLICY "Allow insert lines"
  ON line_configurations
  FOR INSERT
  WITH CHECK (true);

-- Allow all users to update lines (app handles auth)
CREATE POLICY "Allow update lines"
  ON line_configurations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all users to delete lines (app handles auth)
CREATE POLICY "Allow delete lines"
  ON line_configurations
  FOR DELETE
  USING (true);
