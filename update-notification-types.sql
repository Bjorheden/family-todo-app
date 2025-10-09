-- Update notification types to include 'task_approved'
-- This fixes the check constraint error when creating task_approved notifications

-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new check constraint with 'task_approved' included
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('task_completed', 'task_assigned', 'task_approved', 'reward_claimed', 'general'));