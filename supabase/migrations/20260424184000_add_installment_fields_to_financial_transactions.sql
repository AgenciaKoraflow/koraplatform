-- Add installment tracking fields to financial_transactions table
-- This allows tracking fixed/recurring costs with specific installment counts and first payment dates

-- Add due_day column (day of month for recurring transactions)
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS due_day INTEGER;

-- Add installment_count column (null = unlimited/indefinite)
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS installment_count INTEGER;

-- Add first_payment_date column
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS first_payment_date DATE;

-- Add is_indefinite column (for clarity when installment_count is null)
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS is_indefinite BOOLEAN DEFAULT false;

-- Add other_category_note column for "Outro" category descriptions
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS other_category_note TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.financial_transactions.due_day IS 'Dia do mês de vencimento para transações recorrentes (1-31)';
COMMENT ON COLUMN public.financial_transactions.installment_count IS 'Número total de parcelas (null = ilimitado/indefinido)';
COMMENT ON COLUMN public.financial_transactions.first_payment_date IS 'Data do primeiro pagamento (usada para calcular vencimentos futuros)';
COMMENT ON COLUMN public.financial_transactions.is_indefinite IS 'Indica se a recorrência é indefinida (sem prazo final)';
COMMENT ON COLUMN public.financial_transactions.other_category_note IS 'Nota descritiva quando a categoria for "Outro"';

-- Create index for better query performance on installment fields
CREATE INDEX IF NOT EXISTS idx_financial_transactions_due_day ON public.financial_transactions(due_day);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_installment_count ON public.financial_transactions(installment_count);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_first_payment_date ON public.financial_transactions(first_payment_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_is_indefinite ON public.financial_transactions(is_indefinite);
