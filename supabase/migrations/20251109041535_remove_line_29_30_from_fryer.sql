/*
  # Remove Line 29 and 30 from Fryer Area

  ## Problem
  Fryer area bagian currently have line 29 and 30 in their line_numbers
  But according to requirements, line 29 and 30 should ONLY be for Dryer area

  ## Solution
  Remove "29" and "30" from line_numbers of all Fryer bagian

  ## Changes
  Update all sanitation_bagian in Fryer area:
  - Remove "29" and "30" from their line_numbers arrays
  - Keep all other line numbers intact
*/

-- Update Fryer bagian to remove line 29 and 30
UPDATE sanitation_bagian
SET line_numbers = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(line_numbers) elem
  WHERE elem NOT IN ('29', '30')
)
WHERE area_id = (SELECT id FROM sanitation_areas WHERE name = 'Fryer');

-- Verify the update
DO $$
DECLARE
  fryer_with_29_30 INTEGER;
BEGIN
  SELECT COUNT(*) INTO fryer_with_29_30
  FROM sanitation_bagian sb
  JOIN sanitation_areas sa ON sb.area_id = sa.id
  WHERE sa.name = 'Fryer' 
    AND (sb.line_numbers @> '["29"]' OR sb.line_numbers @> '["30"]');
  
  IF fryer_with_29_30 > 0 THEN
    RAISE WARNING 'Still % Fryer bagian with line 29 or 30', fryer_with_29_30;
  ELSE
    RAISE NOTICE 'Successfully removed line 29 and 30 from all Fryer bagian';
  END IF;
END $$;
