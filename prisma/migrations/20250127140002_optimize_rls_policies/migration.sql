-- Optimize RLS policies by using (select auth.<function>()) pattern
-- This evaluates the function once per query instead of once per row, improving performance at scale

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Recreate policies with optimized pattern
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING ((select auth.uid())::text = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING ((select auth.uid())::text = id)
WITH CHECK ((select auth.uid())::text = id);

