-- Dedicated, strictly-scoped store for the Instagram Graph API credential.
-- Unlike knowledge_items/internal_credentials, the raw value is never returned
-- to the browser (see instagram-proxy edge function) — only used server-side.
CREATE TABLE instagram_credentials (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id                  TEXT NOT NULL,
  app_secret_encrypted    TEXT NOT NULL,
  access_token_encrypted  TEXT NOT NULL,
  business_account_id     TEXT NOT NULL,
  token_updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by              UUID REFERENCES profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;

-- Metadata reads (never the *_encrypted columns) for anyone who uses the marketing
-- dashboard; only admins can create/rotate/remove the credential.
CREATE POLICY "instagram_credentials_select" ON instagram_credentials
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "instagram_credentials_insert" ON instagram_credentials
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "instagram_credentials_update" ON instagram_credentials
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "instagram_credentials_delete" ON instagram_credentials
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

CREATE TRIGGER set_updated_at_instagram_credentials
  BEFORE UPDATE ON instagram_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
