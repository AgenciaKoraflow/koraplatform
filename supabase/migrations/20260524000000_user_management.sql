-- User roles enum (idempotent)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'operador', 'observador');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001',
  full_name TEXT,
  description TEXT,
  cargo TEXT,
  vertente TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'observador',
  first_login BOOLEAN NOT NULL DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if the table already existed without them
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vertente TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'observador';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT TRUE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User can read and update their own profile
DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin can read all profiles in the same org
DO $$ BEGIN
  CREATE POLICY "profiles_select_admin" ON profiles
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.org_id = profiles.org_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin can update any profile in the same org (e.g., change role)
DO $$ BEGIN
  CREATE POLICY "profiles_update_admin" ON profiles
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.org_id = profiles.org_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Password history — only accessible via service role (edge functions)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "password_history_no_user_access" ON password_history
    FOR ALL USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update updated_at on profiles change
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create profile when a new auth user is created
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, first_login, org_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'observador'),
    TRUE,
    COALESCE((NEW.raw_user_meta_data->>'org_id')::UUID, '10000000-0000-0000-0000-000000000001')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
