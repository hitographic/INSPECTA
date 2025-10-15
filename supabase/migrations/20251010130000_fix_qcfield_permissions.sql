/*
  # Fix QC Field Permissions

  ## Overview
  Remove delete_record permission from QC Field users to prevent them from deleting data.
  QC Field should only have create_record and view_records permissions.

  ## Changes
  1. Remove delete_record permission from all users with role 'qc_field'
  2. Ensure QC Field users only have: create_record and view_records

  ## Security
  - Prevents QC Field users from deleting records
  - Maintains read and create access for QC Field role
*/

-- Delete delete_record permission from all qc_field users
DELETE FROM user_permissions
WHERE permission = 'delete_record'
  AND user_id IN (
    SELECT id FROM app_users WHERE role = 'qc_field'
  );

-- Also remove edit_record if exists (QC Field should not edit)
DELETE FROM user_permissions
WHERE permission = 'edit_record'
  AND user_id IN (
    SELECT id FROM app_users WHERE role = 'qc_field'
  );

-- Also remove export_records if exists (QC Field should not export)
DELETE FROM user_permissions
WHERE permission = 'export_records'
  AND user_id IN (
    SELECT id FROM app_users WHERE role = 'qc_field'
  );

-- Ensure QC Field users have the correct permissions
DO $$
DECLARE
  qc_user RECORD;
BEGIN
  FOR qc_user IN SELECT id FROM app_users WHERE role = 'qc_field'
  LOOP
    -- Ensure create_record permission exists
    INSERT INTO user_permissions (user_id, permission)
    VALUES (qc_user.id, 'create_record')
    ON CONFLICT (user_id, permission) DO NOTHING;

    -- Ensure view_records permission exists
    INSERT INTO user_permissions (user_id, permission)
    VALUES (qc_user.id, 'view_records')
    ON CONFLICT (user_id, permission) DO NOTHING;
  END LOOP;
END $$;
