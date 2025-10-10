-- Optional cleanup: Review current policies
-- Run this to see what policies are currently active

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('families', 'users')
ORDER BY tablename, policyname;

-- You should see:
-- On 'users' table: "users_family_access" and "users_update_self" 
-- On 'families' table: "Allow basic family info for joining" (and maybe others)

-- If you want to clean up any duplicate or old policies on families table, you can run:
-- DROP POLICY IF EXISTS "old_policy_name" ON families;