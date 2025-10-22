# 🚀 Full Migration Guide: Supabase → Hostinger

## 📊 Overview

This guide will help you migrate your entire application from Bolt + Supabase to Hostinger with MySQL database.

### Current Architecture:
- **Frontend**: React PWA on Bolt
- **Database**: PostgreSQL on Supabase (managed)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (for photos)

### Target Architecture:
- **Frontend**: React PWA on Hostinger
- **Database**: MySQL on Hostinger
- **Auth**: Custom auth (JWT-based)
- **Storage**: Hostinger file storage

---

## ⚠️ IMPORTANT CONSIDERATIONS

### 1. **Database Engine Differences:**

**PostgreSQL (Supabase) vs MySQL (Hostinger):**

| Feature | PostgreSQL | MySQL | Migration Impact |
|---------|-----------|-------|------------------|
| UUID type | ✅ Native | ❌ Use CHAR(36) | Need to convert |
| Array types | ✅ | ❌ | Need JSON or separate table |
| JSON functions | Different syntax | Different syntax | Rewrite queries |
| Timestamp | timestamptz | TIMESTAMP | Minor changes |
| Boolean | boolean | TINYINT(1) | Auto-convert |
| Text | text | TEXT/VARCHAR | Compatible |

### 2. **Missing Features in Hostinger:**

- ❌ Row Level Security (RLS) - Must implement in backend
- ❌ Real-time subscriptions - Need WebSockets
- ❌ Built-in Auth - Need custom implementation
- ❌ Storage API - Need custom file upload
- ❌ Auto-generated REST API - Need to build API

### 3. **Recommended: Keep Supabase (Easier!)**

**Why keep Supabase:**
- ✅ No database migration needed
- ✅ No auth rewrite needed
- ✅ No RLS reimplementation needed
- ✅ Just deploy frontend to Hostinger
- ✅ Keep using Supabase API (it's just HTTP calls)
- ✅ Same code, just different hosting
- 💰 Supabase free tier: 500MB database, 1GB file storage

**Cost comparison:**
- Supabase Free: $0/month (good for small apps)
- Hostinger Business: ~$3-10/month + need to build backend

---

## 📋 MIGRATION PATH OPTIONS

### **Option A: Hybrid (RECOMMENDED)**
- Frontend → Hostinger
- Database → Keep Supabase
- **Pros**: Easy, no code changes, works immediately
- **Cons**: Dependency on Supabase
- **Best for**: Quick deployment, small apps

### **Option B: Full Migration**
- Frontend → Hostinger
- Database → Hostinger MySQL
- Backend API → Build from scratch
- **Pros**: Full control, no external dependencies
- **Cons**: Complex, requires backend development, more work
- **Best for**: Large apps, need full control

### **Option C: Alternative Hosting**
- Deploy everything to Netlify/Vercel (free!)
- Keep Supabase database
- **Pros**: Easiest, free, auto-deploy from Git
- **Cons**: Less control than Hostinger
- **Best for**: Most projects

---

## 🔧 OPTION B: Full Migration Steps

If you insist on migrating database to Hostinger, here's how:

### **Phase 1: Setup Hostinger MySQL Database**

1. **Login to Hostinger:**
   - Go to **Databases** section
   - Create new MySQL database
   - Note credentials:
     - Database name
     - Username
     - Password
     - Host (usually localhost)

2. **Access phpMyAdmin:**
   - Import SQL schema (see Phase 2)

---

### **Phase 2: Convert PostgreSQL Schema to MySQL**

**Major changes needed:**

```sql
-- PostgreSQL (Current)
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- MySQL (Target)
CREATE TABLE app_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**I can generate MySQL-compatible schema for you!**

---

### **Phase 3: Export Data from Supabase**

**Method 1: Via Supabase Dashboard**

1. Go to SQL Editor
2. Export each table:
```sql
-- Export users
COPY (SELECT * FROM app_users) TO STDOUT WITH CSV HEADER;

-- Export records
COPY (SELECT * FROM sanitation_records) TO STDOUT WITH CSV HEADER;

-- Export permissions
COPY (SELECT * FROM user_permissions) TO STDOUT WITH CSV HEADER;
```

3. Save as CSV files
4. Import to MySQL via phpMyAdmin

**Method 2: Via pg_dump (if you have access)**

```bash
pg_dump -h your-supabase-host -U postgres -d postgres \
  --data-only --inserts > data_export.sql
```

---

### **Phase 4: Rewrite Backend Code**

**Current Code (Supabase):**
```typescript
import { supabase } from './supabase';

// Fetch data
const { data } = await supabase
  .from('sanitation_records')
  .select('*');
```

**New Code (MySQL):**

**Option A: Create Node.js Backend API**

```typescript
// backend/server.js
import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_user',
  password: 'your_password',
  database: 'your_db',
  waitForConnections: true,
  connectionLimit: 10
});

// API endpoint
app.get('/api/records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sanitation_records');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

**Option B: Use PHP (Hostinger native)**

