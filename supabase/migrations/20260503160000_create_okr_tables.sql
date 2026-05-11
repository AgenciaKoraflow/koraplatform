-- Migration: Criar tabelas de OKR
-- Data: 2026-05-03

-- Tabela de Objetivos OKR
create table if not exists okr_objectives (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  target numeric not null,
  current numeric default 0,
  unit text default '%',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'on_track', 'at_risk', 'completed', 'failed')),
  start_date date not null,
  end_date date not null,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  category text not null check (category in ('revenue', 'growth', 'efficiency', 'quality', 'satisfaction', 'innovation', 'team', 'other')),
  bu text not null check (bu in ('kora-agents', 'kora-dev', 'kora-studio', 'kora-corp', 'kora-ventures')),
  progress numeric default 0 check (progress >= 0 and progress <= 100),
  last_update timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Tabela de atualizações/histórico de OKR
create table if not exists okr_updates (
  id uuid default uuid_generate_v4() primary key,
  objective_id uuid not null references okr_objectives(id) on delete cascade,
  date date not null default (timezone('utc'::text, now())::date),
  value numeric not null,
  comment text,
  updated_by uuid references auth.users(id),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Índices
create index if not exists idx_okr_objectives_bu on okr_objectives(bu);
create index if not exists idx_okr_objectives_status on okr_objectives(status);
create index if not exists idx_okr_objectives_category on okr_objectives(category);
create index if not exists idx_okr_objectives_priority on okr_objectives(priority);
create index if not exists idx_okr_objectives_dates on okr_objectives(start_date, end_date);
create index if not exists idx_okr_updates_objective on okr_updates(objective_id);
create index if not exists idx_okr_updates_date on okr_updates(date);

-- RLS policies
alter table okr_objectives enable row level security;
alter table okr_updates enable row level security;

-- Policies para okr_objectives
create policy "Permitir leitura para usuários autenticados" on okr_objectives
  for select using (auth.role() = 'authenticated');

create policy "Permitir inserção para usuários autenticados" on okr_objectives
  for insert with check (auth.role() = 'authenticated');

create policy "Permitir atualização para usuários autenticados" on okr_objectives
  for update using (auth.role() = 'authenticated');

create policy "Permitir deleção para usuários autenticados" on okr_objectives
  for delete using (auth.role() = 'authenticated');

-- Policies para okr_updates
create policy "Permitir leitura para usuários autenticados" on okr_updates
  for select using (auth.role() = 'authenticated');

create policy "Permitir inserção para usuários autenticados" on okr_updates
  for insert with check (auth.role() = 'authenticated');

create policy "Permitir atualização para usuários autenticados" on okr_updates
  for update using (auth.role() = 'authenticated');

create policy "Permitir deleção para usuários autenticados" on okr_updates
  for delete using (auth.role() = 'authenticated');