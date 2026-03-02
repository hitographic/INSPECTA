/*
  # Create RPC function to count photos efficiently
  
  1. New Function
    - `count_kliping_photos(p_plant text)` - Returns photo counts for each record
    - Only checks if fields are NOT NULL, doesn't fetch base64 data
    - Ultra-fast query for list views
  
  2. Performance
    - Uses CASE statements to count non-null photos
    - Returns minimal data for fast network transfer
    - Enables instant page load with accurate photo counters
*/

CREATE OR REPLACE FUNCTION count_kliping_photos(p_plant text DEFAULT NULL)
RETURNS TABLE (
  tanggal date,
  line text,
  regu text,
  shift text,
  pengamatan_ke text,
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
    kr."Pengamatan_ke" as pengamatan_ke,
    kr."Mesin" as mesin,
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