-- Migration to ensure core tables exist (projects, tasks, contracts)
-- These tables may have been created manually or via external systems
-- This migration ensures they have the correct structure with BU field

-- Create projects table if not exists
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold')),
    progress INTEGER DEFAULT 0,
    due_date DATE,
    team TEXT[] DEFAULT '{}',
    head TEXT,
    value TEXT,
    billing_type TEXT CHECK (billing_type IN ('projeto', 'implantacao_recorrencia')),
    type TEXT CHECK (type IN ('projeto', 'sustentacao', 'consultoria')),
    recurrence_value TEXT,
    recurrence_start_date DATE,
    bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table if not exists
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    assigned_to TEXT[] DEFAULT '{}',
    bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contracts table if not exists
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_ids UUID[] DEFAULT '{}',
    title TEXT NOT NULL DEFAULT '',
    value TEXT DEFAULT '',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting_koraflow_signature', 'awaiting_client_signature', 'signed', 'expired')),
    type TEXT DEFAULT 'prestacao_servico' CHECK (type IN ('prestacao_servico', 'projeto_unico')),
    billing_type TEXT DEFAULT 'projeto' CHECK (billing_type IN ('projeto', 'implantacao_recorrencia')),
    recurrence_value TEXT,
    recurrence_start_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    signed_at TIMESTAMPTZ,
    expires_at DATE,
    document_name TEXT,
    document_data TEXT,
    document_type TEXT,
    signature_link_token TEXT,
    signature_link_expires_at TIMESTAMPTZ,
    signature_sent_at TIMESTAMPTZ,
    koraflow_signed_at TIMESTAMPTZ,
    koraflow_signature_data TEXT,
    koraflow_signer_name TEXT,
    koraflow_signer_email TEXT,
    koraflow_signer_user_id TEXT,
    client_signed_at TIMESTAMPTZ,
    client_signature_data TEXT,
    client_signer_name TEXT,
    client_signer_email TEXT,
    client_cpf TEXT,
    signed_document_data TEXT,
    fully_signed_at TIMESTAMPTZ,
    bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Allow all operations on projects') THEN
        CREATE POLICY "Allow all operations on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Allow all operations on tasks') THEN
        CREATE POLICY "Allow all operations on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' AND policyname = 'Allow all operations on contracts') THEN
        CREATE POLICY "Allow all operations on contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_bu ON public.projects(bu);

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_bu ON public.tasks(bu);

CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_bu ON public.contracts(bu);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();