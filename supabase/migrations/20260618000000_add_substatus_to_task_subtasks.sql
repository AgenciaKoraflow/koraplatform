-- Add substatus column to task_subtasks for client tasks
ALTER TABLE task_subtasks
  ADD COLUMN IF NOT EXISTS substatus TEXT NOT NULL DEFAULT 'todo'
    CHECK (substatus IN ('todo', 'in_progress', 'review', 'done', 'blocked'));

-- Sync existing done=true rows to substatus='done'
UPDATE task_subtasks SET substatus = 'done' WHERE done = TRUE;
