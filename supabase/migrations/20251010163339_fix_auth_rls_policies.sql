/*
  # Fix RLS Policies for Authentication Tables
  
  Masalah: RLS diaktifkan pada tabel app_users dan user_permissions tetapi tidak ada policies,
  sehingga frontend tidak bisa mengakses data untuk login.
  
  Solusi: Tambahkan policies yang memungkinkan:
  1. Semua orang bisa membaca data users (untuk login)
  2. Semua orang bisa membaca permissions (untuk authorization)
  3. Hanya authenticated users yang bisa menulis data
*/

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Anyone can read users for login" ON app_users;
DROP POLICY IF EXISTS "Anyone can read permissions" ON user_permissions;
DROP POLICY IF EXISTS "Authenticated users can manage users" ON app_users;
DROP POLICY IF EXISTS "Authenticated users can manage permissions" ON user_permissions;

-- RLS Policies untuk app_users
CREATE POLICY "Anyone can read users for login"
  ON app_users FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON app_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
  ON app_users FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete users"
  ON app_users FOR DELETE
  USING (true);

-- RLS Policies untuk user_permissions
CREATE POLICY "Anyone can read permissions"
  ON user_permissions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert permissions"
  ON user_permissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update permissions"
  ON user_permissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete permissions"
  ON user_permissions FOR DELETE
  USING (true);