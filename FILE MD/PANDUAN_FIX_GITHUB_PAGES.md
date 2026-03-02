# 🔧 PANDUAN LENGKAP FIX GITHUB PAGES BLANK

## 🚨 Masalah Saat Ini

Page **https://hitographic.github.io/INSPECTA/** masih blank karena:
- ❌ GitHub pakai workflow Jekyll (salah!)
- ❌ Deploy source code, bukan build result
- ❌ File workflow yang benar belum ada di repo

---

## ✅ SOLUSI LENGKAP (10 MENIT)

### **STEP 1: Buat File `.nojekyll`**

File ini memberitahu GitHub untuk TIDAK pakai Jekyll.

**Di MacBook Anda:**

```bash
# Masuk ke folder project
cd /path/to/INSPECTA

# Buat file .nojekyll (disable Jekyll)
touch .nojekyll

# Konfirmasi file ada
ls -la | grep .nojekyll
```

**Atau buat manual:**
- Klik kanan di folder INSPECTA → New File
- Nama: `.nojekyll` (dengan titik di depan!)
- Isi: kosong (file kosong)
- Save

---

### **STEP 2: Buat File Workflow**

**Di MacBook Anda:**

```bash
# Masih di folder INSPECTA
# Buat folder .github/workflows
mkdir -p .github/workflows

# Buka editor untuk buat file
nano .github/workflows/deploy.yml
```

**Copy paste isi file ini:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Save file:**
- Tekan `Ctrl + O` (save)
- Enter
- Tekan `Ctrl + X` (keluar)

**Atau buat manual di VS Code / text editor:**
1. Buat folder: `.github/workflows/`
2. Buat file: `deploy.yml` di dalam folder itu
3. Copy paste isi di atas
4. Save

---

### **STEP 3: Update `vite.config.ts`**

**Buka file `vite.config.ts`**, pastikan isinya seperti ini:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/INSPECTA/',  // ⚠️ PENTING: Sesuai nama repo
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})
```

**Yang penting:** `base: '/INSPECTA/'` harus sesuai nama repo!

---

### **STEP 4: Push ke GitHub**

```bash
# Masih di folder INSPECTA

# Cek status
git status

# Add semua file baru
git add .nojekyll
git add .github/workflows/deploy.yml
git add vite.config.ts

# Atau add semuanya sekaligus
git add .

# Commit
git commit -m "Fix GitHub Pages deployment - disable Jekyll and add workflow"

# Push ke GitHub
git push origin main
```

---

### **STEP 5: Setup GitHub Secrets (PENTING!)**

**1. Buka browser, ke:**
```
https://github.com/hitographic/INSPECTA/settings/secrets/actions
```

**2. Klik tombol "New repository secret"**

**3. Tambahkan Secret #1:**
- Name: `VITE_SUPABASE_URL`
- Secret: `https://reisfwzfbbhcahtfpojq.supabase.co`
- Klik "Add secret"

**4. Tambahkan Secret #2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Secret: (buka file `.env` di project Anda, copy value dari `VITE_SUPABASE_ANON_KEY=...`)
- Klik "Add secret"

**⚠️ JANGAN SKIP INI!** Tanpa secrets ini, app tidak bisa konek database.

---

### **STEP 6: Verifikasi GitHub Pages Settings**

**1. Buka:**
```
https://github.com/hitographic/INSPECTA/settings/pages
```

**2. Di bagian "Build and deployment":**
- **Source:** Pastikan pilih **"GitHub Actions"**
- Jangan pilih "Deploy from a branch"

**3. Klik "Save" kalau ada perubahan**

---

### **STEP 7: Trigger Deployment**

**Opsi A - Otomatis (Rekomendasi):**

Setelah push di Step 4, workflow otomatis jalan.

**Opsi B - Manual Trigger:**

1. Buka: https://github.com/hitographic/INSPECTA/actions
2. Klik workflow **"Deploy to GitHub Pages"** (yang baru)
3. Klik tombol **"Run workflow"**
4. Klik **"Run workflow"** lagi di popup

---

### **STEP 8: Tunggu & Monitor**

**1. Buka Actions:**
```
https://github.com/hitographic/INSPECTA/actions
```

**2. Lihat workflow "Deploy to GitHub Pages" sedang running:**
- Icon kuning berputar 🟡 = Sedang jalan
- Icon hijau ✅ = Berhasil
- Icon merah ❌ = Gagal (klik untuk lihat error)

**3. Tunggu 2-3 menit**

---

### **STEP 9: Cek Hasil**

**Setelah workflow ✅ (hijau):**

1. **Buka:** https://hitographic.github.io/INSPECTA/
2. **Refresh browser** (Ctrl + Shift + R atau Cmd + Shift + R)
3. **Seharusnya muncul:**
   - Logo INSPECTA
   - Form login
   - Username & Password field

**Test login:**
- Username: `admin`
- Password: `admin123`

---

## 🔍 TROUBLESHOOTING

### ❌ **Masalah: Workflow masih "Deploy Jekyll"**

**Solusi:**
1. Pastikan file `.nojekyll` ada di root folder project
2. Push file `.nojekyll`:
   ```bash
   git add .nojekyll
   git commit -m "Add .nojekyll"
   git push
   ```

