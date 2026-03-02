/*
  # Restructure Kliping Records Table - Final

  1. Changes
    - Drop old kliping_records table completely
    - Create new kliping_records table matching CSV structure
    - Each row = 1 combination of (tanggal, line, regu, shift, pengamatan_ke, flavor, mesin)
    - Proper column names matching CSV headers

  2. Table Structure
    - id (auto-increment primary key)
    - id_unik (text) - optional unique identifier
    - plant, tanggal, line, regu, shift
    - Flavor (text)
    - Pengamatan_ke (text) - main pengamatan field
    - Mesin (text)
    - 8 foto columns
    - created_by, created_at, updated_at
    - is_complete, pengamatan_timestamp

  3. Security
    - Enable RLS
    - Allow anonymous read/write for now
*/

-- Drop existing table and all constraints
DROP TABLE IF EXISTS kliping_records CASCADE;

-- Create new kliping_records table with correct structure
CREATE TABLE IF NOT EXISTS kliping_records (
  id bigserial PRIMARY KEY,
  id_unik text,
  plant text NOT NULL,
  tanggal date NOT NULL,
  line text NOT NULL,
  regu text NOT NULL,
  shift text NOT NULL,
  "Flavor" text,
  "Pengamatan_ke" text,
  "Mesin" text,
  foto_etiket text,
  foto_banded text,
  foto_karton text,
  foto_label_etiket text,
  foto_label_bumbu text,
  foto_label_minyak_bumbu text,
  foto_label_si text,
  foto_label_opp_banded text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_complete boolean DEFAULT false,
  pengamatan_timestamp timestamptz
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kliping_plant_tanggal ON kliping_records(plant, tanggal);
CREATE INDEX IF NOT EXISTS idx_kliping_session ON kliping_records(plant, tanggal, line, regu, shift);
CREATE INDEX IF NOT EXISTS idx_kliping_pengamatan ON kliping_records("Pengamatan_ke");

-- Enable RLS
ALTER TABLE kliping_records ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read all records
CREATE POLICY "Allow anonymous read access"
  ON kliping_records FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert records
CREATE POLICY "Allow anonymous insert access"
  ON kliping_records FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update records
CREATE POLICY "Allow anonymous update access"
  ON kliping_records FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete records
CREATE POLICY "Allow anonymous delete access"
  ON kliping_records FOR DELETE
  TO anon
  USING (true);
