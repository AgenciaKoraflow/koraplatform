-- Allow time entries, attachments and comments to be linked to a subtask.
-- The task_id (parent task) is always populated so that summing hours at the
-- task level remains a single query (.eq('task_id', id) without any joins).

ALTER TABLE task_time_entries
  ADD COLUMN IF NOT EXISTS subtask_id UUID REFERENCES task_subtasks(id) ON DELETE CASCADE;

ALTER TABLE task_attachments
  ADD COLUMN IF NOT EXISTS subtask_id UUID REFERENCES task_subtasks(id) ON DELETE CASCADE;

ALTER TABLE task_comments
  ADD COLUMN IF NOT EXISTS subtask_id UUID REFERENCES task_subtasks(id) ON DELETE CASCADE;

-- Indexes for fast lookup by subtask
CREATE INDEX IF NOT EXISTS idx_task_time_entries_subtask_id ON task_time_entries(subtask_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_subtask_id  ON task_attachments(subtask_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_subtask_id     ON task_comments(subtask_id);
