-- =====================================================
-- COMPLETE DATABASE SETUP FOR KORAPLATFORM
-- Execute this in Supabase SQL Editor
-- =====================================================

-- -----------------------------------------------------
-- 1. ADD BU COLUMN TO EXISTING TABLES
-- -----------------------------------------------------

-- Add BU to clients table (if not exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to projects table (if not exists)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to tasks table (if not exists)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- Add BU to contracts table (if not exists)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS bu TEXT CHECK (bu IN ('intelligence', 'development', 'creative', 'corporate'));

-- -----------------------------------------------------
-- 2. CREATE PROCESSES TABLE (if not exists)
-- -----------------------------------------------------

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Allow all operations on processes" ON processes;
CREATE POLICY "Allow all operations on processes" ON processes FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_processes_category ON processes(category);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_subcategory ON processes(subcategory);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_processes_updated_at ON processes;
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 3. SETUP STORAGE BUCKET (if not exists)
-- -----------------------------------------------------

-- Create bucket for process documents (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('process-documents', 'process-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'process-documents');

CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT USING (bucket_id = 'process-documents');

-- -----------------------------------------------------
-- 4. ENABLE RLS ON OTHER TABLES (if not enabled)
-- -----------------------------------------------------

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 5. SAMPLE DATA (optional)
-- -----------------------------------------------------

-- Insert sample processes if table is empty
INSERT INTO processes (name, description, category, subcategory, status, assigned_to, due_date)
SELECT 
    'Qualificação de Lead (BANT)', 
    'Descoberta de dor, timing, autoridade e orçamento antes de propor.', 
    'intelligence', 
    'Qualificação', 
    'concluido', 
    'James', 
    '2024-01-15'
WHERE NOT EXISTS (SELECT 1 FROM processes LIMIT 1);

-- Done!
SELECT 'Database setup complete!' as result;