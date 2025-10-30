/*
  # Fix app_users updated_at column type

  1. Changes
    - Change `updated_at` column type from text to timestamptz
    - Set default value to now()
    - Update any existing text values to proper timestamps

  2. Notes
    - This fixes the incorrect data type that was causing issues
    - Ensures timestamps are properly stored and handled
*/

-- First, try to convert existing text values to timestamps
-- If conversion fails, use current timestamp
UPDATE app_users
SET updated_at = CASE
  WHEN updated_at IS NULL OR updated_at = '' THEN now()::text
  WHEN updated_at ~ '^\d{4}-\d{2}-\d{2}' THEN updated_at
  ELSE now()::text
END
WHERE updated_at IS NOT NULL;

-- Change column type from text to timestamptz
ALTER TABLE app_users 
ALTER COLUMN updated_at TYPE timestamptz 
USING CASE
  WHEN updated_at IS NULL OR updated_at = '' THEN now()
  ELSE updated_at::timestamptz
END;

-- Set default value for future updates
ALTER TABLE app_users 
ALTER COLUMN updated_at SET DEFAULT now();