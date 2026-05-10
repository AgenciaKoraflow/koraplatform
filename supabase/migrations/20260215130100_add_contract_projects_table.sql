-- Create contract_projects junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.contract_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  project_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, project_id)
);

-- Enable Row Level Security
ALTER TABLE public.contract_projects ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on contract_projects" 
ON public.contract_projects 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_contract_projects_contract ON public.contract_projects(contract_id);
CREATE INDEX idx_contract_projects_project ON public.contract_projects(project_id);
