ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS project_expense_type text;
