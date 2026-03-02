/*
  # Create Kliping Records Table

  1. New Tables
    - `kliping_records`
      - `id` (bigint, primary key, auto-increment)
      - `plant` (text) - Plant-1, Plant-2, Plant-3
      - `tanggal` (date) - Tanggal pengamatan
      - `line` (text) - Line 1-8
      - `regu` (text) - A, B, C
      - `shift` (text) - 1, 2, 3
      - `pengamatan_1` (text) - Pengamatan 1 dropdown value
      - `pengamatan_1_flavor` (text) - Flavor untuk pengamatan 1
      - `pengamatan_1_mesin` (text) - Mesin 1-4 untuk pengamatan 1
      - `pengamatan_1_timestamp` (timestamptz) - Timestamp generate
      - `pengamatan_2` (text) - Pengamatan 2 dropdown value
      - `pengamatan_2_flavor` (text) - Flavor untuk pengamatan 2
      - `pengamatan_2_mesin` (text) - Mesin 1-4 untuk pengamatan 2
      - `pengamatan_2_timestamp` (timestamptz) - Timestamp generate
      - `pengamatan_3` (text) - Pengamatan 3 dropdown value
      - `pengamatan_3_flavor` (text) - Flavor untuk pengamatan 3
      - `pengamatan_3_mesin` (text) - Mesin 1-4 untuk pengamatan 3
      - `pengamatan_3_timestamp` (timestamptz) - Timestamp generate
      - `pengamatan_4` (text) - Pengamatan 4 dropdown value
      - `pengamatan_4_flavor` (text) - Flavor untuk pengamatan 4
      - `pengamatan_4_mesin` (text) - Mesin 1-4 untuk pengamatan 4
      - `pengamatan_4_timestamp` (timestamptz) - Timestamp generate
      - `foto_etiket` (text) - Base64 foto etiket
      - `foto_banded` (text) - Base64 foto banded
      - `foto_karton` (text) - Base64 foto karton
      - `foto_label_etiket` (text) - Base64 foto label etiket
      - `foto_label_bumbu` (text) - Base64 foto label bumbu
      - `foto_label_minyak_bumbu` (text) - Base64 foto label minyak bumbu
      - `foto_label_si` (text) - Base64 foto label SI
      - `foto_label_opp_banded` (text) - Base64 foto label OPP banded
      - `created_by` (text) - Nama user yang membuat
      - `created_at` (timestamptz) - Auto timestamp
      - `updated_at` (timestamptz) - Auto timestamp
      - `is_complete` (boolean) - Status complete/draft

  2. Security
    - Enable RLS on `kliping_records` table
    - Add policy for anonymous users (public access for now)
*/

-- Create kliping_records table
CREATE TABLE IF NOT EXISTS kliping_records (
  id bigserial PRIMARY KEY,
  plant text NOT NULL,
  tanggal date NOT NULL,
  line text NOT NULL,
  regu text NOT NULL,
  shift text NOT NULL,

  -- Pengamatan 1
  pengamatan_1 text,
  pengamatan_1_flavor text,
  pengamatan_1_mesin text,
  pengamatan_1_timestamp timestamptz,

  -- Pengamatan 2
  pengamatan_2 text,
  pengamatan_2_flavor text,
  pengamatan_2_mesin text,
  pengamatan_2_timestamp timestamptz,

  -- Pengamatan 3
  pengamatan_3 text,
  pengamatan_3_flavor text,
  pengamatan_3_mesin text,
  pengamatan_3_timestamp timestamptz,

  -- Pengamatan 4
  pengamatan_4 text,
  pengamatan_4_flavor text,
  pengamatan_4_mesin text,
  pengamatan_4_timestamp timestamptz,

  -- Foto fields (base64 strings)
  foto_etiket text,
  foto_banded text,
  foto_karton text,
  foto_label_etiket text,
  foto_label_bumbu text,
  foto_label_minyak_bumbu text,
  foto_label_si text,
  foto_label_opp_banded text,

  -- Metadata
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_complete boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE kliping_records ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (similar to sanitation_records)
CREATE POLICY "Allow anonymous access to kliping_records"
  ON kliping_records
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to kliping_records"
  ON kliping_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kliping_records_plant ON kliping_records(plant);
CREATE INDEX IF NOT EXISTS idx_kliping_records_tanggal ON kliping_records(tanggal);
CREATE INDEX IF NOT EXISTS idx_kliping_records_line ON kliping_records(line);
CREATE INDEX IF NOT EXISTS idx_kliping_records_created_at ON kliping_records(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_kliping_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kliping_records_updated_at_trigger
  BEFORE UPDATE ON kliping_records
  FOR EACH ROW
  EXECUTE FUNCTION update_kliping_records_updated_at();
