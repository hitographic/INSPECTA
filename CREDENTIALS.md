# 🔐 User Credentials dan Permissions

## Default Accounts

### 1. Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator
- **Permissions**:
  - ✅ Membuat record sanitasi baru
  - ✅ Edit record sanitasi
  - ✅ Hapus record sanitasi
  - ✅ Lihat daftar records
  - ✅ **Simpan semua draft menjadi completed**
  - ✅ Export records ke Excel/PDF
  - ✅ Kelola users dan permissions
  - ✅ Akses admin panel

### 2. Supervisor
- **Username**: `supervisor`
- **Password**: `super123`
- **Role**: Supervisor
- **Permissions**:
  - ✅ Membuat record sanitasi baru
  - ✅ Edit record sanitasi
  - ✅ Lihat daftar records
  - ✅ Export records ke Excel/PDF
  - ❌ **TIDAK BISA simpan draft to completed**
  - ❌ Kelola users
  - ❌ Akses admin panel

### 3. QC Field
- **Username**: `qcfield`
- **Password**: `qc123`
- **Role**: QC Field
- **Permissions**:
  - ✅ Membuat record sanitasi baru
  - ✅ Lihat daftar records
  - ❌ Edit record
  - ❌ Hapus record
  - ❌ Export records
  - ❌ **TIDAK BISA simpan draft to completed**
  - ❌ Kelola users
  - ❌ Akses admin panel

## Fitur Admin Panel

Admin dapat mengakses **Admin Panel** melalui tombol di pojok kanan atas halaman Records.

### Fitur Admin Panel:
1. **Tambah User Baru**
   - Set username, password, nama lengkap
   - Pilih role (Admin/Supervisor/QC Field)
   - Checklist permissions yang diinginkan

2. **Edit User**
   - Update nama lengkap
   - Ganti role
   - Ubah permissions
   - Aktifkan/Non-aktifkan user

3. **Hapus User**
   - Hapus user (kecuali admin utama)

4. **Manage Permissions**
   - Setiap user bisa dikustomisasi permission-nya
   - Permissions dikelompokkan per kategori (Records, Admin)

## Permission List

### Records Permissions:
- `create_record` - Membuat record sanitasi baru
- `edit_record` - Edit record sanitasi
- `delete_record` - Hapus record sanitasi
- `view_records` - Lihat daftar records
- `save_all_draft_to_completed` - **Simpan semua draft menjadi completed** (Admin only)
- `export_records` - Export records ke Excel/PDF

### Admin Permissions:
- `manage_users` - Kelola users dan permissions
- `view_admin_panel` - Akses admin panel

## Cara Menggunakan

### Login sebagai Admin:
1. Buka aplikasi
2. Login dengan username `admin` dan password `admin123`
3. Otomatis redirect ke Admin Panel (karena punya permission `view_admin_panel`)

### Login sebagai Supervisor/QC Field:
1. Buka aplikasi
2. Login dengan credentials masing-masing
3. Redirect ke Plant Selection
4. **TIDAK ADA tombol "Simpan Semua"** di Create Record (karena tidak punya permission)

### Menambah User Baru (sebagai Admin):
1. Login sebagai admin
2. Masuk ke Admin Panel
3. Klik "Tambah User"
4. Isi data:
   - Username
   - Password
   - Nama Lengkap
   - Role
   - Checklist permissions yang diinginkan
5. Klik "Simpan"

### Mengubah Permissions User:
1. Login sebagai admin
2. Masuk ke Admin Panel
3. Klik tombol "Edit" pada user yang ingin diubah
4. Checklist/uncheck permissions
5. Klik "Update"

## Security Notes

⚠️ **PENTING**:
- Password disimpan dalam plain text di database untuk kemudahan (aplikasi internal)
- Untuk production, gunakan bcrypt untuk hash password
- Default password HARUS DIGANTI setelah login pertama
- Admin tidak bisa dihapus dari sistem
- Hanya admin yang bisa manage users

## Troubleshooting

**Problem**: User tidak bisa "Simpan Semua"
- **Solution**: Pastikan user memiliki permission `save_all_draft_to_completed`

**Problem**: Tombol Admin Panel tidak muncul
- **Solution**: Pastikan user memiliki permission `view_admin_panel`

**Problem**: Login gagal
- **Solution**: Periksa username dan password, pastikan user status aktif (is_active = true)
