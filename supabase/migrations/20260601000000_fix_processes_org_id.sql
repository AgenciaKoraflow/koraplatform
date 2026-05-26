-- Remove coluna org_id da tabela processes.
-- A migration 20260524000002 já tentou remover, mas a tabela pode ter sido criada depois.
-- O sistema é single-tenant; org_id não tem uso.

ALTER TABLE IF EXISTS processes DROP COLUMN IF EXISTS org_id CASCADE;
