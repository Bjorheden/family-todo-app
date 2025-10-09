-- Fix notification policies - drop existing and recreate with correct permissions

-- Drop existing notification policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;  
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create comprehensive notification policies
-- Allow users to create notifications (needed for task assignments)
CREATE POLICY "Users can create notifications" ON notifications 
FOR INSERT WITH CHECK (true);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications 
FOR DELETE USING (user_id = auth.uid());