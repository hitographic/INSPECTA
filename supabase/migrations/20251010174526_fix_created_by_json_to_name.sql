/*
  # Fix created_by Field - Extract Full Name from JSON

  ## Problem
  The created_by field in sanitation_records contains entire JSON user objects
  instead of just the user's name. Example:
  {"id":"xxx","username":"manajer","full_name":"Manager",...}

  ## Solution
  1. Parse the JSON string in created_by field
  2. Extract the full_name or username
  3. Update all records to use only the name string

  ## Tables Fixed
  - sanitation_records: Clean up created_by field
*/

-- Update records where created_by contains JSON object
UPDATE sanitation_records
SET created_by = COALESCE(
  (created_by::jsonb->>'full_name'),
  (created_by::jsonb->>'username'),
  'Unknown'
)
WHERE created_by LIKE '{%' 
  AND created_by::jsonb IS NOT NULL;

-- Update any records with 'anonymous' or empty created_by
UPDATE sanitation_records
SET created_by = 'QC Field'
WHERE created_by IS NULL 
   OR created_by = '' 
   OR created_by = 'anonymous';

-- Verify the changes
DO $$
DECLARE
  json_count INTEGER;
  clean_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO json_count
  FROM sanitation_records
  WHERE created_by LIKE '{%';

  SELECT COUNT(*) INTO clean_count
  FROM sanitation_records
  WHERE created_by NOT LIKE '{%' AND LENGTH(created_by) < 100;

  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  - Records with JSON: %', json_count;
  RAISE NOTICE '  - Records with clean names: %', clean_count;
END $$;
