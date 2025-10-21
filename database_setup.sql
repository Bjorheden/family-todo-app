-- SQL commands to run in Supabase SQL Editor
-- These will fix the RLS policy issues and add necessary functions

-- 1. Create RPC function to deduct user points (if it doesn't exist)
CREATE OR REPLACE FUNCTION deduct_user_points(user_id UUID, points_to_deduct INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET points = points - points_to_deduct
  WHERE id = user_id;
END;
$$;

-- 2. Enable RLS on rewards table (if not already enabled)
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy for admins to create rewards
CREATE POLICY "Admins can create rewards" ON rewards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.family_id = rewards.family_id
    )
  );

-- 4. Create RLS policy for family members to read rewards
CREATE POLICY "Family members can read rewards" ON rewards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.family_id = rewards.family_id
    )
  );

-- 5. Create RLS policy for admins to update rewards
CREATE POLICY "Admins can update rewards" ON rewards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.family_id = rewards.family_id
    )
  );

-- 6. Create RLS policy for reward_claims table (if not exists)
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own claims" ON reward_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own claims" ON reward_claims
  FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION deduct_user_points(UUID, INTEGER) TO authenticated;