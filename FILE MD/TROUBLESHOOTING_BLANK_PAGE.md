# Troubleshooting: Blank Page di GitHub Pages

## ✅ Yang Sudah Diperbaiki (Latest Update)

### 1. **Enhanced Error Handling** ✅
- Global error handlers untuk catch semua JavaScript errors
- Visible error messages jika ada masalah
- Loading indicator saat app sedang load
- Detailed error information untuk debugging

### 2. **Better User Feedback** ✅
- Loading screen dengan spinner
- Error page dengan troubleshooting steps
- Environment info display
- Reload button untuk quick retry

---

## 🔍 Diagnostic Steps

### Step 1: Check Apakah Ada Error Message

Setelah update terbaru, jika ada error, page **TIDAK AKAN BLANK**. Anda akan melihat:

1. **Loading Screen** (hijau dengan spinner) - Normal, tunggu beberapa detik
2. **Red Error Box** - Ada masalah, lihat error message
3. **Login Page** - Success! 🎉

### Step 2: Open Browser Console (IMPORTANT!)

**Windows/Linux:**
- Chrome/Edge: Tekan `F12` atau `Ctrl+Shift+I`
- Firefox: Tekan `F12` atau `Ctrl+Shift+K`

**Mac:**
- Chrome/Edge: Tekan `Cmd+Option+I`
- Safari: `Cmd+Option+C`
- Firefox: `Cmd+Option+K`

Screenshot console dan kirim ke developer!

---

## 🛠️ Common Issues & Solutions

### Issue 1: Still Blank (No Error, No Loading)

**Penyebab:** Old cached version

**Solusi:**
```
1. Hard Refresh:
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

2. Clear Cache Completely:
   - Chrome: Settings → Privacy → Clear browsing data
   - Pilih "Cached images and files"
   - Time range: "All time"
   - Clear data

3. Try Incognito/Private:
   - Chrome: Ctrl+Shift+N (Windows) / Cmd+Shift+N (Mac)
   - Firefox: Ctrl+Shift+P (Windows) / Cmd+Shift+P (Mac)
   - Visit: https://hitographic.github.io/INSPECTA/
```

### Issue 2: Shows Loading Forever

**Penyebab:** JavaScript file tidak ter-load

**Check di Console:**
- Look for `404` errors
- Look for `net::ERR_` messages
- Look for CORS errors

**Solusi:**
```
1. Check GitHub Pages is enabled:
   Settings → Pages → Source: GitHub Actions

2. Check latest deployment succeeded:
   Actions tab → Should be green ✓

3. Wait 5-10 minutes (GitHub Pages cache)
```

### Issue 3: Red Error Box Appears

**Good News:** Error handling is working!

**Read the error message:**
- Copy error text
- Screenshot error details
- Send to developer

**Common Errors:**

#### "Failed to fetch"
- **Cause:** Network connection or Supabase down
- **Solution:** Check internet, try again later

#### "Module not found"
- **Cause:** Build issue
- **Solution:** Rebuild needed (developer task)

#### "Supabase URL not set"
- **Cause:** GitHub Secrets not configured
- **Solution:** See [Setup Secrets](#setup-github-secrets)

---

## 🔧 Setup GitHub Secrets (If Not Done)

Ini **CRITICAL** untuk GitHub Pages!

### 1. Open GitHub Secrets Page

https://github.com/hitographic/INSPECTA/settings/secrets/actions

### 2. Add Two Secrets

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://reisfwzfbbhcahtfpojq.supabase.co`
- Click **Add secret**

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaXNmd3pmYmJoY2FodGZwb2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDk3NjAsImV4cCI6MjA3NTY4NTc2MH0.O4q1ngvPkxbGZmNbdZTeb5esEiaDIZcKY9gP4H9wa5c`
- Click **Add secret**

### 3. Trigger Rebuild

```bash
# Make any small change
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

Or manually: **Actions** → **Deploy to GitHub Pages** → **Run workflow**

---

## 📱 Test on Different Browsers

Sometimes browser-specific issues:

✅ **Recommended:**
- Chrome (latest)
- Firefox (latest)
- Edge (latest)

⚠️ **May have issues:**
- Safari (especially old versions)
- Mobile browsers (wait for PWA fix)

---

## 🚀 Deploy Fresh Build

### Via GitHub (Automatic)

```bash
# Push your changes
git add .
git commit -m "Update with better error handling"
git push origin main

# Monitor deployment
# https://github.com/hitographic/INSPECTA/actions
```

Wait 2-3 minutes, then:
1. Clear browser cache
2. Visit: https://hitographic.github.io/INSPECTA/
3. Hard refresh

---

## 📊 Verify Deployment

After successful deploy:

### ✅ Checklist:

1. **Page loads** (not blank)
2. **Loading spinner shows** briefly
3. **Login screen appears**
4. **No errors in console**
5. **Can login with credentials**

### ❌ If Still Blank:

Take these diagnostics:

1. **Screenshot of page** (blank)
2. **Screenshot of console** (F12)
3. **Screenshot of Network tab** (F12 → Network)
4. **Browser version** (Settings → About)
5. **Operating system**

Send all to developer.

---

## 🔍 Advanced: Check Files Directly

Visit these URLs directly:

1. Main page: https://hitographic.github.io/INSPECTA/
2. JavaScript: https://hitographic.github.io/INSPECTA/assets/index-[hash].js
3. CSS: https://hitographic.github.io/INSPECTA/assets/index-[hash].css
4. Manifest: https://hitographic.github.io/INSPECTA/manifest.webmanifest

If any gives 404 → Build issue, need rebuild.

---

## 💡 Pro Tips

1. **Always hard refresh** after deployment
2. **Clear cache** if changes don't show
3. **Check Actions tab** for build status
4. **Wait 5-10 minutes** for GitHub Pages cache
5. **Use incognito** to test without cache

---

## 📞 When to Contact Developer

Send diagnostics if:
- Still blank after all solutions
- Error message appears
- Console shows errors
- Assets return 404
- Deployment fails in Actions

**Include:**
- Screenshots (page + console)
- Browser & OS version
- Steps you already tried
- Time of access (for logs)
