/*
  # Fix user_permissions RLS Policy for Login Access

  1. Security Changes
    - Add SELECT policy for anonymous users on user_permissions table
    - Required during login to fetch user permissions
    - Policy allows reading permission data for authentication
    
  2. Important Notes
    - This policy is essential for login to retrieve user permissions
    - Without this, the login process cannot fetch user permissions
    - The policy only allows SELECT operations for authentication purposes
*/

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous users to read user_permissions for login" ON user_permissions;
DROP POLICY IF EXISTS "Enable read access for anonymous users" ON user_permissions;

-- Create policy to allow anonymous users to SELECT from user_permissions for login
CREATE POLICY "Allow anonymous users to read user_permissions for login"
  ON user_permissions
  FOR SELECT
  TO anon
  USING (true);
