# 📘 Panduan Update Database Supabase

## 🎯 Tujuan
Menambahkan fitur Master Data Management ke aplikasi sanitasi, sehingga admin bisa mengelola Area, Bagian, dan Keterangan tanpa perlu ubah code.

## 🔧 Cara Apply Migrations

### ✅ **CARA TERMUDAH - Copy Paste SQL** (Recommended)

**Langkah 1:** Buka Supabase Dashboard
```
https://supabase.com/dashboard/project/uwxeduhjnkvgynvexyau/sql
```

**Langkah 2:** Klik tombol **"+ New query"** (pojok kanan atas)

**Langkah 3:** Apply Migration Pertama

1. Buka file: `supabase/migrations/20251010000000_create_master_data_tables.sql`
2. Copy **SEMUA ISI** file tersebut
3. Paste ke SQL Editor di Supabase
4. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
5. Tunggu sampai muncul notifikasi "Success"

**Langkah 4:** Apply Migration Kedua

1. Klik **"+ New query"** lagi untuk query baru
2. Buka file: `supabase/migrations/20251010000001_insert_initial_master_data.sql`
3. Copy **SEMUA ISI** file tersebut
4. Paste ke SQL Editor di Supabase
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Tunggu sampai muncul notifikasi "Success"

**Langkah 5:** Apply Migration Ketiga (RLS Fix) - PENTING!

1. Klik **"+ New query"** lagi untuk query baru
2. Buka file: `supabase/migrations/20251010000002_fix_rls_for_anon_users.sql`
3. Copy **SEMUA ISI** file tersebut
4. Paste ke SQL Editor di Supabase
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Tunggu sampai muncul notifikasi "Success"

⚠️ **Migration ini WAJIB agar:**
- Data bisa muncul di aplikasi
- Tombol Edit, Delete bisa berfungsi
- Admin bisa manage master data

**Langkah 6:** Apply Migration Keempat (Fix Area Names - Optional jika belum apply migration 2)

1. Klik **"+ New query"** lagi untuk query baru
2. Buka file: `supabase/migrations/20251010000003_fix_area_names_and_order.sql`
3. Copy **SEMUA ISI** file tersebut
4. Paste ke SQL Editor di Supabase
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Tunggu sampai muncul notifikasi "Success"

⚠️ **Migration ini untuk fix nama area (Sievter Silo & Premix → Silo)**

**Langkah 7:** Apply Migration Kelima (Add Manager Role)

1. Klik **"+ New query"** lagi untuk query baru
2. Buka file: `supabase/migrations/20251010120000_add_manager_role.sql`
3. Copy **SEMUA ISI** file tersebut
4. Paste ke SQL Editor di Supabase
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Tunggu sampai muncul notifikasi "Success"

⚠️ **Migration ini menambahkan:**
- Role 'manajer' ke sistem
- User default: username `manajer`, password `manajer123`
- Permission untuk manager (create, edit, delete, export, view admin panel, manage master data)

**Langkah 8:** Apply Migration Keenam (Fix QC Field Permissions - PENTING!)

1. Klik **"+ New query"** lagi untuk query baru
2. Buka file: `supabase/migrations/20251010130000_fix_qcfield_permissions.sql`
3. Copy **SEMUA ISI** file tersebut
4. Paste ke SQL Editor di Supabase
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Tunggu sampai muncul notifikasi "Success"

⚠️ **Migration ini PENTING untuk:**
- Menghapus permission `delete_record` dari QC Field
- Memastikan QC Field hanya punya: `create_record` dan `view_records`
- Mencegah QC Field menghapus data (security fix)

**Langkah 9:** Verifikasi

Setelah berhasil, check apakah tabel sudah terbuat:
1. Di Supabase Dashboard, klik **"Table Editor"** di menu kiri
2. Anda harus melihat 3 tabel baru:
   - ✅ `sanitation_areas` (8 rows)
   - ✅ `sanitation_bagian` (80+ rows)
   - ✅ `line_configurations` (26 rows)

---

## 📊 Apa yang Ditambahkan?

### 1. **Tabel Baru**

#### `sanitation_areas`
Menyimpan daftar area sanitasi:
- Sievter Silo & Premix
- Mixer
- Roll Press
- Steambox
- Cutter dan Folder
- Fryer
- Cooling Box
- Packing

#### `sanitation_bagian`
Menyimpan bagian-bagian dalam setiap area beserta:
- Nama bagian
- Keterangan/instruksi pembersihan
- Line applicability (CN, NN, GN, DN)
- Urutan tampilan

#### `line_configurations`
Menyimpan konfigurasi setiap line:
- Line 1-8, 16-33
- Tipe masing-masing (CN/NN/GN/DN)
- Plant assignment

### 2. **Halaman Admin Baru**

Akses: **Admin Panel → Master Data**

Fitur:
- ✅ Tambah/Edit/Hapus Area
- ✅ Tambah/Edit/Hapus Bagian dengan keterangan
- ✅ Atur applicable lines untuk setiap bagian
- ✅ Tambah line baru jika ada penambahan production line

### 3. **Dynamic Loading**

Create Record Screen sekarang:
- ✅ Otomatis load Area dan Bagian dari database
- ✅ Filter bagian sesuai line type (CN/NN/GN/DN)
- ✅ Keterangan auto-fill dari database
- ✅ Backward compatible (fallback ke data lama)

---

## 🚨 Troubleshooting

### Error: "relation does not exist"
➡️ Migration pertama belum dijalankan. Ulangi dari Langkah 3.

### Error: "duplicate key value"
➡️ Data sudah ada di database. Skip migration kedua atau hapus data lama dulu.

### Tabel tidak muncul di Table Editor
➡️ Refresh browser (Ctrl+F5) atau logout-login lagi dari Supabase Dashboard.

### Query timeout
➡️ Migration kedua cukup besar (80+ insert). Jika timeout:
1. Split menjadi beberapa bagian (500 baris per batch)
2. Atau increase timeout di Supabase Settings

---

## ✅ Checklist Setelah Migration

- [ ] 3 tabel baru sudah muncul di Table Editor
- [ ] `sanitation_areas` berisi 8 rows
- [ ] `sanitation_bagian` berisi 80+ rows
- [ ] `line_configurations` berisi 26 rows
- [ ] Login sebagai admin
- [ ] Akses Admin Panel → Master Data
- [ ] Test tambah/edit area atau bagian
- [ ] Buka Create Record → pilih line → check apakah area/bagian muncul sesuai line type

---

## 📞 Need Help?

Jika ada masalah atau error:
1. Screenshot error message
2. Check console browser (F12 → Console tab)
3. Check Supabase logs di Dashboard → Logs → Postgres Logs

---

## 🎉 Selesai!

Setelah migration berhasil, aplikasi Anda sudah memiliki:
- ✨ Master Data Management System
- ✨ Dynamic area & bagian sesuai line type
- ✨ Admin dapat manage data tanpa deploy ulang
- ✨ Lebih flexible untuk perubahan di masa depan

**Selamat! Database Anda sudah up-to-date! 🚀**
