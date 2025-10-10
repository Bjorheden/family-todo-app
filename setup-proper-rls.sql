-- Step-by-step RLS setup after disabling
-- Run these commands one by one in your Supabase dashboard

-- Step 1: Clear all existing policies on users table
DROP POLICY IF EXISTS "Allow family member visibility" ON users;
DROP POLICY IF EXISTS "Family members can view family users" ON users;
DROP POLICY IF EXISTS "Users can view family members" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Step 2: Create a simple, non-recursive policy for users
-- This policy avoids recursion by using a function approach
CREATE OR REPLACE FUNCTION get_user_family_id(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT family_id FROM users WHERE id = user_id;
$$;

-- Step 3: Create the users policy using the function
CREATE POLICY "users_family_access" ON users
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR 
  (family_id IS NOT NULL AND family_id = get_user_family_id(auth.uid()))
);

-- Step 4: Create users policy for updates (so users can update themselves)
CREATE POLICY "users_update_self" ON users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 5: Re-enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Test that the app still works
-- If there are issues, you can disable RLS again with:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;