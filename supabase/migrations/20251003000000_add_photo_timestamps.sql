/*
  # Add Photo Timestamp Columns

  1. Changes
    - Add `foto_sebelum_timestamp` column to store timestamp when "before" photo was taken
    - Add `foto_sesudah_timestamp` column to store timestamp when "after" photo was taken

  2. Important Notes
    - These columns store the exact timestamp when each photo was captured
    - Format: ISO 8601 timestamp string (e.g., "2025-10-03T08:56:05")
    - These are separate from created_at which tracks when the record was saved
*/

-- Add foto_sebelum_timestamp column
ALTER TABLE sanitation_records
ADD COLUMN IF NOT EXISTS foto_sebelum_timestamp TEXT;

-- Add foto_sesudah_timestamp column
ALTER TABLE sanitation_records
ADD COLUMN IF NOT EXISTS foto_sesudah_timestamp TEXT;
