/*
  # Restrict Line 29 and 30 to Dryer Area Only

  ## Problem
  Multiple areas have line 29 and 30 in their line_numbers:
  - Silo, Alkali Ingredient, Mixer, Roll Press, Steambox, Cooling Box, Packing
  
  But according to requirements, line 29 and 30 should ONLY exist in Dryer area

  ## Solution
  Remove "29" and "30" from line_numbers of ALL areas EXCEPT Dryer

  ## Changes
  Update all sanitation_bagian NOT in Dryer area:
  - Remove "29" and "30" from their line_numbers arrays
  - Keep all other line numbers intact
  - Dryer area remains unchanged (keeps 29 and 30)
*/

-- Remove line 29 and 30 from all areas EXCEPT Dryer
UPDATE sanitation_bagian
SET line_numbers = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(line_numbers) elem
  WHERE elem NOT IN ('29', '30')
)
WHERE area_id != (SELECT id FROM sanitation_areas WHERE name = 'Dryer')
  AND (line_numbers @> '["29"]' OR line_numbers @> '["30"]');

-- Verify the update
DO $$
DECLARE
  non_dryer_with_29_30 INTEGER;
  dryer_with_29_30 INTEGER;
BEGIN
  -- Check non-Dryer areas
  SELECT COUNT(*) INTO non_dryer_with_29_30
  FROM sanitation_bagian sb
  JOIN sanitation_areas sa ON sb.area_id = sa.id
  WHERE sa.name != 'Dryer' 
    AND (sb.line_numbers @> '["29"]' OR sb.line_numbers @> '["30"]');
  
  -- Check Dryer area still has 29 and 30
  SELECT COUNT(*) INTO dryer_with_29_30
  FROM sanitation_bagian sb
  JOIN sanitation_areas sa ON sb.area_id = sa.id
  WHERE sa.name = 'Dryer' 
    AND (sb.line_numbers @> '["29"]' OR sb.line_numbers @> '["30"]');
  
  IF non_dryer_with_29_30 > 0 THEN
    RAISE WARNING 'Still % non-Dryer bagian with line 29 or 30', non_dryer_with_29_30;
  ELSE
    RAISE NOTICE 'Successfully removed line 29 and 30 from all non-Dryer areas';
  END IF;
  
  RAISE NOTICE 'Dryer area has % bagian with line 29 or 30', dryer_with_29_30;
END $$;
