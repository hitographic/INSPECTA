/*
  # Fix count_kliping_photos function - remove duplicate and recreate

  1. Issue
    - There are 2 functions with the same name but different signatures
    - The old one takes record_id parameter
    - The new one takes p_plant parameter
    - This causes confusion and the function returns empty results

  2. Solution
    - Drop all versions of the function
    - Recreate the correct version that returns TABLE with plant filter
*/

-- Drop all versions of count_kliping_photos function
DROP FUNCTION IF EXISTS count_kliping_photos(uuid);
DROP FUNCTION IF EXISTS count_kliping_photos(text);
DROP FUNCTION IF EXISTS count_kliping_photos();

-- Recreate the correct function
CREATE OR REPLACE FUNCTION count_kliping_photos(p_plant text DEFAULT NULL)
RETURNS TABLE (
  tanggal date,
  line text,
  regu text,
  shift text,
  pengamatan_ke int,
  mesin text,
  photo_count int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kr.tanggal::date,
    kr.line,
    kr.regu,
    kr.shift,
    kr.pengamatan_ke,
    kr.mesin,
    (
      CASE WHEN kr.foto_etiket IS NOT NULL AND kr.foto_etiket != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_banded IS NOT NULL AND kr.foto_banded != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_karton IS NOT NULL AND kr.foto_karton != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_etiket IS NOT NULL AND kr.foto_label_etiket != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_bumbu IS NOT NULL AND kr.foto_label_bumbu != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_minyak_bumbu IS NOT NULL AND kr.foto_label_minyak_bumbu != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_si IS NOT NULL AND kr.foto_label_si != '' THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_opp_banded IS NOT NULL AND kr.foto_label_opp_banded != '' THEN 1 ELSE 0 END
    )::int as photo_count
  FROM kliping_records kr
  WHERE (p_plant IS NULL OR kr.plant = p_plant);
END;
$$ LANGUAGE plpgsql STABLE;