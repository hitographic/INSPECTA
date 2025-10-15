# Setup Database untuk Authentication

## Langkah-langkah Setup:

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project Anda
- Klik "SQL Editor" di sidebar kiri

### 2. Jalankan SQL Script Berikut:

Copy paste SQL berikut ke SQL Editor dan klik "Run":

```sql
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

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can read users for login" ON app_users;
CREATE POLICY "Anyone can read users for login" ON app_users FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert" ON app_users;
CREATE POLICY "Users can insert" ON app_users FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read permission definitions" ON permission_definitions;
CREATE POLICY "Anyone can read permission definitions" ON permission_definitions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can read permissions" ON user_permissions;
CREATE POLICY "Anyone can read permissions" ON user_permissions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can insert permissions" ON user_permissions;
CREATE POLICY "Anyone can insert permissions" ON user_permissions FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete permissions" ON user_permissions;
CREATE POLICY "Anyone can delete permissions" ON user_permissions FOR DELETE TO public USING (true);

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

-- Insert default admin, supervisor, qc field
INSERT INTO app_users (username, password_hash, full_name, role, is_active, created_by)
VALUES
  ('admin', 'admin123', 'Administrator', 'admin', true, 'system'),
  ('supervisor', 'super123', 'Supervisor', 'supervisor', true, 'system'),
  ('qcfield', 'qc123', 'QC Field', 'qc_field', true, 'system')
ON CONFLICT (username) DO NOTHING;
```

### 3. Tambahkan Permissions untuk Setiap User

Jalankan SQL berikut untuk memberikan permissions ke setiap user:

```sql
-- Get user IDs and insert permissions
DO $$
DECLARE
  admin_id uuid;
  supervisor_id uuid;
  qcfield_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_id FROM app_users WHERE username = 'admin';
  SELECT id INTO supervisor_id FROM app_users WHERE username = 'supervisor';
  SELECT id INTO qcfield_id FROM app_users WHERE username = 'qcfield';

  -- Admin permissions (all)
  IF admin_id IS NOT NULL THEN
    INSERT INTO user_permissions (user_id, permission) VALUES
      (admin_id, 'create_record'),
      (admin_id, 'edit_record'),
      (admin_id, 'delete_record'),
      (admin_id, 'view_records'),
      (admin_id, 'save_all_draft_to_completed'),
      (admin_id, 'export_records'),
      (admin_id, 'manage_users'),
      (admin_id, 'view_admin_panel')
    ON CONFLICT (user_id, permission) DO NOTHING;
  END IF;

  -- Supervisor permissions
  IF supervisor_id IS NOT NULL THEN
    INSERT INTO user_permissions (user_id, permission) VALUES
      (supervisor_id, 'create_record'),
      (supervisor_id, 'edit_record'),
      (supervisor_id, 'view_records'),
      (supervisor_id, 'export_records')
    ON CONFLICT (user_id, permission) DO NOTHING;
  END IF;

  -- QC Field permissions
  IF qcfield_id IS NOT NULL THEN
    INSERT INTO user_permissions (user_id, permission) VALUES
      (qcfield_id, 'create_record'),
      (qcfield_id, 'view_records')
    ON CONFLICT (user_id, permission) DO NOTHING;
  END IF;
END $$;
```

### 4. Verifikasi

Cek apakah data sudah tersimpan dengan baik:

```sql
-- Cek users
SELECT username, full_name, role, is_active FROM app_users;

-- Cek permissions per user
SELECT
  u.username,
  u.role,
  array_agg(p.permission) as permissions
FROM app_users u
LEFT JOIN user_permissions p ON u.id = p.user_id
GROUP BY u.id, u.username, u.role;
```

### 5. Selesai!

Setelah SQL di atas dijalankan, aplikasi siap digunakan dengan credentials:

- **Admin**: `admin` / `admin123`
- **Supervisor**: `supervisor` / `super123`
- **Manager**: `manajer` / `manajer123`
- **QC Field**: `qcfield` / `qc123`

**Catatan:** Untuk menambahkan role Manager, gunakan migration file `20251010120000_add_manager_role.sql`

## Troubleshooting

Jika masih ada error "Username atau Password salah":
1. Pastikan semua SQL script di atas sudah dijalankan
2. Cek di Supabase Dashboard → Table Editor → Pastikan tables `app_users`, `permission_definitions`, dan `user_permissions` sudah ada
3. Cek isi table `app_users` apakah sudah ada 3 users
4. Refresh browser dan coba login lagi
