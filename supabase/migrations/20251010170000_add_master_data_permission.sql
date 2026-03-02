/*
  # Add Master Data Management Permission

  1. Changes
    - Add new permission 'manage_master_data' to permission_definitions table
    - This allows Manager and Supervisor roles to access Master Data Management
    - without needing full admin panel access

  2. Security
    - Permission is added with proper description
    - Can be assigned to users via admin panel
*/

-- Add new permission for master data management
INSERT INTO permission_definitions (permission_name, description, category)
VALUES (
  'manage_master_data',
  'Akses untuk mengelola master data areas dan bagian sanitasi',
  'master_data'
)
ON CONFLICT (permission_name) DO NOTHING;

-- Grant this permission to existing managers and supervisors
UPDATE users
SET permissions = array_append(permissions, 'manage_master_data')
WHERE role IN ('manajer', 'supervisor')
AND NOT ('manage_master_data' = ANY(permissions));
