-- Fix: RLS policies on profiles were self-referential, causing infinite recursion
-- on UPDATE (500 error). Solution: SECURITY DEFINER helpers that bypass RLS.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate admin policies without recursive subqueries
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    get_my_role() = 'admin' AND org_id = get_my_org_id()
  );

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    get_my_role() = 'admin' AND org_id = get_my_org_id()
  );
