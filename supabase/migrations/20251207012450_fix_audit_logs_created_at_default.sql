/*
  # Fix created_at default value in audit_logs

  ## Issue
  - The created_at column doesn't have a default value
  - New records have NULL created_at

  ## Solution
  - Set default value for created_at to now()
  - Update existing NULL values

  ## Changes
  - Update NULL created_at values to use deleted_at as fallback
  - Set proper default value
*/

-- Update existing NULL created_at values
UPDATE audit_logs 
SET created_at = COALESCE(deleted_at, now())
WHERE created_at IS NULL;

-- Set default for created_at
ALTER TABLE audit_logs 
  ALTER COLUMN created_at SET DEFAULT now();

-- Make it NOT NULL
ALTER TABLE audit_logs 
  ALTER COLUMN created_at SET NOT NULL;

-- Add comment
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when audit log entry was created (auto-filled on insert)';
