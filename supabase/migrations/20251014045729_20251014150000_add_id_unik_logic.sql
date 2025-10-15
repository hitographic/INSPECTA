/*
  # Add id_unik Grouping Logic

  1. Changes
    - Add index on id_unik for grouping queries
    - id_unik format: [Flavor][Pengamatan_ke] (e.g., AB1, SM2, GRS3)
    - Multiple rows can have same id_unik but different Mesin
    - This allows one flavor to have multiple mesin records

  2. Examples
    - id_unik = "AB1" → Flavor AB, Pengamatan 1
    - Can have: AB1 + Mesin 1, AB1 + Mesin 2
    - id_unik = "SM2" → Flavor SM, Pengamatan 2
    - Can have: SM2 + Mesin 1, SM2 + Mesin 2

  3. Notes
    - id_unik is NOT unique (multiple mesin per flavor)
    - Unique constraint is on (plant, tanggal, line, regu, shift, id_unik, Mesin)
*/

-- Create index for id_unik grouping
CREATE INDEX IF NOT EXISTS idx_kliping_id_unik ON kliping_records(id_unik);

-- Add unique constraint to prevent exact duplicates
-- Same id_unik can exist with different Mesin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_kliping_session_mesin'
  ) THEN
    ALTER TABLE kliping_records 
    ADD CONSTRAINT unique_kliping_session_mesin 
    UNIQUE (plant, tanggal, line, regu, shift, id_unik, "Mesin");
  END IF;
END $$;
