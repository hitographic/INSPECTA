/*
  # Replace record_data with affected_count in audit_logs

  ## Changes Made
  1. Schema Changes
    - Drop column `record_data` (jsonb) - removes heavy data storage
    - Add column `affected_count` (integer) - stores count of affected records
      - Default value: 1 (for single record operations)
      - NOT NULL to ensure value is always present

  2. Benefits
    - Reduces database size significantly
    - Faster queries on audit logs
    - Still maintains count information for reporting
    - Removes unnecessary data duplication

  3. Migration Safety
    - Uses IF EXISTS/IF NOT EXISTS for idempotency
    - Adds default value to prevent null issues
    - Existing audit log data will lose detailed record info but retain count

  ## Notes
  - For existing records, affected_count will default to 1
  - Bulk operations already tracked count in additional_info.count
  - This makes audit_logs table much lighter and faster
*/

-- Drop record_data column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'record_data'
  ) THEN
    ALTER TABLE audit_logs DROP COLUMN record_data;
  END IF;
END $$;

-- Add affected_count column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'affected_count'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN affected_count integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Update comment
COMMENT ON TABLE audit_logs IS 'Tracks all delete operations with count of affected records';
COMMENT ON COLUMN audit_logs.affected_count IS 'Number of records affected by this operation (1 for single delete, N for bulk delete)';
