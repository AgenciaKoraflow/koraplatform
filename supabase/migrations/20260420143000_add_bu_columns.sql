-- Migration to add BU (Business Unit) column to all necessary tables
-- Values allowed: 'intelligence', 'development', 'creative', 'corporate'
-- Initially nullable to avoid breaking existing data

-- Add BU column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS bu TEXT 
CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS bu TEXT 
CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS bu TEXT 
CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS bu TEXT 
CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU column to processes table
ALTER TABLE public.processes 
ADD COLUMN IF NOT EXISTS bu TEXT 
CHECK (bu IS NULL OR bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add indexes for better query performance on BU field
CREATE INDEX IF NOT EXISTS idx_clients_bu ON public.clients(bu);
CREATE INDEX IF NOT EXISTS idx_projects_bu ON public.projects(bu);
CREATE INDEX IF NOT EXISTS idx_tasks_bu ON public.tasks(bu);
CREATE INDEX IF NOT EXISTS idx_contracts_bu ON public.contracts(bu);
CREATE INDEX IF NOT EXISTS idx_processes_bu ON public.processes(bu);