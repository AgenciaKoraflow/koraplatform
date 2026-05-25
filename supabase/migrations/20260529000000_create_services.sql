-- ─── Tabela de catálogo de serviços e preços ─────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   UUID        NOT NULL DEFAULT '10000000-0000-0000-0000-000000000001',
  name                     TEXT        NOT NULL,
  description              TEXT,
  category                 TEXT,
  bu                       TEXT        NOT NULL DEFAULT 'kora-corp',
  billing_type             TEXT        NOT NULL DEFAULT 'projeto_unico',
  price_initial            NUMERIC,
  price_bargain            NUMERIC,
  recurrence_price_initial NUMERIC,
  recurrence_price_bargain NUMERIC,
  installments_max         INTEGER,
  status                   TEXT        NOT NULL DEFAULT 'ativo',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_services') THEN
    CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select" ON services;
DROP POLICY IF EXISTS "authenticated_insert" ON services;
DROP POLICY IF EXISTS "authenticated_update" ON services;
DROP POLICY IF EXISTS "authenticated_delete" ON services;

CREATE POLICY "authenticated_select" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON services FOR DELETE TO authenticated USING (true);
