# 🔐 Setup Authentication System - PENTING!

## ⚠️ LANGKAH WAJIB SEBELUM LOGIN

Aplikasi sudah diupdate dengan sistem authentication dan role-based access control, TAPI database masih kosong.

### 📋 Langkah Setup (5 menit):

#### 1️⃣ Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project: **Indofood Sanitation System**
- Klik **"SQL Editor"** di sidebar kiri

#### 2️⃣ Copy & Paste SQL Script 1

Paste script berikut ke SQL Editor dan klik **RUN**:

```sql
-- Buat 3 tables untuk authentication
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

CREATE TABLE IF NOT EXISTS permission_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

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

-- Buat policies
CREATE POLICY "Anyone can read users" ON app_users FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update users" ON app_users FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert users" ON app_users FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read perms" ON permission_definitions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read user_perms" ON user_permissions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert user_perms" ON user_permissions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete user_perms" ON user_permissions FOR DELETE TO public USING (true);

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
```

#### 3️⃣ Copy & Paste SQL Script 2

Paste script berikut dan klik **RUN**:

```sql
-- Insert 3 default users
INSERT INTO app_users (username, password_hash, full_name, role, is_active, created_by)
VALUES
  ('admin', 'admin123', 'Administrator', 'admin', true, 'system'),
  ('supervisor', 'super123', 'Supervisor', 'supervisor', true, 'system'),
  ('qcfield', 'qc123', 'QC Field', 'qc_field', true, 'system')
ON CONFLICT (username) DO NOTHING;

-- Berikan permissions ke setiap user
DO $$
DECLARE
  admin_id uuid;
  supervisor_id uuid;
  qcfield_id uuid;
BEGIN
  SELECT id INTO admin_id FROM app_users WHERE username = 'admin';
  SELECT id INTO supervisor_id FROM app_users WHERE username = 'supervisor';
  SELECT id INTO qcfield_id FROM app_users WHERE username = 'qcfield';

  -- Admin: ALL PERMISSIONS
  INSERT INTO user_permissions (user_id, permission) VALUES
    (admin_id, 'create_record'),
    (admin_id, 'edit_record'),
    (admin_id, 'delete_record'),
    (admin_id, 'view_records'),
    (admin_id, 'save_all_draft_to_completed'),
    (admin_id, 'export_records'),
    (admin_id, 'manage_users'),
    (admin_id, 'view_admin_panel')
  ON CONFLICT DO NOTHING;

  -- Supervisor: Limited permissions
  INSERT INTO user_permissions (user_id, permission) VALUES
    (supervisor_id, 'create_record'),
    (supervisor_id, 'edit_record'),
    (supervisor_id, 'view_records'),
    (supervisor_id, 'export_records')
  ON CONFLICT DO NOTHING;

  -- QC Field: Minimal permissions
  INSERT INTO user_permissions (user_id, permission) VALUES
    (qcfield_id, 'create_record'),
    (qcfield_id, 'view_records')
  ON CONFLICT DO NOTHING;
END $$;
```

#### 4️⃣ Verifikasi

Cek apakah berhasil dengan query ini:

```sql
SELECT
  u.username,
  u.full_name,
  u.role,
  array_agg(p.permission) as permissions
FROM app_users u
LEFT JOIN user_permissions p ON u.id = p.user_id
GROUP BY u.id, u.username, u.full_name, u.role
ORDER BY u.role;
```

Harusnya muncul 3 users dengan permissions masing-masing.

#### 5️⃣ Login ke Aplikasi

Sekarang buka aplikasi dan login dengan:

**Admin (Full Access):**
- Username: `admin`
- Password: `admin123`

**Supervisor (Edit & Export):**
- Username: `supervisor`
- Password: `super123`

**QC Field (Basic Access):**
- Username: `qcfield`
- Password: `qc123`

---

## 🎯 Perbedaan Role:

| Fitur | Admin | Supervisor | QC Field |
|-------|-------|------------|----------|
| Buat Record | ✅ | ✅ | ✅ |
| Edit Record | ✅ | ✅ | ❌ |
| Hapus Record | ✅ | ❌ | ❌ |
| Lihat Records | ✅ | ✅ | ✅ |
| **Simpan Semua Draft** | ✅ | ❌ | ❌ |
| Export Excel/PDF | ✅ | ✅ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ |
| Kelola Users | ✅ | ❌ | ❌ |

## 🔍 Troubleshooting

**Problem**: "Username atau Password salah!"
- **Cek**: Pastikan sudah jalankan SQL script 1 & 2 di atas
- **Cek**: Buka Table Editor di Supabase → pastikan table `app_users` ada dan berisi 3 users
- **Cek**: Ketik username dan password dengan benar (case-sensitive)

**Problem**: Tombol "Simpan Semua" tidak muncul
- **Normal!** Tombol ini hanya muncul untuk Admin
- Supervisor dan QC Field tidak bisa mengubah draft menjadi completed

**Problem**: Tombol "Admin Panel" tidak muncul
- **Normal!** Tombol ini hanya muncul untuk Admin di halaman Records

---

## 📝 File Penting:

- `SETUP_DATABASE.md` - Versi lengkap setup guide
- `CREDENTIALS.md` - Dokumentasi lengkap credentials dan permissions
- `supabase/migrations/20251005000000_create_users_and_permissions.sql` - Migration file lengkap

---

✅ **Setelah setup selesai, aplikasi siap digunakan dengan sistem role-based authentication!**
