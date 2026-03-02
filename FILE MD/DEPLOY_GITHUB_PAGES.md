# Deploy ke GitHub Pages

## Setup GitHub Secrets (Sekali Saja)

1. Buka repository GitHub: https://github.com/hitographic/INSPECTA
2. Klik **Settings** → **Secrets and variables** → **Actions**
3. Tambah 2 secrets berikut:
   - **VITE_SUPABASE_URL**: `https://reisfwzfbbhcahtfpojq.supabase.co`
   - **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaXNmd3pmYmJoY2FodGZwb2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDk3NjAsImV4cCI6MjA3NTY4NTc2MH0.O4q1ngvPkxbGZmNbdZTeb5esEiaDIZcKY9gP4H9wa5c`

## Enable GitHub Pages

1. Buka **Settings** → **Pages**
2. Di **Source**, pilih: **GitHub Actions**
3. Klik **Save**

## Deploy (Automatic)

Setiap kali push ke branch `main` atau `master`:

```bash
git add .
git commit -m "Update application"
git push origin main
```

GitHub Actions akan otomatis:
1. Build aplikasi dengan `base: '/INSPECTA/'`
2. Deploy ke GitHub Pages
3. Website accessible di: https://hitographic.github.io/INSPECTA/

## Deploy Manual (Jika GitHub Actions Tidak Berjalan)

### Cara 1: Build Local & Push

```bash
# 1. Build untuk GitHub Pages
export VITE_DEPLOY_TARGET=github-pages
npm run build

# 2. Deploy folder dist/ ke gh-pages branch
git checkout gh-pages
git pull origin gh-pages

# 3. Copy isi dist/ ke root
cp -r dist/* .

# 4. Commit & push
git add .
git commit -m "Deploy updates"
git push origin gh-pages

# 5. Kembali ke main branch
git checkout main
```

### Cara 2: Manual via Web UI

1. Build local:
   ```bash
   export VITE_DEPLOY_TARGET=github-pages
   npm run build
   ```

2. Zip folder `dist/`
3. Buka GitHub → **Actions** → **Deploy to GitHub Pages** → **Run workflow**
4. Upload zip file manual (jika ada option)

## Troubleshooting

### Blank Page?

1. **Check Console Errors**: Buka browser DevTools (F12) → Console
2. **Clear Cache**: Hard refresh dengan `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
3. **Check Build**: Pastikan build menggunakan `VITE_DEPLOY_TARGET=github-pages`
4. **Check Secrets**: Pastikan GitHub Secrets sudah di-set

### Assets 404?

- Pastikan base URL di `vite.config.ts` = `/INSPECTA/`
- Check: semua assets di index.html harus prefix `/INSPECTA/`

### Service Worker Issues?

```bash
# Clear service worker di browser:
# DevTools → Application → Service Workers → Unregister
# Lalu hard refresh
```

## Verify Deployment

Setelah deploy, check:
1. ✅ https://hitographic.github.io/INSPECTA/ tidak blank
2. ✅ Login page muncul
3. ✅ Bisa login dengan credentials
4. ✅ Data dari Supabase ter-load

## Notes

- **Base URL**: GitHub Pages = `/INSPECTA/`, Bolt.host = `/`
- **Credentials**: Embedded di build (aman karena public API keys)
- **Cache**: GitHub Pages bisa cache sampai 10 menit
- **Build Time**: ~15-30 detik via GitHub Actions
