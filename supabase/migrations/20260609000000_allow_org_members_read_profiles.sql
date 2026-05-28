-- Reset all profiles RLS policies to a clean, simple state.
-- Previous migrations left overlapping/broken policies after org_id removal.

DROP POLICY IF EXISTS "profiles_select_own"            ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin"          ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"          ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated"  ON profiles;

-- All authenticated users can read all profiles (avatars, mentions, assignee lists).
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Each user can update their own profile (avatar, name, etc.).
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (role management).
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
