-- Allow projects.bu to store a JSONB array (e.g. ["kora-dev"]) instead of a single string.
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_bu_check;
