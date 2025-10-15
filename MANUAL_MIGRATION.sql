-- =====================================================
-- MANUAL MIGRATION: Add Menu and Plant Permissions
-- =====================================================
-- Copy paste SQL ini ke Supabase SQL Editor dan Run
-- =====================================================

-- Step 1: Add allowed_menus column
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS allowed_menus text[] 
DEFAULT ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'];

-- Step 2: Add allowed_plants column  
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS allowed_plants text[] 
DEFAULT ARRAY['Plant-1', 'Plant-2', 'Plant-3'];

-- Step 3: Update admin user dengan full access
UPDATE app_users 
SET 
  allowed_menus = ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'],
  allowed_plants = ARRAY['Plant-1', 'Plant-2', 'Plant-3']
WHERE username = 'admin';

-- Step 4: Update semua existing users dengan full access (optional)
UPDATE app_users 
SET 
  allowed_menus = ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'],
  allowed_plants = ARRAY['Plant-1', 'Plant-2', 'Plant-3']
WHERE allowed_menus IS NULL OR allowed_plants IS NULL;

-- Step 5: Create indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_app_users_allowed_menus ON app_users USING GIN (allowed_menus);
CREATE INDEX IF NOT EXISTS idx_app_users_allowed_plants ON app_users USING GIN (allowed_plants);

-- =====================================================
-- Verification Query
-- =====================================================
-- Jalankan query ini untuk verify migration berhasil:
SELECT 
  username, 
  role,
  allowed_menus,
  allowed_plants,
  array_length(allowed_menus, 1) as menu_count,
  array_length(allowed_plants, 1) as plant_count
FROM app_users
ORDER BY username;
