/*
  # Create Supervisors Table

  1. New Tables
    - `supervisors`
      - `id` (uuid, primary key)
      - `plant` (text) - Plant name (Plant-1, Plant-2, Plant-3)
      - `supervisor_name` (text) - Name of supervisor
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `supervisors` table
    - Add policy for public read access (needed for export)

  3. Initial Data
    - Insert supervisors for each plant
*/

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant text NOT NULL,
  supervisor_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (needed for export)
CREATE POLICY "Allow public read access to supervisors"
  ON supervisors
  FOR SELECT
  TO public
  USING (true);

-- Insert initial supervisor data
INSERT INTO supervisors (plant, supervisor_name) VALUES
  ('Plant-1', 'Satria W.K.'),
  ('Plant-2', 'Haydar F.J.'),
  ('Plant-3', 'Qoesuma F.')
ON CONFLICT DO NOTHING;
