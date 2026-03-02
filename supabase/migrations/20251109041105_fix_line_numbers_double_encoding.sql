/*
  # Fix Line Numbers Double Encoding

  ## Problem
  Some line_numbers in sanitation_bagian are double-encoded as strings:
  - Wrong: "[\"29\",\"30\"]" (string containing JSON)
  - Correct: ["29","30"] (JSONB array)

  ## Solution
  Update all line_numbers that are stored as strings to proper JSONB arrays

  ## Changes
  - Parse string values and convert to JSONB arrays
  - Ensure all line_numbers are consistent JSONB format
*/

-- Update line_numbers that are stored as strings (with backslash escapes)
UPDATE sanitation_bagian
SET line_numbers = (line_numbers::text)::jsonb
WHERE line_numbers::text LIKE '%\\%';

-- Verify: Check if any rows still have issues
DO $$
DECLARE
  issue_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO issue_count
  FROM sanitation_bagian
  WHERE line_numbers::text LIKE '%\\%';
  
  IF issue_count > 0 THEN
    RAISE WARNING 'Still % rows with encoding issues', issue_count;
  ELSE
    RAISE NOTICE 'All line_numbers are properly formatted';
  END IF;
END $$;
