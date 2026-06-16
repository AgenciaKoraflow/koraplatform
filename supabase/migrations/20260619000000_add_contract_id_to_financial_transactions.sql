ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_contract_id
  ON financial_transactions(contract_id);
