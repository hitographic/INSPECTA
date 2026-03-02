/*
  # Remove regu and shift columns from monitoring_records

  1. Changes
    - Remove `regu` column from monitoring_records table
    - Remove `shift` column from monitoring_records table

  2. Notes
    - This migration removes the regu and shift tracking from monitoring records
    - Existing data in these columns will be permanently deleted
*/

-- Remove regu and shift columns
ALTER TABLE monitoring_records DROP COLUMN IF EXISTS regu;
ALTER TABLE monitoring_records DROP COLUMN IF EXISTS shift;
