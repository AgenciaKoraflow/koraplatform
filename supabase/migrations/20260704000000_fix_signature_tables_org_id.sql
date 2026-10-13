-- Corrige: null value in column "org_id" of relation "signature_audit_log"
-- violates not-null constraint.
--
-- O sistema é single-tenant e contracts não tem mais org_id, mas as tabelas de
-- assinatura ainda exigem a coluna. O trigger de auditoria disparado no UPDATE
-- de contracts grava sem org_id e derruba a assinatura (Koraflow e cliente).
-- Tornar a coluna opcional é seguro mesmo que o trigger ainda a referencie.

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'signature_audit_log','signature_email_logs','signature_attempts',
    'signature_settings','contract_signatures'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t
        AND column_name = 'org_id' AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN org_id DROP NOT NULL', t);
    END IF;
  END LOOP;
END $$;
