-- Fluxo comercial: Prospecção > Qualificação > Proposta > Contrato >
-- Cliente (aceitou) | Cancelado (recusou). Cliente ativo que sai entra no Churn.

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_pipeline_stage_check;

-- ── Novos campos do cliente ────────────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deal_value NUMERIC,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS became_client_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_group_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_reason TEXT,
  ADD COLUMN IF NOT EXISTS churn_stage TEXT,
  ADD COLUMN IF NOT EXISTS churn_mrr NUMERIC;

-- O estágio "Negociação" passa a ser "Contrato".
UPDATE clients SET pipeline_stage = 'contrato' WHERE pipeline_stage = 'negociacao';

-- O valor do negócio ficava como texto na coluna de anotações ("R$ 4.000,00").
UPDATE clients
SET deal_value = replace(replace(regexp_replace(notes, '[^0-9,.]', '', 'g'), '.', ''), ',', '.')::NUMERIC
WHERE deal_value IS NULL
  AND notes IS NOT NULL
  AND replace(replace(regexp_replace(notes, '[^0-9,.]', '', 'g'), '.', ''), ',', '.') ~ '^[0-9]+(\.[0-9]+)?$';

-- ── Interações do cliente (antes ficavam só na memória da tela) ────────────
CREATE TABLE IF NOT EXISTS client_interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'note',
  title       TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_interactions_client_id_idx ON client_interactions (client_id);

ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON client_interactions;
CREATE POLICY "authenticated_all" ON client_interactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'client_interactions'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE client_interactions;
  END IF;
END $$;

-- ── O contrato move o negócio no funil ─────────────────────────────────────
-- Criar/enviar contrato: o negócio vai para "Contrato".
-- Contrato assinado pelas duas partes: o negócio vira "Cliente".
CREATE OR REPLACE FUNCTION public.trg_contract_moves_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_id IS NULL THEN RETURN NULL; END IF;

  IF NEW.status = 'signed' THEN
    UPDATE clients
    SET pipeline_stage = 'cliente',
        became_client_at = coalesce(became_client_at, now())
    WHERE id = NEW.client_id
      AND coalesce(pipeline_stage, 'prospeccao') IN ('prospeccao', 'qualificacao', 'proposta', 'contrato');
  ELSE
    UPDATE clients
    SET pipeline_stage = 'contrato'
    WHERE id = NEW.client_id
      AND coalesce(pipeline_stage, 'prospeccao') IN ('prospeccao', 'qualificacao', 'proposta');
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS contract_moves_deal ON contracts;
CREATE TRIGGER contract_moves_deal
  AFTER INSERT OR UPDATE OF status, client_id ON contracts
  FOR EACH ROW EXECUTE FUNCTION public.trg_contract_moves_deal();

-- Clientes ativos sem data de entrada: usa a última atualização como referência.
UPDATE clients SET became_client_at = updated_at
WHERE pipeline_stage = 'cliente' AND became_client_at IS NULL;
