-- Add proposal_sent_date column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS proposal_sent_date DATE;
