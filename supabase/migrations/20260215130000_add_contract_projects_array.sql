-- Add project_ids array column to contracts table for multiple projects support
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS project_ids UUID[];

-- Create index for the array column
CREATE INDEX IF NOT EXISTS idx_contracts_project_ids ON contracts USING GIN (project_ids);
