/*
  # Fix Line Numbers to Proper JSONB Array

  ## Problem
  line_numbers stored as JSONB string type instead of JSONB array:
  - Current: "[\"29\",\"30\"]" (JSONB string)
  - Expected: ["29","30"] (JSONB array)

  ## Solution
  Convert JSONB string to JSONB array by parsing the string value

  ## Changes
  - Parse string JSONB values to proper arrays
  - Ensure all line_numbers are JSONB array type
*/

-- Fix line_numbers that are JSONB strings (need to parse)
UPDATE sanitation_bagian
SET line_numbers = (line_numbers #>> '{}')::jsonb
WHERE jsonb_typeof(line_numbers) = 'string';

-- Verify the fix
DO $$
DECLARE
  string_count INTEGER;
  array_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO string_count
  FROM sanitation_bagian
  WHERE jsonb_typeof(line_numbers) = 'string';
  
  SELECT COUNT(*) INTO array_count
  FROM sanitation_bagian
  WHERE jsonb_typeof(line_numbers) = 'array';
  
  RAISE NOTICE 'String type count: %, Array type count: %', string_count, array_count;
END $$;
