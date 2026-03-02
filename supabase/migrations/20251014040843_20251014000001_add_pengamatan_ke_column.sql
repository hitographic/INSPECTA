/*
  # Add Pengamatan_ke Column

  1. Changes
    - Add `pengamatan_ke` column as alias for better CSV compatibility
    - This column will store the same value as `pengamatan` column
    - Keep backward compatibility

  2. Notes
    - Non-destructive migration
    - Uses IF NOT EXISTS checks
*/

-- Add pengamatan_ke column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kliping_records' AND column_name = 'pengamatan_ke'
  ) THEN
    ALTER TABLE kliping_records ADD COLUMN pengamatan_ke text;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kliping_pengamatan_ke ON kliping_records(pengamatan_ke);
