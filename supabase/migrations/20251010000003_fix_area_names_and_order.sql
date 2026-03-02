/*
  # Fix Area Names and Display Order

  ## Overview
  Updates the area names and ensures correct display order for consistency
  across the application, export Excel, and export PDF.

  ## Changes
  1. Rename "Sievter Silo & Premix" to "Silo"
  2. Verify display order is correct:
     1. Silo
     2. Mixer
     3. Roll Press
     4. Steambox
     5. Cutter dan Folder
     6. Fryer
     7. Cooling Box
     8. Packing

  ## Impact
  - Create Record Screen will show areas in this order
  - Excel exports will group data by this order
  - PDF exports will display data in this order
*/

-- Update area name from "Sievter Silo & Premix" to "Silo"
UPDATE sanitation_areas
SET area_name = 'Silo'
WHERE area_name = 'Sievter Silo & Premix';

-- Ensure display_order is correct (should already be correct, but making sure)
UPDATE sanitation_areas SET display_order = 1 WHERE area_name = 'Silo';
UPDATE sanitation_areas SET display_order = 2 WHERE area_name = 'Mixer';
UPDATE sanitation_areas SET display_order = 3 WHERE area_name = 'Roll Press';
UPDATE sanitation_areas SET display_order = 4 WHERE area_name = 'Steambox';
UPDATE sanitation_areas SET display_order = 5 WHERE area_name = 'Cutter dan Folder';
UPDATE sanitation_areas SET display_order = 6 WHERE area_name = 'Fryer';
UPDATE sanitation_areas SET display_order = 7 WHERE area_name = 'Cooling Box';
UPDATE sanitation_areas SET display_order = 8 WHERE area_name = 'Packing';
