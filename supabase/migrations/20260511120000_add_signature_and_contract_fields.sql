-- Migration: Adicionar campos de signature link e novos campos de contrato
-- Data: 2026-05-11
-- Descrição: Adiciona suporte para links de assinatura, implementação, recorrência e pagamento

-- Verificar se tabela contracts existe e adicionar colunas de signature link
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS signature_link_token UUID UNIQUE DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS signature_link_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fully_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS implementation_value NUMERIC,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
ADD COLUMN IF NOT EXISTS recurrence_start_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Criar índice para faster lookups por signature token
CREATE INDEX IF NOT EXISTS idx_contracts_signature_link_token
ON contracts(signature_link_token);

-- Índice para expiração de links
CREATE INDEX IF NOT EXISTS idx_contracts_signature_expires
ON contracts(signature_link_expires_at);

-- Verificar se tabela financial_transactions existe e adicionar campos de pagamento
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('dinheiro', 'cartao', 'transferencia', 'cheque'));

-- Índices para status de pagamento
CREATE INDEX IF NOT EXISTS idx_financial_transactions_paid
ON financial_transactions(paid);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_paid_at
ON financial_transactions(paid_at);

-- Comentários para documentação
COMMENT ON COLUMN contracts.signature_link_token IS 'Token único para compartilhar link de assinatura com cliente';
COMMENT ON COLUMN contracts.signature_link_expires_at IS 'Data/hora de expiração do link de assinatura';
COMMENT ON COLUMN contracts.client_signed_at IS 'Data/hora quando cliente assinou o contrato';
COMMENT ON COLUMN contracts.fully_signed_at IS 'Data/hora quando contrato foi completamente assinado';
COMMENT ON COLUMN contracts.implementation_value IS 'Valor da implementação (obrigatório para certos tipos de contrato)';
COMMENT ON COLUMN contracts.recurrence_type IS 'Tipo de recorrência: monthly, quarterly, semi_annual, annual';
COMMENT ON COLUMN financial_transactions.paid IS 'Indica se a transação foi paga';
COMMENT ON COLUMN financial_transactions.paid_at IS 'Data/hora quando a transação foi marcada como paga';
COMMENT ON COLUMN financial_transactions.payment_method IS 'Método de pagamento utilizado';
