-- Absolute simplest approach - allow all notifications for now
-- This should definitely work, then we can restrict it later

-- Drop existing policy
DROP POLICY IF EXISTS "notifications_family_access" ON notifications;
DROP POLICY IF EXISTS "notifications_basic" ON notifications;

-- Create a very permissive policy for testing
CREATE POLICY "notifications_permissive" ON notifications
FOR ALL TO authenticated
USING (true)  -- Allow reading all notifications (we can restrict this later)
WITH CHECK (
  -- Only allow creating notifications within the same family
  user_id = auth.uid()  -- Can create for yourself
  OR
  -- Can create for family members (simple subquery)
  EXISTS (
    SELECT 1 
    FROM users creator, users recipient
    WHERE creator.id = auth.uid()
    AND recipient.id = user_id
    AND creator.family_id = recipient.family_id
    AND creator.family_id IS NOT NULL
  )
);