-- Fix: trigger create_profile_on_signup() fails when password_changed_at lacks a DEFAULT.
-- Ensures the column always has a default and rebuilds the trigger to be explicit.

-- Guarantee defaults on all NOT NULL timestamp columns (idempotent)
ALTER TABLE profiles
  ALTER COLUMN password_changed_at SET DEFAULT NOW(),
  ALTER COLUMN created_at          SET DEFAULT NOW(),
  ALTER COLUMN updated_at          SET DEFAULT NOW();

-- Rebuild the trigger function to explicitly provide all required values
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, first_login, password_changed_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      CASE WHEN NEW.raw_user_meta_data->>'role' IN ('admin','operador','observador')
           THEN (NEW.raw_user_meta_data->>'role')::user_role END,
      'observador'
    ),
    TRUE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
