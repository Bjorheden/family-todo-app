-- Add DELETE policy for tasks table
-- Allow family members to delete tasks in their family (usually admin only in practice)
CREATE POLICY "Family members can delete family tasks" ON tasks 
FOR DELETE USING (
  family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
);

-- Alternative: More restrictive policy - only allow admins to delete
-- Uncomment this and comment out the above if you want only admins to delete
/*
CREATE POLICY "Only admins can delete tasks" ON tasks 
FOR DELETE USING (
  family_id IN (
    SELECT u.family_id 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);
*/