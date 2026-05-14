-- Add optional logo column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logo TEXT;
