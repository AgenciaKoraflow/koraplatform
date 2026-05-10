-- Migration to update processes table with BU-based categories
-- Categories now use BU values: intelligence, development, creative, corporate
-- with optional subcategory for custom sub-grouping

ALTER TABLE processes DROP CONSTRAINT IF EXISTS processes_category_check;

ALTER TABLE processes 
ALTER COLUMN category TYPE TEXT,
ADD CONSTRAINT processes_category_check CHECK (
  category IN ('intelligence', 'development', 'creative', 'corporate')
);

-- Add subcategory column for custom sub-grouping within each BU
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Create index for faster subcategory queries
CREATE INDEX IF NOT EXISTS idx_processes_subcategory ON processes(subcategory);

-- Map existing categories to new BU categories
UPDATE processes SET 
  category = CASE
    WHEN category = 'sops' THEN 'intelligence'
    WHEN category = 'comercial' THEN 'intelligence'
    WHEN category = 'financeiro' THEN 'corporate'
    WHEN category = 'kpis' THEN 'corporate'
    WHEN category = 'reunioes' THEN 'development'
    ELSE category
  END;

-- Update sample processes with new BU categories
UPDATE processes SET
  subcategory = CASE name
    WHEN 'Qualificação de Lead (BANT)' THEN 'Qualificação'
    WHEN 'Envio de Proposta' THEN 'Propostas'
    WHEN 'Fechamento & Assinatura' THEN 'Fechamento'
    WHEN 'Handoff para Operação' THEN 'Handoff'
    WHEN 'Pipeline Comercial' THEN 'Revisão'
    WHEN 'Revisão Criativa' THEN 'Revisão'
    WHEN 'Comitê de Gestão' THEN 'Comitê'
    WHEN 'Daily Operacional' THEN 'Daily'
    WHEN 'Leads qualificados / mês' THEN 'Leads'
    WHEN 'Taxa de conversão por estágio' THEN 'Conversão'
    WHEN 'On-time delivery' THEN 'Entrega'
    WHEN 'Margem líquida' THEN 'Margem'
    ELSE subcategory
  END
WHERE subcategory IS NULL;