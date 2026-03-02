/*
  # Create Sanitation Records Table

  ## Overview
  Creates the main table for storing sanitation inspection records with photos and metadata.
  This table will sync data across all devices in real-time.

  ## New Tables
  
  ### `sanitation_records`
  Main table for sanitation inspection records:
  - `id` (bigint, primary key, auto-increment) - Unique record identifier
  - `plant` (text, required) - Plant location (Plant-1, Plant-2, Plant-3, Plant-4, Plant-5)
  - `line` (text, required) - Production line name
  - `tanggal` (date, required) - Inspection date
  - `area` (text, required) - Inspection area (Food Contact, Non Food Contact, etc.)
  - `bagian` (text, required) - Specific section being inspected
  - `foto_sebelum` (text, nullable) - Base64 encoded photo before cleaning
  - `foto_sesudah` (text, nullable) - Base64 encoded photo after cleaning
  - `keterangan` (text, nullable, default: '') - Additional notes or remarks
  - `status` (text, required, default: 'completed') - Record status (draft, completed)
  - `created_at` (timestamptz, default: now()) - Timestamp when record was created
  - `created_by` (text, required) - NIK of user who created the record
  - `updated_at` (timestamptz, default: now()) - Last update timestamp

  ## Indexes
  - Primary key on `id`
  - Index on `plant` for filtering by plant
  - Index on `line` for filtering by production line
  - Index on `tanggal` for date-based queries
  - Index on `area` for area-based filtering
  - Index on `created_by` for user-based queries
  - Composite index on `(plant, line, tanggal)` for duplicate checking

  ## Security
  - Enable Row Level Security (RLS)
  - Add policy for authenticated users to read all records
  - Add policy for authenticated users to insert their own records
  - Add policy for authenticated users to update their own records
  - Add policy for authenticated users to delete their own records

  ## Important Notes
  1. Photos are stored as base64 encoded strings in the database
  2. All users can view all records for transparency and auditing
  3. Users can only modify/delete records they created
  4. The composite index ensures we can efficiently check for duplicate records
*/

-- Create the sanitation_records table
CREATE TABLE IF NOT EXISTS sanitation_records (
  id BIGSERIAL PRIMARY KEY,
  plant TEXT NOT NULL,
  line TEXT NOT NULL,
  tanggal DATE NOT NULL,
  area TEXT NOT NULL,
  bagian TEXT NOT NULL,
  foto_sebelum TEXT,
  foto_sesudah TEXT,
  keterangan TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sanitation_records_plant ON sanitation_records(plant);
CREATE INDEX IF NOT EXISTS idx_sanitation_records_line ON sanitation_records(line);
CREATE INDEX IF NOT EXISTS idx_sanitation_records_tanggal ON sanitation_records(tanggal);
CREATE INDEX IF NOT EXISTS idx_sanitation_records_area ON sanitation_records(area);
CREATE INDEX IF NOT EXISTS idx_sanitation_records_created_by ON sanitation_records(created_by);
CREATE INDEX IF NOT EXISTS idx_sanitation_records_composite ON sanitation_records(plant, line, tanggal);

-- Enable Row Level Security
ALTER TABLE sanitation_records ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view all records
CREATE POLICY "Users can view all sanitation records"
  ON sanitation_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert their own records
CREATE POLICY "Users can insert own sanitation records"
  ON sanitation_records
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Authenticated users can update their own records
CREATE POLICY "Users can update own sanitation records"
  ON sanitation_records
  FOR UPDATE
  TO authenticated
  USING (created_by = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (created_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Authenticated users can delete their own records
CREATE POLICY "Users can delete own sanitation records"
  ON sanitation_records
  FOR DELETE
  TO authenticated
  USING (created_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_sanitation_records_updated_at
  BEFORE UPDATE ON sanitation_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();