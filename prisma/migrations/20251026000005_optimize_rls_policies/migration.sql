-- Optimize RLS policies by using (select auth.<function>()) pattern
-- This evaluates the function once per query instead of once per row, improving performance at scale
-- Note: This migration is defensive and checks for Supabase auth schema existence

DO $$
BEGIN
    -- Check if Supabase auth schema exists (required for auth.uid() function)
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        -- Drop existing policies if they exist
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
    ELSE
        -- If auth schema doesn't exist, skip RLS policy creation
        -- This allows the migration to succeed in environments without Supabase auth
        RAISE NOTICE 'Supabase auth schema not found. Skipping RLS policy optimization.';
    END IF;
END $$;
