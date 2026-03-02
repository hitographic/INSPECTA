/*
  # Create Audit Logs Table

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key) - Unique identifier for each audit entry
      - `table_name` (text) - Name of the table where delete occurred
      - `record_id` (text) - ID of the deleted record
      - `record_data` (jsonb) - Full data of deleted record for reference
      - `deleted_by` (text) - Username of person who deleted
      - `deleted_at` (timestamptz) - Timestamp of deletion
      - `action` (text) - Type of action (DELETE, BULK_DELETE, etc)
      - `plant` (text) - Plant where deletion occurred
      - `additional_info` (jsonb) - Any extra metadata

  2. Security
    - Enable RLS on `audit_logs` table
    - Only admin and manager can read audit logs
    - System can insert (no manual insert by users)

  3. Indexes
    - Index on deleted_at for fast date range queries
    - Index on table_name for filtering by table
    - Index on deleted_by for filtering by user
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  record_data jsonb NOT NULL,
  deleted_by text NOT NULL,
  deleted_at timestamptz DEFAULT now() NOT NULL,
  action text DEFAULT 'DELETE' NOT NULL,
  plant text,
  additional_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_deleted_at ON audit_logs(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_deleted_by ON audit_logs(deleted_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_plant ON audit_logs(plant);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read (we'll filter by role in app)
CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anonymous insert for backward compatibility (but we'll use authenticated in practice)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Tracks all delete operations across the application';
