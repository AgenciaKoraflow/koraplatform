-- Adds project_ids UUID[] to knowledge_items.
-- The original CREATE TABLE IF NOT EXISTS migration was a no-op because the
-- table already existed, so this ALTER TABLE backfills the missing column.
ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS project_ids UUID[];
