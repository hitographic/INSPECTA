/*
  # Fix Supervisors Table - Add Default Values and RLS Policies
  
  ## Problem
  The supervisors table needs:
  1. Default value for id column (if not already set)
  2. Default values for timestamps
  3. RLS policies for anon role access
  
  ## Solution
  1. Add gen_random_uuid() default for id if missing
  2. Add now() default for created_at and updated_at
  3. Add RLS policies for anon role (SELECT, INSERT, UPDATE, DELETE)
  
  ## Security Notes
  - Allows anon role to manage supervisor data
  - Required for admin panel functionality
*/

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix id column default if not set
DO $$
BEGIN
  -- Check if id column needs default value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' 
    AND column_name = 'id' 
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE supervisors ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add default values for timestamps
ALTER TABLE supervisors 
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE supervisors ALTER COLUMN updated_at SET DEFAULT now();
  END IF;
END $$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anon to read supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow anon to insert supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow anon to update supervisors" ON supervisors;
DROP POLICY IF EXISTS "Allow anon to delete supervisors" ON supervisors;

-- Enable RLS if not enabled
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supervisors (anon role)
CREATE POLICY "Allow anon to read supervisors"
  ON supervisors FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert supervisors"
  ON supervisors FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update supervisors"
  ON supervisors FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete supervisors"
  ON supervisors FOR DELETE
  TO anon
  USING (true);

-- Insert default supervisor data if table is empty
INSERT INTO supervisors (plant, supervisor_name)
SELECT 'Plant-1', 'Supervisor Plant 1'
WHERE NOT EXISTS (SELECT 1 FROM supervisors WHERE plant = 'Plant-1');

INSERT INTO supervisors (plant, supervisor_name)
SELECT 'Plant-2', 'Supervisor Plant 2'
WHERE NOT EXISTS (SELECT 1 FROM supervisors WHERE plant = 'Plant-2');

INSERT INTO supervisors (plant, supervisor_name)
SELECT 'Plant-3', 'Supervisor Plant 3'
WHERE NOT EXISTS (SELECT 1 FROM supervisors WHERE plant = 'Plant-3');

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Supervisors table fixed with default values and RLS policies';
END $$;
