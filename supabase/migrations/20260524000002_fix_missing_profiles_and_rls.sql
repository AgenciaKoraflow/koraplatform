-- Remove toda a infraestrutura multi-tenancy (organizations + org_id) e corrige
-- os problemas imediatos: backfill de profiles e RLS recursiva.
-- Sistema é single-tenant: a coluna org_id e a tabela organizations não têm uso.
--
-- ATENÇÃO: esta migration foi reescrita para cobrir tabelas adicionais descobertas
-- no banco (contract_projects, processes, financial_transactions, etc.) que não
-- constavam nas migrations locais mas também usam user_belongs_to_org.

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 1: Remover policies por nome nas tabelas conhecidas pelas migrations
-- locais. Feito antes do DROP COLUMN para evitar erros de dependência.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "members_select" ON clients;
DROP POLICY IF EXISTS "members_insert" ON clients;
DROP POLICY IF EXISTS "members_update" ON clients;
DROP POLICY IF EXISTS "members_delete" ON clients;

DROP POLICY IF EXISTS "members_select" ON projects;
DROP POLICY IF EXISTS "members_insert" ON projects;
DROP POLICY IF EXISTS "members_update" ON projects;
DROP POLICY IF EXISTS "members_delete" ON projects;

DROP POLICY IF EXISTS "members_select" ON tasks;
DROP POLICY IF EXISTS "members_insert" ON tasks;
DROP POLICY IF EXISTS "members_update" ON tasks;
DROP POLICY IF EXISTS "members_delete" ON tasks;

DROP POLICY IF EXISTS "members_select" ON contracts;
DROP POLICY IF EXISTS "members_insert" ON contracts;
DROP POLICY IF EXISTS "members_update" ON contracts;
DROP POLICY IF EXISTS "members_delete" ON contracts;

DROP POLICY IF EXISTS "members_select" ON knowledge_items;
DROP POLICY IF EXISTS "members_insert" ON knowledge_items;
DROP POLICY IF EXISTS "members_update" ON knowledge_items;
DROP POLICY IF EXISTS "members_delete" ON knowledge_items;

DROP POLICY IF EXISTS "members_select" ON support_tickets;
DROP POLICY IF EXISTS "members_insert" ON support_tickets;
DROP POLICY IF EXISTS "members_update" ON support_tickets;
DROP POLICY IF EXISTS "members_delete" ON support_tickets;

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 2: Remover FK constraints para organizations
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE clients         DROP CONSTRAINT IF EXISTS clients_org_id_fkey;
ALTER TABLE projects        DROP CONSTRAINT IF EXISTS projects_org_id_fkey;
ALTER TABLE tasks           DROP CONSTRAINT IF EXISTS tasks_org_id_fkey;
ALTER TABLE contracts       DROP CONSTRAINT IF EXISTS contracts_org_id_fkey;
ALTER TABLE knowledge_items DROP CONSTRAINT IF EXISTS knowledge_items_org_id_fkey;
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_org_id_fkey;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 3: Remover colunas org_id
-- CASCADE elimina qualquer policy remanescente que referencie a coluna,
-- inclusive policies com nomes diferentes dos criados pelas migrations locais.
-- IF NOT EXISTS nas tabelas extras é seguro caso não tenham a coluna.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE clients             DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE projects            DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE tasks               DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE contracts           DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE knowledge_items     DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE support_tickets     DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE profiles            DROP COLUMN IF EXISTS org_id CASCADE;

-- Tabelas descobertas no banco mas ausentes nas migrations locais:
ALTER TABLE IF EXISTS contract_projects     DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS processes             DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS contract_signatures   DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS signature_settings    DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS signature_audit_log   DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS signature_email_logs  DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS signature_attempts    DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS financial_transactions DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS okr_objectives        DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS okr_updates           DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS client_integrations   DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS integration_metrics   DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS integration_logs      DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS integration_health    DROP COLUMN IF EXISTS org_id CASCADE;
ALTER TABLE IF EXISTS insights_boards       DROP COLUMN IF EXISTS org_id CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 4: Remover funções multi-tenancy com CASCADE
-- CASCADE garante que qualquer policy ainda dependente da função é derrubada,
-- mesmo em tabelas não cobertas pelos blocos anteriores (ex: storage.objects).
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.user_belongs_to_org(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_org_id() CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 5: Dropar tabela organizations (sem dependentes restantes)
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS organizations CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 6: Atualizar trigger de criação de perfil (sem org_id)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, first_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      CASE WHEN NEW.raw_user_meta_data->>'role' IN ('admin','operador','observador')
           THEN (NEW.raw_user_meta_data->>'role')::user_role END,
      'observador'
    ),
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 7: Backfill profiles para auth.users pré-existentes
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO profiles (id, full_name, role, first_login, password_changed_at)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  CASE
    WHEN u.raw_user_meta_data->>'role' IN ('admin', 'operador', 'observador')
    THEN (u.raw_user_meta_data->>'role')::user_role
    ELSE 'observador'::user_role
  END,
  TRUE,
  COALESCE(u.created_at, NOW())
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 8: Recriar RLS policies — regra única: autenticado = acesso total
-- Cobre todas as tabelas que perderam policies nos blocos anteriores.
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabelas locais + descobertas: drop-before-create garante idempotência
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['clients','projects','tasks','contracts','knowledge_items','support_tickets'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_select" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_insert" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_update" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_delete" ON %I', t);
    EXECUTE format('CREATE POLICY "authenticated_select" ON %I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_insert" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_update" ON %I FOR UPDATE TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_delete" ON %I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contract_projects','processes','financial_transactions',
    'contract_signatures','signature_audit_log','signature_email_logs',
    'signature_attempts','okr_objectives','okr_updates',
    'client_integrations','integration_metrics','integration_logs',
    'integration_health','insights_boards'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = t AND relnamespace = 'public'::regnamespace) THEN
      EXECUTE format('DROP POLICY IF EXISTS "authenticated_select" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "authenticated_insert" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "authenticated_update" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "authenticated_delete" ON %I', t);
      EXECUTE format('CREATE POLICY "authenticated_select" ON %I FOR SELECT TO authenticated USING (true)', t);
      EXECUTE format('CREATE POLICY "authenticated_insert" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t);
      EXECUTE format('CREATE POLICY "authenticated_update" ON %I FOR UPDATE TO authenticated USING (true)', t);
      EXECUTE format('CREATE POLICY "authenticated_delete" ON %I FOR DELETE TO authenticated USING (true)', t);
    END IF;
  END LOOP;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'signature_settings' AND relnamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_all" ON signature_settings';
    EXECUTE 'CREATE POLICY "authenticated_all" ON signature_settings FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Storage: as policies storage_read_org e storage_upload_org foram derrubadas
-- pelo CASCADE acima. As policies por bucket (avatars, contracts-documents,
-- process-documents) criadas nas suas migrations continuam intactas pois não
-- referenciam user_belongs_to_org. Nenhuma ação necessária aqui.

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 9: Recriar policies de admin em profiles (sem checagem de org)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (public.get_my_role() = 'admin');

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');
