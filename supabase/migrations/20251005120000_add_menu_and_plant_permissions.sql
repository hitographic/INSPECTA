/*
  # Add Menu and Plant Access Permissions

  1. Changes to Tables
    - Add `allowed_menus` (text array) to `app_users` - Daftar menu yang boleh diakses
    - Add `allowed_plants` (text array) to `app_users` - Daftar plant yang boleh diakses

  2. Menu Options
    - sanitasi_besar - Sanitasi Besar (main menu)
    - kliping - Kliping (coming soon)
    - monitoring_area - Monitoring Area (coming soon)
    - audit_internal - Audit Internal (coming soon)

  3. Plant Options
    - Plant-1
    - Plant-2
    - Plant-3

  4. Default Values
    - Update admin user to have access to all menus and all plants

  5. Notes
    - Empty array means no access
    - NULL or array with values means has access to specified items
*/

-- Add allowed_menus column (default all menus for existing users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'allowed_menus'
  ) THEN
    ALTER TABLE app_users ADD COLUMN allowed_menus text[] DEFAULT ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'];
  END IF;
END $$;

-- Add allowed_plants column (default all plants for existing users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'allowed_plants'
  ) THEN
    ALTER TABLE app_users ADD COLUMN allowed_plants text[] DEFAULT ARRAY['Plant-1', 'Plant-2', 'Plant-3'];
  END IF;
END $$;

-- Update admin user to have access to all menus and plants
UPDATE app_users
SET
  allowed_menus = ARRAY['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'],
  allowed_plants = ARRAY['Plant-1', 'Plant-2', 'Plant-3']
WHERE username = 'admin';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_app_users_allowed_menus ON app_users USING GIN (allowed_menus);
CREATE INDEX IF NOT EXISTS idx_app_users_allowed_plants ON app_users USING GIN (allowed_plants);
