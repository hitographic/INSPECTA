/*
  # Fix Duplicate RLS Policies

  ## Problem
  Multiple permissive policies exist for the same role and action (SELECT),
  causing performance degradation as Supabase must execute all policies for every query.

  ## Affected Tables
  - line_configurations
  - sanitation_areas
  - sanitation_bagian
  - supervisors

  ## Solution
  Drop duplicate policies that were created manually:
  - "Allow public to read [table_name]" (redundant)
  - "Allow public to manage [table_name]" (redundant)

  Keep only the specific action policies from migration 20251010000002:
  - "Public read access to [table]" for SELECT
  - "Allow insert [table]" for INSERT
  - "Allow update [table]" for UPDATE
  - "Allow delete [table]" for DELETE

  ## Security
  Application-level authentication via authService is already in place.
  RLS is open but app enforces permissions.
*/

-- ============================================
-- LINE_CONFIGURATIONS
-- ============================================

-- Drop duplicate policies (if they exist)
DROP POLICY IF EXISTS "Allow public to read line_configurations" ON line_configurations;
DROP POLICY IF EXISTS "Allow public to manage line_configurations" ON line_configurations;

-- ============================================
-- SANITATION_AREAS
-- ============================================

-- Drop duplicate policies (if they exist)
DROP POLICY IF EXISTS "Allow public to read sanitation_areas" ON sanitation_areas;
DROP POLICY IF EXISTS "Allow public to manage sanitation_areas" ON sanitation_areas;

-- ============================================
-- SANITATION_BAGIAN
-- ============================================

-- Drop duplicate policies (if they exist)
DROP POLICY IF EXISTS "Allow public to read sanitation_bagian" ON sanitation_bagian;
DROP POLICY IF EXISTS "Allow public to manage sanitation_bagian" ON sanitation_bagian;

-- ============================================
-- SUPERVISORS
-- ============================================

-- Drop duplicate policies (if they exist)
DROP POLICY IF EXISTS "Allow public to read supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow public to manage supervisors" ON supervisors;

-- Ensure supervisors table has proper policies (from previous migrations)
DO $$
BEGIN
  -- Check and create SELECT policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supervisors'
    AND policyname = 'Public read access to supervisors'
  ) THEN
    CREATE POLICY "Public read access to supervisors"
      ON supervisors
      FOR SELECT
      USING (true);
  END IF;

  -- Check and create INSERT policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supervisors'
    AND policyname = 'Allow insert supervisors'
  ) THEN
    CREATE POLICY "Allow insert supervisors"
      ON supervisors
      FOR INSERT
      WITH CHECK (true);
  END IF;

  -- Check and create UPDATE policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supervisors'
    AND policyname = 'Allow update supervisors'
  ) THEN
    CREATE POLICY "Allow update supervisors"
      ON supervisors
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Check and create DELETE policy if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'supervisors'
    AND policyname = 'Allow delete supervisors'
  ) THEN
    CREATE POLICY "Allow delete supervisors"
      ON supervisors
      FOR DELETE
      USING (true);
  END IF;
END $$;
