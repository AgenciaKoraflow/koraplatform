-- Add 'bu' column to all tables that need it
-- This fixes the schema cache error when saving entities with 'bu' field

-- Add BU to clients table (if not exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to projects table (if not exists)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to tasks table (if not exists)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to contracts table (if not exists)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to processes table (if not exists)
ALTER TABLE processes ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Create indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_clients_bu ON clients(bu);
CREATE INDEX IF NOT EXISTS idx_projects_bu ON projects(bu);
CREATE INDEX IF NOT EXISTS idx_tasks_bu ON tasks(bu);
CREATE INDEX IF NOT EXISTS idx_contracts_bu ON contracts(bu);
CREATE INDEX IF NOT EXISTS idx_processes_bu ON processes(bu);