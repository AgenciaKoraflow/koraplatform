-- Migration: enhance tasks with blocking, client approval, subtasks, comments, attachments

-- ─── Alter tasks table ────────────────────────────────────────────────────────

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS blocked_reason   TEXT,
  ADD COLUMN IF NOT EXISTS client_approved  BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── task_subtasks ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_subtasks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT FALSE,
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── task_comments ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author     TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── task_attachments ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_attachments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name    TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  mime_type    TEXT,
  file_size    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE task_subtasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['task_subtasks','task_comments','task_attachments'] LOOP
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