```php
<?php
// api/records.php
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'user', 'password', 'database');

if ($conn->connect_error) {
  die(json_encode(['error' => 'Connection failed']));
}

$result = $conn->query('SELECT * FROM sanitation_records');
$records = [];

while($row = $result->fetch_assoc()) {
  $records[] = $row;
}

echo json_encode(['data' => $records]);
?>
```

---

### **Phase 5: Rewrite Frontend API Calls**

**Current (Supabase):**
```typescript
const { data } = await supabase.from('records').select('*');
```

**New (Custom API):**
```typescript
const response = await fetch('https://yourdomain.com/api/records');
const { data } = await response.json();
```

**Files to modify:**
- `src/utils/database.ts` - All database operations
- `src/utils/authService.ts` - Auth logic
- `src/pages/*.tsx` - All components using database

**Estimated work: 2-3 days** for rewriting all database calls.

---

### **Phase 6: Reimplement Authentication**

**Current (Supabase Auth):**
- JWT tokens auto-managed
- Session handling built-in
- Password hashing built-in

**New (Custom Auth):**

Need to implement:
1. Password hashing (bcrypt)
2. JWT generation & validation
3. Session management
4. Login/logout endpoints
5. Token refresh logic

**Example:**
```typescript
// backend/auth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Get user from database
  const [users] = await pool.query(
    'SELECT * FROM app_users WHERE username = ?',
    [username]
  );

  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = users[0];

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    'your-secret-key',
    { expiresIn: '7d' }
  );

  res.json({ token, user });
});
```

---

### **Phase 7: Reimplement Row Level Security**

**Current (Database-level RLS):**
```sql
CREATE POLICY "Users can view own records"
  ON sanitation_records FOR SELECT
  USING (created_by = auth.uid());
```

**New (Application-level):**
```typescript
// Middleware to check permissions
app.get('/api/records', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  // Filter records by user
  const [rows] = await pool.query(
    'SELECT * FROM sanitation_records WHERE created_by = ?',
    [userId]
  );

  res.json({ data: rows });
});
```

---

### **Phase 8: Reimplement File Storage**

**Current (Supabase Storage):**
```typescript
await supabase.storage
  .from('photos')
  .upload('filename.jpg', file);
```

**New (Hostinger File System):**

```typescript
// backend/upload.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.random() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('photo'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.filename}`
  });
});
```

---

## 📊 Effort Estimation

| Task | Complexity | Time | Risk |
|------|-----------|------|------|
| Export database | Easy | 1 hour | Low |
| Convert PostgreSQL → MySQL | Medium | 4 hours | Medium |
| Import data | Easy | 1 hour | Medium |
| Build backend API | Hard | 2 days | High |
| Rewrite frontend calls | Medium | 1 day | Medium |
| Reimplement auth | Hard | 1 day | High |
| Reimplement RLS | Hard | 1 day | High |
| Reimplement storage | Medium | 4 hours | Medium |
| Testing | Medium | 1 day | High |
| **TOTAL** | **HARD** | **6-7 days** | **HIGH** |

---

## 💰 Cost Comparison

### Keep Supabase (Hybrid):
- Hostinger: $3-10/month
- Supabase Free: $0/month
- **Total: $3-10/month**
- **Development time: 1 hour**

### Full Migration:
- Hostinger Business: $10/month (need Node.js)
- Development cost: 6-7 days × $50/day = **$300-350**
- **Total first month: $310-360**
- **Ongoing: $10/month**

### Alternative (Netlify/Vercel):
- Hosting: $0/month (free tier)
- Supabase: $0/month (free tier)
- **Total: $0/month**
- **Development time: 1 hour**

---

## ✅ My Recommendation

**For your use case (ISS Sanitation App):**

### **Choose Option A: Hybrid (Frontend to Hostinger, Keep Supabase)**

**Why:**
1. ✅ **Quick deployment** - Ready in 1 hour
2. ✅ **No code changes** - Everything works as-is
3. ✅ **Low cost** - $3-10/month total
4. ✅ **Low risk** - No database migration issues
5. ✅ **Maintained features** - Auth, RLS, real-time all work
6. ✅ **Easy scaling** - Supabase handles database performance

**When to migrate database:**
- If Supabase free tier not enough (>500MB data)
- If you need 100% data sovereignty
- If Supabase API is slow from Indonesia
- If you want zero external dependencies

---

## 🎯 Next Steps

**If you choose Hybrid (Recommended):**
1. I'll guide you to deploy frontend to Hostinger
2. Keep Supabase as-is
3. Done in 1 hour!

**If you choose Full Migration:**
1. I'll generate MySQL schema for you
2. I'll create backend API structure
3. We'll rewrite all database calls
4. Estimate 6-7 days work

**If you choose Netlify/Vercel:**
1. Push code to GitHub
2. Connect Netlify to repo
3. Add environment variables
4. Done in 30 minutes!

---

## 📞 What's Your Decision?

Let me know which path you want to take, and I'll guide you step by step! 🚀

**Questions to help decide:**
1. Berapa budget untuk hosting per bulan?
2. Berapa banyak data yang akan disimpan? (MB/GB)
3. Butuh akses database secara langsung via phpMyAdmin?
4. Berapa lama deadline untuk go-live?
5. Ada developer backend untuk maintain API?
