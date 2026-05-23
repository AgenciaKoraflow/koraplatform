-- Migration: move business tables from external DB to main project
-- Org padrão (single-tenant, nunca muda)
-- Run this in the SQL Editor of project jucejqnalymzeegjieyh

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001'
                     REFERENCES organizations(id),
  name               TEXT,
  company            TEXT,
  email              TEXT,
  phone              TEXT,
  pipeline_stage     TEXT,
  notes              TEXT,
  anniversary        DATE,
  briefing           TEXT,
  proposal_sent_date DATE,
  head               TEXT,
  bu                 TEXT[],
  logo               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001'
                        REFERENCES organizations(id),
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name                  TEXT,
  description           TEXT,
  status                TEXT,
  progress              INTEGER DEFAULT 0,
  end_date              DATE,
  team                  TEXT[],
  head                  TEXT,
  value                 NUMERIC,
  billing_type          TEXT,
  type                  TEXT,
  recurrence_value      NUMERIC,
  recurrence_start_date DATE,
  bu                    TEXT[],
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001'
              REFERENCES organizations(id),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT,
  description TEXT,
  status      TEXT,
  priority    TEXT,
  due_date    DATE,
  assigned_to TEXT,
  bu          TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                       UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001'
                               REFERENCES organizations(id),
  client_id                    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_ids                  UUID[],
  project_id                   UUID REFERENCES projects(id) ON DELETE SET NULL,
  title                        TEXT,
  value                        NUMERIC,
  status                       TEXT,
  type                         TEXT,
  billing_type                 TEXT,
  recurrence_value             NUMERIC,
  recurrence_start_date        DATE,
  created_at                   TIMESTAMPTZ DEFAULT now(),
  signed_at                    DATE,
  end_date                     DATE,
  expires_at                   DATE,
  document_name                TEXT,
  document_data                TEXT,
  document_type                TEXT,
  document_storage_path        TEXT,
  document_version             INTEGER DEFAULT 0,
  signed_document_storage_path TEXT,
  signature_link_token         TEXT UNIQUE,
  signature_link_expires_at    TIMESTAMPTZ,
  signature_sent_at            TIMESTAMPTZ,
  koraflow_signed_at           TIMESTAMPTZ,
  koraflow_signature_data      TEXT,
  koraflow_signer_name         TEXT,
  koraflow_signer_email        TEXT,
  koraflow_signer_user_id      UUID,
  client_signed_at             TIMESTAMPTZ,
  client_signature_data        TEXT,
  client_signer_name           TEXT,
  client_signer_email          TEXT,
  client_cpf                   TEXT,
  signed_document_data         TEXT,
  fully_signed_at              TIMESTAMPTZ,
  signature_order              TEXT,
  contractor_signed_at         TIMESTAMPTZ,
  contractor_signature_data    TEXT,
  contractor_signer_name       TEXT,
  contractor_signer_email      TEXT,
  bu                           TEXT[],
  updated_at                   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001'
              REFERENCES organizations(id),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_ids UUID[],
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT,
  category    TEXT,
  content     TEXT,
  username    TEXT,
  password    TEXT,
  url         TEXT,
  tags        TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001'
              REFERENCES organizations(id),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_ids UUID[],
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT,
  description TEXT,
  status      TEXT,
  priority    TEXT,
  assignee    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── updated_at trigger function ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_clients') THEN
    CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON clients
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_projects') THEN
    CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tasks') THEN
    CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_contracts') THEN
    CREATE TRIGGER set_updated_at_contracts BEFORE UPDATE ON contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_knowledge_items') THEN
    CREATE TRIGGER set_updated_at_knowledge_items BEFORE UPDATE ON knowledge_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_support_tickets') THEN
    CREATE TRIGGER set_updated_at_support_tickets BEFORE UPDATE ON support_tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- clients
