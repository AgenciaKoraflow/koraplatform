-- Add head and team columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS head TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team TEXT[];
