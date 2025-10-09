-- Add missing policies for families table
-- Allow authenticated users to create families
CREATE POLICY "Users can create families" ON families 
FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Allow family admins to view their family
CREATE POLICY "Admins can view their family" ON families 
FOR SELECT USING (auth.uid() = admin_id);

-- Allow family admins to update their family
CREATE POLICY "Admins can update their family" ON families 
FOR UPDATE USING (auth.uid() = admin_id);

-- Add missing policies for notifications table
-- Allow users to create notifications for others (when creating tasks, etc.)
CREATE POLICY "Users can create notifications" ON notifications 
FOR INSERT WITH CHECK (true);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());