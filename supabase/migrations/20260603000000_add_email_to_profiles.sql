-- Add email column to profiles for display and search in user management UI.
-- Backfill from auth.users and keep in sync via trigger.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing rows from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS NULL;

-- Update the signup trigger to also populate email
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role, first_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(
      CASE WHEN NEW.raw_user_meta_data->>'role' IN ('admin','operador','observador')
           THEN (NEW.raw_user_meta_data->>'role')::user_role END,
      'observador'
    ),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