DROP POLICY IF EXISTS "members_select" ON clients;
DROP POLICY IF EXISTS "members_insert" ON clients;
DROP POLICY IF EXISTS "members_update" ON clients;
DROP POLICY IF EXISTS "members_delete" ON clients;
CREATE POLICY "members_select" ON clients FOR SELECT USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_insert" ON clients FOR INSERT WITH CHECK (public.user_belongs_to_org(org_id));
CREATE POLICY "members_update" ON clients FOR UPDATE USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_delete" ON clients FOR DELETE USING (public.user_belongs_to_org(org_id));

-- projects
DROP POLICY IF EXISTS "members_select" ON projects;
DROP POLICY IF EXISTS "members_insert" ON projects;
DROP POLICY IF EXISTS "members_update" ON projects;
DROP POLICY IF EXISTS "members_delete" ON projects;
CREATE POLICY "members_select" ON projects FOR SELECT USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_insert" ON projects FOR INSERT WITH CHECK (public.user_belongs_to_org(org_id));
CREATE POLICY "members_update" ON projects FOR UPDATE USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_delete" ON projects FOR DELETE USING (public.user_belongs_to_org(org_id));

-- tasks
DROP POLICY IF EXISTS "members_select" ON tasks;
DROP POLICY IF EXISTS "members_insert" ON tasks;
DROP POLICY IF EXISTS "members_update" ON tasks;
DROP POLICY IF EXISTS "members_delete" ON tasks;
CREATE POLICY "members_select" ON tasks FOR SELECT USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_insert" ON tasks FOR INSERT WITH CHECK (public.user_belongs_to_org(org_id));
CREATE POLICY "members_update" ON tasks FOR UPDATE USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_delete" ON tasks FOR DELETE USING (public.user_belongs_to_org(org_id));

-- contracts (authenticated users)
DROP POLICY IF EXISTS "members_select" ON contracts;
DROP POLICY IF EXISTS "members_insert" ON contracts;
DROP POLICY IF EXISTS "members_update" ON contracts;
DROP POLICY IF EXISTS "members_delete" ON contracts;
DROP POLICY IF EXISTS "anon_read_by_signature_token" ON contracts;
CREATE POLICY "members_select" ON contracts FOR SELECT USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_insert" ON contracts FOR INSERT WITH CHECK (public.user_belongs_to_org(org_id));
CREATE POLICY "members_update" ON contracts FOR UPDATE USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_delete" ON contracts FOR DELETE USING (public.user_belongs_to_org(org_id));
-- anon: allows the sign-contract edge function (service role) to bypass RLS; this policy
-- allows direct anon access for extra safety if ever needed via the public link
CREATE POLICY "anon_read_by_signature_token" ON contracts FOR SELECT TO anon
  USING (signature_link_token IS NOT NULL);

-- knowledge_items
DROP POLICY IF EXISTS "members_select" ON knowledge_items;
DROP POLICY IF EXISTS "members_insert" ON knowledge_items;
DROP POLICY IF EXISTS "members_update" ON knowledge_items;
DROP POLICY IF EXISTS "members_delete" ON knowledge_items;
CREATE POLICY "members_select" ON knowledge_items FOR SELECT USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_insert" ON knowledge_items FOR INSERT WITH CHECK (public.user_belongs_to_org(org_id));
CREATE POLICY "members_update" ON knowledge_items FOR UPDATE USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_delete" ON knowledge_items FOR DELETE USING (public.user_belongs_to_org(org_id));

-- support_tickets
DROP POLICY IF EXISTS "members_select" ON support_tickets;
DROP POLICY IF EXISTS "members_insert" ON support_tickets;
DROP POLICY IF EXISTS "members_update" ON support_tickets;
DROP POLICY IF EXISTS "members_delete" ON support_tickets;
CREATE POLICY "members_select" ON support_tickets FOR SELECT USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_insert" ON support_tickets FOR INSERT WITH CHECK (public.user_belongs_to_org(org_id));
CREATE POLICY "members_update" ON support_tickets FOR UPDATE USING (public.user_belongs_to_org(org_id));
CREATE POLICY "members_delete" ON support_tickets FOR DELETE USING (public.user_belongs_to_org(org_id));
