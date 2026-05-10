-- Migration to create processes table with BU-based categories
-- Categories use BU values: intelligence, development, creative, corporate
-- with optional subcategory for custom sub-grouping
-- This replaces old category system (sops, reunioes, comercial, financeiro, kpis)

-- First check if table exists and has old structure
SELECT 1;

-- If table doesn't exist, create it with new structure
CREATE TABLE IF NOT EXISTS processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('intelligence', 'development', 'creative', 'corporate')),
    subcategory TEXT,
    documents TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
    assigned_to TEXT,
    due_date DATE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Create policies for processes
DROP POLICY IF EXISTS "Allow all operations on processes" ON processes;
CREATE POLICY "Allow all operations on processes" ON processes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_processes_category ON processes(category);
CREATE INDEX IF NOT EXISTS idx_processes_subcategory ON processes(subcategory);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_client_id ON processes(client_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_processes_updated_at ON processes;
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample processes with new BU categories
INSERT INTO processes (name, description, category, subcategory, status, assigned_to, due_date) VALUES
    ('Qualificação de Lead (BANT)', 'Descoberta de dor, timing, autoridade e orçamento antes de propor.', 'intelligence', 'Qualificação', 'concluido', 'James', '2024-01-15'),
    ('Envio de Proposta', 'Gerada a partir do funil em Negociação; expira em 30 dias.', 'intelligence', 'Propostas', 'em_andamento', 'James', '2024-02-01'),
    ('Fechamento & Assinatura', 'Contrato assinado pela Koraflow e liberado ao cliente via link.', 'intelligence', 'Fechamento', 'pendente', 'James', '2024-02-15'),
    ('Handoff para Operação', 'Passagem de bastão para Projetos com briefing + contexto do funil.', 'intelligence', 'Handoff', 'pendente', 'João', '2024-02-20'),
    ('Daily Operacional', '15 min, seg a sex, alinhamento de bloqueios e prioridades.', 'development', 'Daily', 'em_andamento', 'João', NULL),
    ('Pipeline Comercial', 'Semanal, revisão de leads em cada estágio do funil.', 'intelligence', 'Revisão', 'pendente', 'James', NULL),
    ('Revisão Criativa', 'Semanal, aprovação de pautas e campanhas em andamento.', 'creative', 'Revisão', 'pendente', 'Ryan', NULL),
    ('Comitê de Gestão', 'Mensal, revisão financeira e KPIs consolidados por BU.', 'corporate', 'Comitê', 'concluido', 'Edson', NULL),
    ('Leads qualificados / mês', 'KPI de Comercial', 'intelligence', 'Leads', 'em_andamento', 'James', NULL),
    ('Taxa de conversão por estágio', 'KPI de Comercial', 'intelligence', 'Conversão', 'pendente', 'James', NULL),
    ('On-time delivery', 'KPI de Operação', 'development', 'Entrega', 'pendente', 'João', NULL),
    ('Margem líquida', 'KPI Corporativo', 'corporate', 'Margem', 'pendente', 'Edson', NULL)
ON CONFLICT DO NOTHING;
