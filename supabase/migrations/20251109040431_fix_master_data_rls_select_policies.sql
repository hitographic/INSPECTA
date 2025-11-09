/*
  # Fix Master Data RLS - Add Missing SELECT Policies

  ## Problem
  - Tables sanitation_areas and sanitation_bagian have RLS enabled
  - BUT no policies exist, blocking ALL queries (even SELECT)
  - This causes empty data in Master Data Management page

  ## Solution
  - Add SELECT policies that allow public read access
  - Add INSERT, UPDATE, DELETE policies for authenticated operations
  - Match existing security model: app-level auth with permissive DB policies

  ## Security
  - Application handles authentication via authService
  - MasterDataManagement page checks permissions before allowing access
  - Database policies are permissive to allow anon key usage
*/

-- ============================================
-- SANITATION_AREAS POLICIES
-- ============================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Public read access to areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Allow insert areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Allow update areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Allow delete areas" ON sanitation_areas;

-- Allow everyone to SELECT all areas
CREATE POLICY "Public read access to areas"
  ON sanitation_areas
  FOR SELECT
  TO public
  USING (true);

-- Allow INSERT (app handles auth)
CREATE POLICY "Allow insert areas"
  ON sanitation_areas
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow UPDATE (app handles auth)
CREATE POLICY "Allow update areas"
  ON sanitation_areas
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow DELETE (app handles auth)
CREATE POLICY "Allow delete areas"
  ON sanitation_areas
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- SANITATION_BAGIAN POLICIES
-- ============================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Public read access to bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Allow insert bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Allow update bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Allow delete bagian" ON sanitation_bagian;

-- Allow everyone to SELECT all bagian
CREATE POLICY "Public read access to bagian"
  ON sanitation_bagian
  FOR SELECT
  TO public
  USING (true);

-- Allow INSERT (app handles auth)
CREATE POLICY "Allow insert bagian"
  ON sanitation_bagian
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow UPDATE (app handles auth)
CREATE POLICY "Allow update bagian"
  ON sanitation_bagian
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow DELETE (app handles auth)
CREATE POLICY "Allow delete bagian"
  ON sanitation_bagian
  FOR DELETE
  TO public
  USING (true);
