/*
  # Add delete monitoring records permission

  1. Changes
    - Add new permission 'delete_monitoring_records' to permission_definitions
    - This allows authorized users to bulk delete monitoring records

  2. Security
    - Permission is assigned through admin panel
    - Used to control access to bulk delete functionality
*/

-- Add delete monitoring records permission if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM permission_definitions WHERE permission_name = 'delete_monitoring_records'
  ) THEN
    INSERT INTO permission_definitions (permission_name, description, category)
    VALUES (
      'delete_monitoring_records',
      'Hapus record monitoring area',
      'Records'
    );
  END IF;
END $$;