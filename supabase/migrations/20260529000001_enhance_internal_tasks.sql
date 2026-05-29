-- Novos campos em internal_tasks
ALTER TABLE internal_tasks
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS blocked_reason  TEXT;

-- ─── internal_task_subtasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_task_subtasks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID        NOT NULL REFERENCES internal_tasks(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT FALSE,
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── internal_task_time_entries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_task_time_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID        NOT NULL REFERENCES internal_tasks(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  hours       NUMERIC     NOT NULL CHECK (hours > 0),
  author      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_internal_task_subtasks_task_id      ON internal_task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_internal_task_time_entries_task_id  ON internal_task_time_entries(task_id);

-- ─── Triggers updated_at ────────────────────────────────────────────────────
-- (internal_task_subtasks e internal_task_time_entries não têm updated_at, não precisam de trigger)

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Padrão das tabelas internas: SELECT para admin+operador; escrita para admin.

ALTER TABLE internal_task_subtasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_task_time_entries ENABLE ROW LEVEL SECURITY;

-- internal_task_subtasks
DROP POLICY IF EXISTS "its_select" ON internal_task_subtasks;
DROP POLICY IF EXISTS "its_insert" ON internal_task_subtasks;
DROP POLICY IF EXISTS "its_update" ON internal_task_subtasks;
DROP POLICY IF EXISTS "its_delete" ON internal_task_subtasks;
CREATE POLICY "its_select" ON internal_task_subtasks
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "its_insert" ON internal_task_subtasks
  FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "its_update" ON internal_task_subtasks
  FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "its_delete" ON internal_task_subtasks
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- internal_task_time_entries
DROP POLICY IF EXISTS "itte_select" ON internal_task_time_entries;
DROP POLICY IF EXISTS "itte_insert" ON internal_task_time_entries;
DROP POLICY IF EXISTS "itte_delete" ON internal_task_time_entries;
CREATE POLICY "itte_select" ON internal_task_time_entries
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "itte_insert" ON internal_task_time_entries
  FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "itte_delete" ON internal_task_time_entries
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');
