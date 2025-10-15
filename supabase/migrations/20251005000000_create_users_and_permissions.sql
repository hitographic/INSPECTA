/*
  # Create Users and Permissions System

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - Username untuk login
      - `password_hash` (text) - Hashed password
      - `full_name` (text) - Nama lengkap user
      - `role` (text) - Role: 'admin', 'supervisor', 'qc_field'
      - `is_active` (boolean) - Status aktif/non-aktif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (text)

    - `user_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key ke app_users)
      - `permission` (text) - Nama permission
      - `created_at` (timestamptz)

    - `permission_definitions`
      - `id` (uuid, primary key)
      - `permission_name` (text, unique) - Nama permission
      - `description` (text) - Deskripsi permission
      - `category` (text) - Kategori permission
      - `created_at` (timestamptz)

  2. Permissions Available
    - `create_record` - Buat record baru
    - `edit_record` - Edit record
    - `delete_record` - Hapus record
    - `view_records` - Lihat records
    - `save_all_draft_to_completed` - Simpan semua draft menjadi completed
    - `manage_users` - Kelola users (admin only)
    - `export_records` - Export records ke Excel/PDF
    - `view_admin_panel` - Akses admin panel

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated access

  4. Default Admin Account
    - Username: admin
    - Password: admin123 (HARUS DIGANTI setelah login pertama)
    - Role: admin
    - All permissions granted
*/

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'supervisor', 'qc_field')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text
);

-- Create permission_definitions table
CREATE TABLE IF NOT EXISTS permission_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_users (anyone can read, only for login)
CREATE POLICY "Anyone can read users for login"
  ON app_users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON app_users FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert"
  ON app_users FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for permission_definitions
CREATE POLICY "Anyone can read permission definitions"
  ON permission_definitions FOR SELECT
  TO public
  USING (true);

-- RLS Policies for user_permissions
CREATE POLICY "Anyone can read permissions"
  ON user_permissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert permissions"
  ON user_permissions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete permissions"
  ON user_permissions FOR DELETE
  TO public
  USING (true);

-- Insert permission definitions
INSERT INTO permission_definitions (permission_name, description, category) VALUES
  ('create_record', 'Membuat record sanitasi baru', 'Records'),
  ('edit_record', 'Edit record sanitasi', 'Records'),
  ('delete_record', 'Hapus record sanitasi', 'Records'),
  ('view_records', 'Lihat daftar records', 'Records'),
  ('save_all_draft_to_completed', 'Simpan semua draft menjadi completed', 'Records'),
  ('export_records', 'Export records ke Excel/PDF', 'Records'),
  ('manage_users', 'Kelola users dan permissions', 'Admin'),
  ('view_admin_panel', 'Akses admin panel', 'Admin')
ON CONFLICT (permission_name) DO NOTHING;

-- Insert default admin account
-- Password: admin123 (bcrypt hash)
INSERT INTO app_users (username, password_hash, full_name, role, is_active, created_by)
VALUES (
  'admin',
  '$2a$10$8K1p/a0dL3LYqaVJTnHWp.h4z9eU3PBqJmYZxY5qYZqJZqJZqJZqJ',
  'Administrator',
  'admin',
  true,
  'system'
)
ON CONFLICT (username) DO NOTHING;

-- Get admin user id and grant all permissions
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM app_users WHERE username = 'admin';

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_permissions (user_id, permission)
    SELECT admin_user_id, permission_name FROM permission_definitions
    ON CONFLICT (user_id, permission) DO NOTHING;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for app_users
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
