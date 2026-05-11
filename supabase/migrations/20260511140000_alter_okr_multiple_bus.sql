-- Migration: Alterar campo BU para suportar múltiplas BUs em OKR
-- Data: 2026-05-11

-- Adicionar coluna temporária com o novo tipo (jsonb array)
alter table okr_objectives add column bu_array jsonb default '[]'::jsonb;

-- Migrar dados do campo antigo para o novo
update okr_objectives set bu_array = to_jsonb(array[bu]::text[]) where bu is not null;

-- Remover a coluna antiga
alter table okr_objectives drop column bu;

-- Renomear a coluna nova para o nome original
alter table okr_objectives rename column bu_array to bu;

-- Adicionar constraint para garantir que seja um array
alter table okr_objectives add constraint check_bu_is_array check (jsonb_typeof(bu) = 'array');

-- Recriar índices
drop index if exists idx_okr_objectives_bu;
create index if not exists idx_okr_objectives_bu on okr_objectives using gin (bu);
