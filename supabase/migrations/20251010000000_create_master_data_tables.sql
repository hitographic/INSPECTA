/*
  # Create Master Data Tables for Sanitation Areas and Sections

  ## Overview
  This migration creates master data tables to manage Areas, Bagian (Sections),
  and their applicable Lines. This allows dynamic management of sanitation
  inspection points without code changes.

  ## New Tables

  ### `sanitation_areas`
  Master table for sanitation areas:
  - `id` (bigserial, primary key) - Auto-incrementing ID
  - `area_name` (text, required, unique) - Name of the area (e.g., "Mixer", "Fryer")
  - `display_order` (integer, required, default: 0) - Order for display in UI
  - `is_active` (boolean, required, default: true) - Active status
  - `created_at` (timestamptz, default: now()) - Creation timestamp
  - `updated_at` (timestamptz, default: now()) - Last update timestamp

  ### `sanitation_bagian`
  Master table for sanitation sections/parts within areas:
  - `id` (bigserial, primary key) - Auto-incrementing ID
  - `area_id` (bigint, required, foreign key) - Reference to sanitation_areas
  - `bagian_name` (text, required) - Name of the section
  - `keterangan` (text, nullable) - Description/instruction for this section
  - `applicable_lines` (text[], required) - Array of line types this applies to (CN, NN, GN, DN)
  - `display_order` (integer, required, default: 0) - Order for display in UI
  - `is_active` (boolean, required, default: true) - Active status
  - `created_at` (timestamptz, default: now()) - Creation timestamp
  - `updated_at` (timestamptz, default: now()) - Last update timestamp

  ### `line_configurations`
  Master table for line configurations:
  - `id` (bigserial, primary key) - Auto-incrementing ID
  - `line_number` (text, required, unique) - Line number (e.g., "1", "5", "25")
  - `line_type` (text, required) - Type of line (CN, NN, GN, DN)
  - `plant` (text, required) - Plant location
  - `is_active` (boolean, required, default: true) - Active status
  - `created_at` (timestamptz, default: now()) - Creation timestamp
  - `updated_at` (timestamptz, default: now()) - Last update timestamp

  ## Indexes
  - Primary keys on all tables
  - Foreign key index on sanitation_bagian.area_id
  - Index on display_order for sorting
  - Unique index on line_configurations.line_number

  ## Security
  - Enable RLS on all tables
  - All authenticated users can read master data
  - Only admins can modify master data (using custom claims)

  ## Important Notes
  1. Line types: CN (Cup Noodle), NN (Normal Noodle), GN (Glass Noodle), DN (Dry Noodle)
  2. applicable_lines array determines which bagian appears for which line
  3. display_order allows custom ordering of items in UI
*/

-- Create sanitation_areas table
CREATE TABLE IF NOT EXISTS sanitation_areas (
  id BIGSERIAL PRIMARY KEY,
  area_name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sanitation_bagian table
CREATE TABLE IF NOT EXISTS sanitation_bagian (
  id BIGSERIAL PRIMARY KEY,
  area_id BIGINT NOT NULL REFERENCES sanitation_areas(id) ON DELETE CASCADE,
  bagian_name TEXT NOT NULL,
  keterangan TEXT DEFAULT '',
  applicable_lines TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create line_configurations table
CREATE TABLE IF NOT EXISTS line_configurations (
  id BIGSERIAL PRIMARY KEY,
  line_number TEXT NOT NULL UNIQUE,
  line_type TEXT NOT NULL CHECK (line_type IN ('CN', 'NN', 'GN', 'DN')),
  plant TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sanitation_bagian_area_id ON sanitation_bagian(area_id);
CREATE INDEX IF NOT EXISTS idx_sanitation_areas_display_order ON sanitation_areas(display_order);
CREATE INDEX IF NOT EXISTS idx_sanitation_bagian_display_order ON sanitation_bagian(display_order);
CREATE INDEX IF NOT EXISTS idx_line_configurations_line_type ON line_configurations(line_type);
CREATE INDEX IF NOT EXISTS idx_line_configurations_plant ON line_configurations(plant);

-- Enable Row Level Security
ALTER TABLE sanitation_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanitation_bagian ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_configurations ENABLE ROW LEVEL SECURITY;

-- Policies for sanitation_areas
CREATE POLICY "Anyone can view active areas"
  ON sanitation_areas
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage areas"
  ON sanitation_areas
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- Policies for sanitation_bagian
CREATE POLICY "Anyone can view active bagian"
  ON sanitation_bagian
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage bagian"
  ON sanitation_bagian
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- Policies for line_configurations
CREATE POLICY "Anyone can view active lines"
  ON line_configurations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage lines"
  ON line_configurations
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- Create trigger for updated_at on sanitation_areas
CREATE TRIGGER update_sanitation_areas_updated_at
  BEFORE UPDATE ON sanitation_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on sanitation_bagian
CREATE TRIGGER update_sanitation_bagian_updated_at
  BEFORE UPDATE ON sanitation_bagian
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on line_configurations
CREATE TRIGGER update_line_configurations_updated_at
  BEFORE UPDATE ON line_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
