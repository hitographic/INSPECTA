# 🚀 Deploy ke GitHub Pages - Panduan Lengkap

Aplikasi ini sudah dikonfigurasi untuk auto-deploy ke GitHub Pages setiap kali Anda push code.

---

## 📋 Langkah-Langkah Setup (5 Menit)

### 1️⃣ Push Project ke GitHub

**Jika belum ada repository:**

```bash
# Di terminal MacBook, masuk ke folder project
cd /path/to/your/project

# Initialize git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit pertama
git commit -m "Initial commit - Inspecta PWA"

# Buat repository di GitHub (https://github.com/new)
# Lalu connect ke remote:
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Push ke GitHub
git branch -M main
git push -u origin main
```

---

### 2️⃣ Setup Environment Variables (PENTING!)

1. Buka repository di GitHub
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Tambahkan 2 secrets berikut:

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://reisfwzfbbhcahtfpojq.supabase.co`

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: (copy dari file `.env` Anda, baris `VITE_SUPABASE_ANON_KEY=...`)

⚠️ **JANGAN SKIP LANGKAH INI!** Tanpa secrets ini, aplikasi tidak bisa connect ke database.

---

### 3️⃣ Enable GitHub Pages

1. Di repository GitHub, klik **Settings**
2. Scroll ke bagian **Pages** (sidebar kiri)
3. Di **Source**, pilih:
   - Source: **GitHub Actions**
4. Klik **Save**

---

### 4️⃣ Trigger Deployment

Deployment otomatis akan berjalan karena workflow sudah include `workflow_dispatch`.

**Cara manual trigger:**
1. Klik tab **Actions** di repository
2. Klik workflow **"Deploy to GitHub Pages"**
3. Klik **Run workflow** → **Run workflow**

**Atau push code baru:**
```bash
git add .
git commit -m "Update app"
git push
```

---

### 5️⃣ Akses Aplikasi

Setelah deployment selesai (2-3 menit), aplikasi bisa diakses di:

```
https://USERNAME.github.io/REPO-NAME/
```

Contoh:
- Jika username: `johndoe`
- Jika repo name: `inspecta-app`
- URL: `https://johndoe.github.io/inspecta-app/`

---

## 🔄 Update Aplikasi (Auto-Deploy)

Setelah setup awal, setiap kali Anda push code:

```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```

GitHub Actions otomatis akan:
1. Build aplikasi
2. Deploy ke GitHub Pages
3. Aplikasi live dalam 2-3 menit

---

## 🎯 Custom Domain (Opsional)

Jika ingin pakai domain sendiri (contoh: `inspecta.com`):

1. Beli domain di provider (Namecheap, GoDaddy, dll)
2. Di GitHub Settings → Pages → Custom domain
3. Masukkan domain Anda
4. Setup DNS record di domain provider:
   - Type: `CNAME`
   - Name: `www`
   - Value: `USERNAME.github.io`
   - Type: `A` (4 records)
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

---

## 📱 Install sebagai PWA

Setelah aplikasi live:

**Android/Chrome:**
1. Buka URL di Chrome
2. Menu → "Add to Home screen"

**iPhone/Safari:**
1. Buka URL di Safari
2. Share → "Add to Home Screen"

**Desktop/Chrome:**
1. Buka URL di Chrome
2. Klik icon install (+) di address bar

---

## 🛠️ Troubleshooting

### ❌ Build Failed

**Cek di Actions tab:**
- Pastikan environment variables sudah di-set di GitHub Secrets
- Pastikan tidak ada typo di nama secrets

### ❌ Aplikasi Blank Page

**Solusi:**
- Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah benar
- Cek browser console (F12) untuk error messages

### ❌ 404 Error

**Solusi:**
- Pastikan GitHub Pages source sudah di-set ke "GitHub Actions"
- Tunggu 2-3 menit setelah deployment selesai
- Clear browser cache

### ❌ Database Connection Error

**Solusi:**
- Verify secrets di GitHub Settings → Secrets and variables → Actions
- Re-run workflow setelah fix secrets

---

## 📊 Monitoring Deployment

**Cek status deployment:**
1. Buka tab **Actions** di GitHub
2. Lihat workflow runs terbaru
3. Klik untuk detail logs

**Status badge (opsional):**
Tambahkan di README untuk show deployment status:
```markdown
![Deploy](https://github.com/USERNAME/REPO-NAME/actions/workflows/deploy.yml/badge.svg)
```

---

## ✅ Checklist Setup

- [ ] Project di-push ke GitHub
- [ ] `VITE_SUPABASE_URL` secret ditambahkan
- [ ] `VITE_SUPABASE_ANON_KEY` secret ditambahkan
- [ ] GitHub Pages source set ke "GitHub Actions"
- [ ] Workflow triggered (manual atau push)
- [ ] Deployment success di Actions tab
- [ ] Aplikasi bisa diakses di `https://USERNAME.github.io/REPO-NAME/`
- [ ] Test login dan fitur utama

---

## 🎉 Selesai!

Aplikasi Anda sekarang live di GitHub Pages dengan:
- ✅ Auto-deploy setiap push
- ✅ HTTPS gratis
- ✅ Unlimited bandwidth
- ✅ PWA support
- ✅ Database cloud (Supabase)

**Selamat! Aplikasi Anda sudah production-ready! 🚀**
