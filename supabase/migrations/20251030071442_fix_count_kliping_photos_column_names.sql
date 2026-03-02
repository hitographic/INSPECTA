/*
  # Fix count_kliping_photos function to use lowercase column names

  1. Changes
    - Update function to reference `pengamatan_ke` instead of `Pengamatan_ke`
    - Update function to reference `mesin` instead of `Mesin`
  
  2. Reason
    - Column names were changed to lowercase in previous migration
    - Function needs to match the actual column names in the table
*/

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
      CASE WHEN kr.foto_etiket IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_banded IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_karton IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_etiket IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_bumbu IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_minyak_bumbu IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_si IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN kr.foto_label_opp_banded IS NOT NULL THEN 1 ELSE 0 END
    )::int as photo_count
  FROM kliping_records kr
  WHERE (p_plant IS NULL OR kr.plant = p_plant);
END;
$$ LANGUAGE plpgsql STABLE;