/*
  # Remove Line 29 and 30 from Fryer Area

  1. Changes
    - Remove line "29" and "30" from all bagian in Fryer area
    - Line 29 and 30 should only have Dryer, not Fryer
    
  2. Affected Bagian (6 items in Fryer area):
    - Kuali Fryer, Retainer dan Tutup Retainer
    - Bagian luar & dalam kuali fryer dan Ex Fryer
    - Strainer
    - Edible oil
    - Awning
    - Talang out fryer
*/

-- Update all Fryer bagian to remove line 29 and 30
UPDATE sanitation_bagian
SET line_numbers = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(line_numbers) elem
  WHERE elem NOT IN ('29', '30')
)
WHERE area_id = 'a8000000-0000-0000-0000-000000000008';