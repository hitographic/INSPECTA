/*
  # Fix deleted_at timestamp in audit_logs

  ## Issue
  - The deleted_at column is storing NULL values instead of timestamps
  - This causes the UI to display "1 Jan 1970" for all entries

  ## Solution
  1. Update existing NULL values to use created_at timestamp
  2. Set default value for deleted_at to now()
  3. Make column NOT NULL after data is fixed

  ## Changes
  - Update all existing NULL deleted_at values
  - Set proper default and NOT NULL constraint
*/

-- First, update created_at to have default if it doesn't
DO $$ 
BEGIN
  ALTER TABLE audit_logs 
    ALTER COLUMN created_at SET DEFAULT now();
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Update existing NULL deleted_at values to use created_at
UPDATE audit_logs 
SET deleted_at = COALESCE(created_at, now())
WHERE deleted_at IS NULL;

-- Set default for deleted_at
ALTER TABLE audit_logs 
  ALTER COLUMN deleted_at SET DEFAULT now();

-- Now make it NOT NULL since all values are filled
ALTER TABLE audit_logs 
  ALTER COLUMN deleted_at SET NOT NULL;

-- Add comment
COMMENT ON COLUMN audit_logs.deleted_at IS 'Timestamp when the record was deleted (auto-filled on insert)';
