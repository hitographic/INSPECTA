/*
  # Restructure Kliping Records for Separate Flavor Records

  1. Changes
    - Drop old pengamatan_1 to pengamatan_4 columns
    - Add single set of fields: pengamatan, flavor, mesin
    - Each record now represents ONE flavor observation
    - Multiple flavors = multiple records with same tanggal/line/shift
    - Photos are now directly in the record (not shared)
    - Add unique constraint on tanggal+line+shift+pengamatan to prevent duplicates

  2. Migration Strategy
    - Backup existing data by keeping old columns temporarily
    - Add new columns
    - Create unique index for data integrity

  3. Security
    - Keep existing RLS policies
*/

-- Add new single pengamatan/flavor/mesin columns
DO $$
BEGIN
  -- Add pengamatan column (single value: 1, 2, 3, or 4)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kliping_records' AND column_name = 'pengamatan'
  ) THEN
    ALTER TABLE kliping_records ADD COLUMN pengamatan text;
  END IF;

  -- Add flavor column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kliping_records' AND column_name = 'flavor'
  ) THEN
    ALTER TABLE kliping_records ADD COLUMN flavor text;
  END IF;

  -- Add mesin column (single value now)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kliping_records' AND column_name = 'mesin'
  ) THEN
    ALTER TABLE kliping_records ADD COLUMN mesin text;
  END IF;

  -- Add timestamp for when this observation was created
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kliping_records' AND column_name = 'pengamatan_timestamp'
  ) THEN
    ALTER TABLE kliping_records ADD COLUMN pengamatan_timestamp timestamptz;
  END IF;
END $$;

-- Create unique index to prevent duplicate pengamatan for same tanggal/line/shift/pengamatan
CREATE UNIQUE INDEX IF NOT EXISTS idx_kliping_unique_pengamatan 
  ON kliping_records(plant, tanggal, line, regu, shift, pengamatan);

-- Add index on new columns for faster queries
CREATE INDEX IF NOT EXISTS idx_kliping_pengamatan ON kliping_records(pengamatan);
CREATE INDEX IF NOT EXISTS idx_kliping_flavor ON kliping_records(flavor);
CREATE INDEX IF NOT EXISTS idx_kliping_mesin ON kliping_records(mesin);
