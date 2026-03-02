/*
  # Restore Original Line Numbers

  ## Problem
  Line 29 and 30 were incorrectly removed from Fryer and other areas
  Need to restore to original configuration from insert_sanitation_data_fixed.sql

  ## Solution
  Restore line 29 and 30 to all areas that originally had them:
  - Fryer: All bagian should have 1-8,16-33 (including 29,30)
  - Keep Dryer with only 29,30
  - Keep Cutter dan Folder "Cutter dan net distirbutor mie" with only 29,30
  - Keep Packing "Talang penampung channelizer" with only 29,30
  - Restore other areas that originally had 29,30

  ## Changes
  Update sanitation_bagian line_numbers to match original migration
*/

-- Restore Fryer bagian to include all lines 1-8, 16-33 (29 and 30 included)
UPDATE sanitation_bagian SET line_numbers = '["1","2","3","4","5","6","7","8","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]'::jsonb
WHERE area_id = (SELECT id FROM sanitation_areas WHERE name = 'Fryer')
  AND name IN ('Kuali Fryer, Retainer dan Tutup Retainer.', 'Bagian luar & dalam kuali fryer dan Ex Fryer', 'Strainer', 'Edible oil', 'Awning');

-- Fryer "Talang out fryer" has all lines including 29,30
UPDATE sanitation_bagian SET line_numbers = '["1","2","3","4","5","6","7","8","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]'::jsonb
WHERE area_id = (SELECT id FROM sanitation_areas WHERE name = 'Fryer')
  AND name = 'Talang out fryer';

-- Restore other areas that should have 29 and 30
UPDATE sanitation_bagian SET line_numbers = '["1","2","3","4","5","6","7","8","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]'::jsonb
WHERE area_id IN (
  SELECT id FROM sanitation_areas WHERE name IN ('Silo', 'Mixer', 'Roll Press', 'Steambox', 'Cooling Box')
)
AND NOT (line_numbers @> '["29"]' AND line_numbers @> '["30"]');

-- Restore Alkali Ingredient "Instalasi Pipa Alkali" to include 29 and 30
UPDATE sanitation_bagian SET line_numbers = '["1","2","3","4","5","6","7","8","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]'::jsonb
WHERE area_id = (SELECT id FROM sanitation_areas WHERE name = 'Alkali Ingredient')
  AND name = 'Instalasi Pipa Alkali';

-- Restore "Conveyor distributor mie" in Cutter dan Folder
UPDATE sanitation_bagian SET line_numbers = '["1","2","3","4","5","6","7","8","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]'::jsonb
WHERE area_id = (SELECT id FROM sanitation_areas WHERE name = 'Cutter dan Folder')
  AND name = 'Conveyor distributor mie';

-- Restore Packing bagian except "Talang penampung channelizer" which should only have 29,30
UPDATE sanitation_bagian SET line_numbers = '["1","2","3","4","5","6","7","8","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"]'::jsonb
WHERE area_id = (SELECT id FROM sanitation_areas WHERE name = 'Packing')
  AND name IN ('Conveyor pembagi / chanilizer out cooling', 'Curve Conveyor', 'Bak penampung mie', 'Anting-anting', 'Autoloader', 'Meja infeed packing', 'Infeed packing', 'Mesin packing', 'Carton sealer');

-- Verify restoration
DO $$
DECLARE
  fryer_count INTEGER;
  dryer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fryer_count
  FROM sanitation_bagian sb
  JOIN sanitation_areas sa ON sb.area_id = sa.id
  WHERE sa.name = 'Fryer' AND sb.line_numbers @> '["29"]';
  
  SELECT COUNT(*) INTO dryer_count
  FROM sanitation_bagian sb
  JOIN sanitation_areas sa ON sb.area_id = sa.id
  WHERE sa.name = 'Dryer' AND sb.line_numbers @> '["29"]';
  
  RAISE NOTICE 'Fryer bagian with line 29: %, Dryer bagian with line 29: %', fryer_count, dryer_count;
END $$;
