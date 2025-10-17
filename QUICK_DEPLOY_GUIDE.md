# 🚀 Quick Deploy Guide - Hostinger

## Option A: Hybrid Deployment (RECOMMENDED - 1 Hour) ⭐

Deploy frontend to Hostinger, keep Supabase database.

### Step 1: Prepare Files (5 minutes)

```bash
# Build production files
npm run build

# Files ready in 'dist/' folder
```

### Step 2: Upload to Hostinger (15 minutes)

**Via File Manager:**
1. Login to Hostinger → **File Manager**
2. Navigate to **`public_html`**
3. Delete all default files
4. Upload **ALL files from `dist/` folder**:
   - `index.html`
   - `favicon.png`
   - `assets/` folder (all JS/CSS files)

**Via FTP (Alternative):**
1. Download **FileZilla**
2. Connect with Hostinger FTP credentials
3. Upload all files from `dist/` to `public_html/`

### Step 3: Configure SPA Routing (5 minutes)

Create **`.htaccess`** file in `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Step 4: Environment Variables (10 minutes)

**OPTION A: Rebuild with env vars (Recommended)**

On your computer:
```bash
# Set environment variables
export VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
export VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Rebuild
npm run build

# Re-upload dist/ folder
```

**OPTION B: Check if already embedded**

Your current build already has env vars embedded! Just upload and it should work.

### Step 5: Test (5 minutes)

Visit: `https://yourdomain.com`

✅ Test checklist:
- [ ] Site loads
- [ ] Can login
- [ ] Can view records
- [ ] Can create new record
- [ ] Photos upload works
- [ ] Routing works (try refresh on /admin, /records)
- [ ] Favicon shows

### Step 6: Setup SSL (Auto - 5 minutes)

Hostinger auto-enables SSL. If not:
1. Go to Hostinger **SSL** section
2. Enable **Free SSL** (Let's Encrypt)
3. Wait 5-10 minutes
4. Visit `https://yourdomain.com`

---

## Estimated Time: **45-60 minutes**

---

## Option B: Deploy to Netlify (EASIEST - 30 Minutes) 🎉

Even easier than Hostinger, and FREE!

### Step 1: Push to GitHub (10 minutes)

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub
# Then push
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### Step 2: Deploy to Netlify (10 minutes)

1. Go to **[netlify.com](https://netlify.com)**
2. Click **"Add new site"** → **"Import from Git"**
3. Connect to GitHub
4. Select your repository
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **"Deploy"**

### Step 3: Add Environment Variables (5 minutes)

In Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add:
   ```
   VITE_SUPABASE_URL = https://0ec90b57d6e95fcbda19832f.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```
3. Click **"Save"**
4. Go to **Deploys** → **"Trigger deploy"**

### Step 4: Custom Domain (Optional - 5 minutes)

1. Go to **Domain settings**
2. Add your custom domain
3. Update DNS at your domain registrar
4. Done!

---

## Estimated Time: **30 minutes**
## Cost: **$0/month** (Free tier)

---

## Option C: Deploy to Vercel (ALSO EASY - 30 Minutes) 🚀

Very similar to Netlify.

### Quick Steps:

1. Push code to **GitHub**
2. Go to **[vercel.com](https://vercel.com)**
3. Click **"Import Project"**
4. Select GitHub repo
5. Add environment variables
6. Deploy!

Same process as Netlify, just different provider.

---

## 📊 Comparison

| Feature | Hostinger | Netlify | Vercel |
|---------|-----------|---------|--------|
| **Setup Time** | 60 min | 30 min | 30 min |
| **Cost** | $3-10/mo | Free | Free |
| **Auto Deploy** | ❌ Manual | ✅ Git push | ✅ Git push |
| **SSL** | ✅ | ✅ Auto | ✅ Auto |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **FTP Access** | ✅ | ❌ | ❌ |
| **Build Preview** | ❌ | ✅ | ✅ |
| **Rollback** | ❌ Manual | ✅ 1-click | ✅ 1-click |

---

## 🎯 My Recommendation

**For ISS Sanitation App:**

### Use **Netlify** or **Vercel** instead of Hostinger!

**Why:**
1. ✅ **FREE** (vs $3-10/month Hostinger)
2. ✅ **Faster** (30 min vs 60 min setup)
3. ✅ **Auto-deploy** from Git (push code → auto update)
4. ✅ **Free SSL** (auto-enabled)
5. ✅ **Better performance** (global CDN)
6. ✅ **Easy rollback** if something breaks
7. ✅ **Preview deployments** (test before going live)
8. ✅ **Zero maintenance** (no server management)

**When to use Hostinger:**
- Need email hosting included
- Want FTP access
- Already paying for Hostinger
- Need PHP backend in future

---

## 🚀 Quick Start (Recommended Path)

### 30-Minute Netlify Deployment:

```bash
# 1. Build locally to test
npm run build

# 2. Push to GitHub
git init
git add .
git commit -m "Deploy ISS app"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# 3. Go to netlify.com
# - Import from Git
# - Select repo
# - Build command: npm run build
# - Publish directory: dist
# - Add env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
# - Deploy!

# 4. Done! Your app is live at: https://your-site.netlify.app
```

---

## 🆘 Need Help?

**Common Issues:**

**Q: Site loads but database not working**
- A: Check environment variables in Netlify/Vercel dashboard

**Q: Routing broken (404 on refresh)**
- A: Netlify/Vercel auto-handles this. For Hostinger, add .htaccess

**Q: Photos not uploading**
- A: Check Supabase Storage permissions (should be public read)

**Q: Can't login**
- A: Check Supabase URL and ANON_KEY are correct

---

## ✅ Final Checklist

Before going live:

- [ ] Build successful locally
- [ ] All environment variables set
- [ ] Supabase database accessible
- [ ] Test login works
- [ ] Test CRUD operations
- [ ] Test on mobile device
- [ ] Test all routes
- [ ] SSL enabled (HTTPS)
- [ ] Custom domain configured (optional)
- [ ] Backup current Supabase data

---

**Ready to deploy?** Choose your path and let me know if you need help! 🚀