---

### ❌ **Masalah: Build Failed di Actions**

**Cek di Actions tab, klik workflow yang failed.**

**Error: "ReferenceError: typescript is not defined"**
- ✅ Ini error cache Vite di GitHub Actions
- ✅ Workflow sudah di-update dengan clean cache otomatis
- ✅ Re-run workflow dengan klik "Re-run all jobs"
- ✅ Atau push lagi:
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push
   ```

**Error: "secrets not found"**
- ✅ Pastikan 2 secrets sudah di-add di GitHub
- ✅ Nama harus PERSIS: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- ✅ Re-run workflow setelah add secrets

**Error: "npm ci failed"**
- ✅ Pastikan `package-lock.json` ada di repo
- ✅ Push `package-lock.json`:
   ```bash
   git add package-lock.json
   git commit -m "Add package-lock.json"
   git push
   ```

---

### ❌ **Masalah: Page masih blank setelah deploy**

**Solusi 1 - Clear cache browser:**
```
Chrome/Edge: Ctrl + Shift + R (Windows) atau Cmd + Shift + R (Mac)
Safari: Cmd + Option + R
```

**Solusi 2 - Cek console browser:**
1. Buka page: https://hitographic.github.io/INSPECTA/
2. Tekan F12 (buka DevTools)
3. Tab "Console" - lihat error apa?

**Jika error: "Failed to load module" atau 404:**
- ✅ Cek `vite.config.ts` → `base: '/INSPECTA/'` harus sesuai nama repo
- ✅ Rebuild & push:
   ```bash
   git add vite.config.ts
   git commit -m "Fix base path"
   git push
   ```

**Jika error: "Supabase connection failed":**
- ✅ Cek secrets di GitHub (Step 5)
- ✅ Pastikan URL dan anon key benar

---

### ❌ **Masalah: 404 Page Not Found**

**Solusi:**
1. Buka: https://github.com/hitographic/INSPECTA/settings/pages
2. Pastikan "Source" = **"GitHub Actions"**
3. Tunggu 2-3 menit setelah workflow selesai
4. Clear browser cache (Ctrl + Shift + R)

---

## ✅ CHECKLIST FINAL

Sebelum test, pastikan semua ini ✅:

- [ ] File `.nojekyll` ada di root folder project
- [ ] File `.github/workflows/deploy.yml` ada & isinya benar
- [ ] File `vite.config.ts` → `base: '/INSPECTA/'`
- [ ] File `.env` ada (local development)
- [ ] Secret `VITE_SUPABASE_URL` ada di GitHub
- [ ] Secret `VITE_SUPABASE_ANON_KEY` ada di GitHub
- [ ] GitHub Pages source = "GitHub Actions"
- [ ] File sudah di-push: `git push origin main`
- [ ] Workflow "Deploy to GitHub Pages" running/completed
- [ ] Status workflow = ✅ (hijau, bukan merah)
- [ ] Tunggu 2-3 menit setelah workflow selesai
- [ ] Browser cache sudah di-clear

---

## 📱 SETELAH BERHASIL

**Install sebagai PWA:**

**Android/Chrome:**
1. Buka https://hitographic.github.io/INSPECTA/
2. Menu (3 titik) → "Add to Home screen"
3. Klik "Add"
4. Icon app muncul di home screen

**iPhone/Safari:**
1. Buka https://hitographic.github.io/INSPECTA/
2. Tombol Share (kotak dengan panah ke atas)
3. "Add to Home Screen"
4. "Add"

**Desktop/Chrome:**
1. Buka https://hitographic.github.io/INSPECTA/
2. Klik icon install (+) di address bar
3. "Install"

---

## 🎯 NEXT STEPS

**Setelah app live:**

1. **Test semua fitur:**
   - Login admin
   - Buat user baru
   - Test menu Sanitation & Kliping
   - Upload foto
   - Export data

2. **Share ke team:**
   - Kirim link: https://hitographic.github.io/INSPECTA/
   - Share credentials untuk testing

3. **Custom domain (opsional):**
   - Beli domain (misal: inspecta.id)
   - Setup di GitHub Pages settings
   - Update DNS di domain provider

---

## 💡 TIPS

**Update app di kemudian hari:**

```bash
# Edit code Anda
# ...

# Push ke GitHub
git add .
git commit -m "Update features"
git push

# GitHub otomatis build & deploy (2-3 menit)
# App auto-update!
```

**Monitor deployment:**
- Bookmark: https://github.com/hitographic/INSPECTA/actions
- Cek setiap habis push untuk pastikan deploy sukses

---

## 🆘 BUTUH BANTUAN?

Kalau masih error setelah ikuti semua steps:

1. **Screenshot error** di Actions tab
2. **Screenshot error** di browser console (F12)
3. **Kirim ke saya** dengan info:
   - Error message lengkap
   - Step mana yang bermasalah
   - Screenshot kalau perlu

---

## 🎉 SELESAI!

Ikuti steps di atas **SATU PER SATU**, jangan skip.

Setelah Step 9, app Anda akan live di:
**https://hitographic.github.io/INSPECTA/**

Good luck! 🚀
