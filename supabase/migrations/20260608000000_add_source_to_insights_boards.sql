ALTER TABLE insights_boards
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'conhecimento';
