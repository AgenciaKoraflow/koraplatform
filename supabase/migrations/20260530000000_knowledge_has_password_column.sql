-- Adds a stored generated column has_password so queries can determine whether
-- a knowledge item has a password without fetching the (encrypted) password column.
ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS has_password BOOLEAN
  GENERATED ALWAYS AS (password IS NOT NULL) STORED;
