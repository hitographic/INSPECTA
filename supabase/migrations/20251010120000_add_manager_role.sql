/*
  # Add Manager Role

  ## Overview
  Adds 'manajer' role to the application with appropriate permissions.
  Manager has similar permissions to supervisor but with additional capabilities.

  ## Changes
  1. Update role check constraint to include 'manajer'
  2. Add permission definitions for manager-specific permissions
  3. Create default manager user for testing

  ## Permissions for Manager
  - create_record - Can create new records
  - edit_record - Can edit records
  - delete_record - Can delete records
  - view_records - Can view all records
  - export_records - Can export to Excel/PDF
  - view_admin_panel - Can access admin panel (read-only for some features)
  - manage_master_data - Can manage master data (areas, bagian, lines)

  ## Security
  - RLS policies remain open (app handles authorization)
  - Role validation at application level via authService
*/

-- Update app_users table to allow 'manajer' role
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'app_users_role_check'
    AND table_name = 'app_users'
  ) THEN
    ALTER TABLE app_users DROP CONSTRAINT app_users_role_check;
  END IF;

  -- Add new constraint with 'manajer' role
  ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('admin', 'supervisor', 'qc_field', 'manajer'));
END $$;

-- Insert manager-specific permission definitions
INSERT INTO permission_definitions (permission_name, description, category)
VALUES
  ('manage_master_data', 'Kelola master data (areas, bagian, lines)', 'Master Data')
ON CONFLICT (permission_name) DO NOTHING;

-- Create default manager user
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if manager user already exists
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'manajer') THEN
    -- Insert manager user
    INSERT INTO app_users (
      username,
      password_hash,
      full_name,
      role,
      is_active,
      created_by,
      allowed_menus,
      allowed_plants
    )
    VALUES (
      'manajer',
      'manajer123',
      'Manager',
      'manajer',
      true,
      'system',
      ARRAY[]::text[],
      ARRAY[]::text[]
    )
    RETURNING id INTO v_user_id;

    -- Grant permissions to manager
    INSERT INTO user_permissions (user_id, permission)
    VALUES
      (v_user_id, 'create_record'),
      (v_user_id, 'edit_record'),
      (v_user_id, 'delete_record'),
      (v_user_id, 'view_records'),
      (v_user_id, 'export_records'),
      (v_user_id, 'view_admin_panel'),
      (v_user_id, 'manage_master_data');
  END IF;
END $$;
