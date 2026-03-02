# Fix 404 Error: JavaScript Not Loading

## ❌ Problem

Error di console:
```
Failed to load resource: the server responded with a status of 404 ()
src/main.tsx:1
```

Ini berarti:
- JavaScript file tidak ter-load
- Path salah (mencari `/src/main.tsx` tapi seharusnya `/INSPECTA/assets/index-[hash].js`)
- **GitHub Pages masih pakai deployment lama, bukan GitHub Actions workflow baru**

---

## ✅ Root Cause

GitHub Pages **Source** masih di-set ke **gh-pages branch** (method lama), bukan **GitHub Actions** (method baru).

Jadi meskipun kita push workflow baru, GitHub Pages tidak pakai workflow tersebut!

---

## 🔧 Solution: Enable GitHub Actions Deployment

### Step 1: Change GitHub Pages Source

1. **Buka:** https://github.com/hitographic/INSPECTA/settings/pages

2. **Di bagian "Build and deployment":**
   - **Source:** Pilih **GitHub Actions** (BUKAN "Deploy from a branch")

   ![Change to GitHub Actions](https://docs.github.com/assets/cb-47267/images/help/pages/github-actions-source.png)

3. **Save** (jika ada button Save)

### Step 2: Verify GitHub Secrets

1. **Buka:** https://github.com/hitographic/INSPECTA/settings/secrets/actions

2. **PASTIKAN ada 2 secrets:**

   ✅ **VITE_SUPABASE_URL**
   - Value: `https://reisfwzfbbhcahtfpojq.supabase.co`

   ✅ **VITE_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaXNmd3pmYmJoY2FodGZwb2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDk3NjAsImV4cCI6MjA3NTY4NTc2MH0.O4q1ngvPkxbGZmNbdZTeb5esEiaDIZcKY9gP4H9wa5c`

3. **Jika belum ada, add secrets sekarang**

### Step 3: Trigger New Deployment

Option A - Push any change:
```bash
git commit --allow-empty -m "Trigger GitHub Actions deployment"
git push origin main
```

Option B - Manual trigger:
1. Buka: https://github.com/hitographic/INSPECTA/actions
2. Click workflow "Deploy to GitHub Pages"
3. Click "Run workflow" → "Run workflow"

### Step 4: Monitor Deployment

1. **Watch Actions:** https://github.com/hitographic/INSPECTA/actions
2. **Wait for green checkmark** ✓ (2-3 minutes)
3. **Verify build logs** - should see:
   ```
   VITE_DEPLOY_TARGET: github-pages
   Building for GitHub Pages
   ✓ built in XX.XXs
   ```

### Step 5: Test

1. **Clear cache:** `Cmd+Shift+R` (Mac) atau `Ctrl+Shift+R` (Windows)
2. **Visit:** https://hitographic.github.io/INSPECTA/
3. **Check console** (F12) - should have NO 404 errors
4. **Should see login page** in 2-3 seconds

---

## 🔍 Verify Correct Deployment

### ✅ Correct (GitHub Actions):

Console should show:
```javascript
[APP] Base URL: /INSPECTA/
[CONFIG] Environment configuration loaded
[CONFIG] SUPABASE_URL: https://reisfwzfbbhcahtfpojq.supabase.co
```

Assets loaded:
```
✓ /INSPECTA/assets/index-[hash].js (200)
✓ /INSPECTA/assets/index-[hash].css (200)
✓ /INSPECTA/manifest.webmanifest (200)
```

### ❌ Wrong (Old deployment):

Console shows:
```
✗ src/main.tsx (404)
✗ ISS%20favicon%20icon.svg (404)
```

Assets not found (404 errors)

---

## 🎯 Alternative: Manual Build & Deploy (If Actions Fails)

If GitHub Actions doesn't work, manual deploy to gh-pages:

### Build Locally

```bash
# Set environment for GitHub Pages
export VITE_DEPLOY_TARGET=github-pages

# Build
npm run build

# Result in dist/ folder
```

### Deploy to gh-pages Branch

```bash
# Clone repo fresh (or use existing)
git clone https://github.com/hitographic/INSPECTA.git
cd INSPECTA

# Create/switch to gh-pages branch
git checkout gh-pages || git checkout --orphan gh-pages

# Clean branch
git rm -rf .
git clean -fxd

# Copy dist files to root
cp -r dist/* .
cp dist/.nojekyll .

# Commit
git add .
git commit -m "Deploy manually with base /INSPECTA/"
git push origin gh-pages --force

# Switch back to main
git checkout main
```

Then:
1. Settings → Pages → Source: **Deploy from a branch**
2. Branch: **gh-pages** / **(root)**
3. Save

But **GitHub Actions is preferred method**!

---

## 📋 Troubleshooting

### Q: Still getting 404 after switching to Actions?

**A:**
1. Check Actions tab - deployment succeeded?
2. Wait 5-10 minutes (GitHub Pages cache)
3. Clear browser cache completely
4. Try incognito mode

### Q: Actions tab shows "No workflows"?

**A:**
Workflow file mungkin belum ter-push. Check:
```bash
ls -la .github/workflows/
# Should show: deploy.yml
```

If not exist:
```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow"
git push origin main
```

### Q: Actions failed with error?

**A:**
Check error message in Actions logs. Common issues:
- Secrets not set → Add secrets
- npm install failed → Network issue, retry
- Build failed → Check build logs for errors

---

## 💡 Why This Happens

**Old Method (gh-pages branch):**
- Someone manually built & pushed to gh-pages
- Build used wrong base URL (probably `/`)
- Files deployed without correct paths

**New Method (GitHub Actions):**
- Auto-build on every push to main
- Uses `VITE_DEPLOY_TARGET=github-pages` env var
- Correct base URL `/INSPECTA/` embedded
- Secrets injected during build
- Everything automated & correct

---

## ✅ Success Criteria

After fixing, you should see:

1. ✅ No 404 errors in console
2. ✅ Login page appears within 3 seconds
3. ✅ Console shows: `[APP] Base URL: /INSPECTA/`
4. ✅ All assets load from `/INSPECTA/assets/...`
5. ✅ Can login with credentials

---

## 📞 If Still Not Working

Send screenshot of:
1. GitHub Pages settings (Source section)
2. GitHub Actions page (workflow run)
3. Browser console (all errors)
4. Network tab (F12 → Network, filter: All)

Include:
- Time of access
- Browser & version
- Did you clear cache?
- Did you try incognito?
