/*
  # Fix app_users RLS Policy for Login Access

  1. Security Changes
    - Add SELECT policy for anonymous users to enable login functionality
    - Users need to read from app_users table during login authentication
    - Policy allows reading user data for login validation
    
  2. Important Notes
    - This policy is essential for the login functionality to work
    - Without this policy, all queries to app_users are blocked by RLS
    - The policy only allows SELECT operations for authentication purposes
*/

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous users to read app_users for login" ON app_users;
DROP POLICY IF EXISTS "Enable read access for anonymous users" ON app_users;

-- Create policy to allow anonymous users to SELECT from app_users for login
CREATE POLICY "Allow anonymous users to read app_users for login"
  ON app_users
  FOR SELECT
  TO anon
  USING (true);
