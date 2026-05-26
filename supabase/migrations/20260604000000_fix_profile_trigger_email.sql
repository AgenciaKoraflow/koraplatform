-- Fixes create_profile_on_signup() after the email column was added.
-- The previous version omitted password_changed_at (NOT NULL), dropped
-- SET search_path = public, and used ON CONFLICT DO UPDATE which can fail
-- under RLS. This version restores all explicit NOT NULL values and is safe.

CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role, first_login, password_changed_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
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
