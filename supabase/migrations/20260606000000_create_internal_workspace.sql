-- ─── internal_workspace ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_workspace (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  slug           TEXT        UNIQUE,
  logo_url       TEXT,
  description    TEXT,
  owner_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── internal_credentials ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_credentials (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID        NOT NULL REFERENCES internal_workspace(id) ON DELETE CASCADE,
  title               TEXT,
  username            TEXT,
  password_encrypted  TEXT,
  has_password        BOOLEAN     GENERATED ALWAYS AS (password_encrypted IS NOT NULL) STORED,
  url                 TEXT,
  notes               TEXT,
  category            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── internal_insights ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_insights (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES internal_workspace(id) ON DELETE CASCADE,
  title        TEXT,
  content      TEXT,
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── internal_tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES internal_workspace(id) ON DELETE CASCADE,
  title        TEXT,
  description  TEXT,
  status       TEXT        NOT NULL DEFAULT 'todo',
  priority     TEXT        NOT NULL DEFAULT 'medium',
  assigned_to  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── internal_documents ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES internal_workspace(id) ON DELETE CASCADE,
  title        TEXT,
  content      TEXT,
  category     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── updated_at triggers ─────────────────────────────────────────────────────
-- update_updated_at() is defined in 20260522000000_migrate_business_tables.sql

DROP TRIGGER IF EXISTS set_updated_at_internal_workspace    ON internal_workspace;
DROP TRIGGER IF EXISTS set_updated_at_internal_credentials  ON internal_credentials;
DROP TRIGGER IF EXISTS set_updated_at_internal_insights     ON internal_insights;
DROP TRIGGER IF EXISTS set_updated_at_internal_tasks        ON internal_tasks;
DROP TRIGGER IF EXISTS set_updated_at_internal_documents    ON internal_documents;

CREATE TRIGGER set_updated_at_internal_workspace
  BEFORE UPDATE ON internal_workspace
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_internal_credentials
  BEFORE UPDATE ON internal_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_internal_insights
  BEFORE UPDATE ON internal_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_internal_tasks
  BEFORE UPDATE ON internal_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_internal_documents
  BEFORE UPDATE ON internal_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- get_my_role() is a STABLE SECURITY DEFINER function from 20260524000001.
-- SELECT: admin + operador; INSERT/UPDATE/DELETE: admin only.

ALTER TABLE internal_workspace    ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_credentials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_insights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_documents    ENABLE ROW LEVEL SECURITY;

-- internal_workspace
DROP POLICY IF EXISTS "iw_select" ON internal_workspace;
DROP POLICY IF EXISTS "iw_insert" ON internal_workspace;
DROP POLICY IF EXISTS "iw_update" ON internal_workspace;
DROP POLICY IF EXISTS "iw_delete" ON internal_workspace;
CREATE POLICY "iw_select" ON internal_workspace
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "iw_insert" ON internal_workspace
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "iw_update" ON internal_workspace
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "iw_delete" ON internal_workspace
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- internal_credentials
DROP POLICY IF EXISTS "ic_select" ON internal_credentials;
DROP POLICY IF EXISTS "ic_insert" ON internal_credentials;
DROP POLICY IF EXISTS "ic_update" ON internal_credentials;
DROP POLICY IF EXISTS "ic_delete" ON internal_credentials;
CREATE POLICY "ic_select" ON internal_credentials
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "ic_insert" ON internal_credentials
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "ic_update" ON internal_credentials
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "ic_delete" ON internal_credentials
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- internal_insights
DROP POLICY IF EXISTS "ii_select" ON internal_insights;
DROP POLICY IF EXISTS "ii_insert" ON internal_insights;
DROP POLICY IF EXISTS "ii_update" ON internal_insights;
DROP POLICY IF EXISTS "ii_delete" ON internal_insights;
CREATE POLICY "ii_select" ON internal_insights
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "ii_insert" ON internal_insights
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "ii_update" ON internal_insights
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "ii_delete" ON internal_insights
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- internal_tasks
DROP POLICY IF EXISTS "it_select" ON internal_tasks;
DROP POLICY IF EXISTS "it_insert" ON internal_tasks;
DROP POLICY IF EXISTS "it_update" ON internal_tasks;
DROP POLICY IF EXISTS "it_delete" ON internal_tasks;
CREATE POLICY "it_select" ON internal_tasks
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "it_insert" ON internal_tasks
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "it_update" ON internal_tasks
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "it_delete" ON internal_tasks
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- internal_documents
DROP POLICY IF EXISTS "id_select" ON internal_documents;
DROP POLICY IF EXISTS "id_insert" ON internal_documents;
DROP POLICY IF EXISTS "id_update" ON internal_documents;
DROP POLICY IF EXISTS "id_delete" ON internal_documents;
CREATE POLICY "id_select" ON internal_documents
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "id_insert" ON internal_documents
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "id_update" ON internal_documents
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "id_delete" ON internal_documents
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- ─── Seed: default workspace ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM internal_workspace WHERE slug = 'koraflow') THEN
    INSERT INTO internal_workspace (name, slug, description)
    VALUES ('Koraflow', 'koraflow', 'Operação interna da empresa');
  END IF;
END $$;
