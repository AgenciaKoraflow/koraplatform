-- Add 'bu' column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_bu ON tasks(bu);
