-- Add time tracking to tasks

-- Horas estimadas ficam na tarefa (preenchidas no cadastro)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;

-- Log de horas reais: cada entrada tem descrição + horas gastas
CREATE TABLE IF NOT EXISTS task_time_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  hours       NUMERIC     NOT NULL CHECK (hours > 0),
  author      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_time_entries' AND policyname = 'authenticated_select'
  ) THEN
    CREATE POLICY "authenticated_select" ON task_time_entries FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_time_entries' AND policyname = 'authenticated_insert'
  ) THEN
    CREATE POLICY "authenticated_insert" ON task_time_entries FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_time_entries' AND policyname = 'authenticated_delete'
  ) THEN
    CREATE POLICY "authenticated_delete" ON task_time_entries FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Suporte a menções em comentários
ALTER TABLE task_comments
  ADD COLUMN IF NOT EXISTS mentioned_users TEXT[] NOT NULL DEFAULT '{}';
