/*
  # Fix Audit Logs RLS Policy for Anonymous Users

  1. Changes
    - Drop existing restrictive RLS policy for authenticated users only
    - Add new policy allowing anonymous users to read audit logs
    - This aligns with the app's authentication model using app_users table

  2. Security
    - Allows anon role to read audit logs (filtering by role happens in app)
    - Maintains insert permissions for both anon and authenticated
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON audit_logs;

-- Create new policy for anonymous users
CREATE POLICY "Allow anon users to read audit logs"
  ON audit_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);
