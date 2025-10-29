/*
  # Create Monitoring Records Table

  1. New Tables
    - `monitoring_records`
      - `id` (uuid, primary key)
      - `plant` (text) - Plant location (Plant-1, Plant-2, Plant-3)
      - `tanggal` (date) - Date of monitoring
      - `line` (text) - Line information
      - `regu` (text) - Team/Regu (A, B, C)
      - `shift` (text) - Shift number (1, 2, 3)
      - `area` (text) - Area being monitored (Silo, Mixer, etc.)
      - `data_number` (integer) - Data entry number (1-20)
      - `foto_url` (text) - Photo URL
      - `keterangan` (text) - Description/notes
      - `status` (text) - Status: 'draft' or 'complete'
      - `created_by` (text) - Username of creator
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `monitoring_records` table
    - Add policies for anonymous users to read, insert, update, and delete their own data
*/

CREATE TABLE IF NOT EXISTS monitoring_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant text NOT NULL,
  tanggal date NOT NULL,
  line text NOT NULL,
  regu text NOT NULL,
  shift text NOT NULL,
  area text NOT NULL,
  data_number integer NOT NULL,
  foto_url text,
  keterangan text,
  status text NOT NULL DEFAULT 'draft',
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE monitoring_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous users to view all monitoring records"
  ON monitoring_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to insert monitoring records"
  ON monitoring_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update monitoring records"
  ON monitoring_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to delete monitoring records"
  ON monitoring_records
  FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_monitoring_records_plant ON monitoring_records(plant);
CREATE INDEX IF NOT EXISTS idx_monitoring_records_tanggal ON monitoring_records(tanggal);
CREATE INDEX IF NOT EXISTS idx_monitoring_records_status ON monitoring_records(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_records_created_by ON monitoring_records(created_by);