-- ─── internal_task_comments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_task_comments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID        NOT NULL REFERENCES internal_tasks(id) ON DELETE CASCADE,
  author           TEXT        NOT NULL DEFAULT '',
  content          TEXT        NOT NULL,
  mentioned_users  TEXT[]      NOT NULL DEFAULT '{}',
  is_private       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_task_comments_task_id ON internal_task_comments(task_id);

ALTER TABLE internal_task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itc_select" ON internal_task_comments;
DROP POLICY IF EXISTS "itc_insert" ON internal_task_comments;
DROP POLICY IF EXISTS "itc_delete" ON internal_task_comments;

CREATE POLICY "itc_select" ON internal_task_comments
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "itc_insert" ON internal_task_comments
  FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "itc_delete" ON internal_task_comments
  FOR DELETE TO authenticated USING (get_my_role() IN ('admin', 'operador'));
