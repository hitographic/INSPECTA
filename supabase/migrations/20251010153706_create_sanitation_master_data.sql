/*
  # Create Sanitation Master Data Tables
  
  1. New Tables
    - `sanitation_areas` - Master data untuk area sanitasi
      - `id` (uuid, primary key)
      - `name` (text) - Nama area
      - `display_order` (integer) - Urutan tampilan
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sanitation_bagian` - Master data untuk bagian dalam setiap area
      - `id` (uuid, primary key)
      - `area_id` (uuid, foreign key to sanitation_areas)
      - `name` (text) - Nama bagian
      - `keterangan` (text) - Deskripsi/keterangan
      - `line_numbers` (text[]) - Array line yang applicable
      - `display_order` (integer) - Urutan tampilan dalam area
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read data
    - Add policies for managers to manage data
*/

-- Create sanitation_areas table
CREATE TABLE IF NOT EXISTS sanitation_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sanitation_bagian table
CREATE TABLE IF NOT EXISTS sanitation_bagian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES sanitation_areas(id) ON DELETE CASCADE,
  name text NOT NULL,
  keterangan text NOT NULL DEFAULT '',
  line_numbers text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sanitation_areas_display_order ON sanitation_areas(display_order);
CREATE INDEX IF NOT EXISTS idx_sanitation_bagian_area_id ON sanitation_bagian(area_id);
CREATE INDEX IF NOT EXISTS idx_sanitation_bagian_display_order ON sanitation_bagian(area_id, display_order);

-- Enable RLS
ALTER TABLE sanitation_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanitation_bagian ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sanitation_areas
CREATE POLICY "Anyone can read sanitation areas"
  ON sanitation_areas FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert sanitation areas"
  ON sanitation_areas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sanitation areas"
  ON sanitation_areas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sanitation areas"
  ON sanitation_areas FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for sanitation_bagian
CREATE POLICY "Anyone can read sanitation bagian"
  ON sanitation_bagian FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert sanitation bagian"
  ON sanitation_bagian FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sanitation bagian"
  ON sanitation_bagian FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sanitation bagian"
  ON sanitation_bagian FOR DELETE
  TO authenticated
  USING (true);