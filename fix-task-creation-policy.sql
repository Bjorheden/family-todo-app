-- Fix task creation policy to only allow admins
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Family members can insert tasks" ON tasks;

-- Create new admin-only policy for task creation
CREATE POLICY "Only admins can create tasks" ON tasks 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);