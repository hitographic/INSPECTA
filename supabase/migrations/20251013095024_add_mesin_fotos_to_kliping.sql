/*
  # Add Mesin-Based Photo Storage to Kliping Records

  1. Changes
    - Add `mesin_fotos` JSONB column to store photos grouped by mesin
    - Structure: {
        "Mesin 1": {
          "foto_etiket": "base64...",
          "foto_banded": "base64...",
          ...
        },
        "Mesin 2": { ... },
        ...
      }
    - This allows dynamic photo storage when user switches between mesins
    
  2. Migration Safety
    - Uses IF NOT EXISTS checks
    - Non-destructive - keeps existing foto columns for backward compatibility
*/

-- Add mesin_fotos column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kliping_records' AND column_name = 'mesin_fotos'
  ) THEN
    ALTER TABLE kliping_records ADD COLUMN mesin_fotos JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_kliping_mesin_fotos ON kliping_records USING gin(mesin_fotos);
