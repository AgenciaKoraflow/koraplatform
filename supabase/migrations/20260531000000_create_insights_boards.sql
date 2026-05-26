-- Create insights_boards table (without org_id)
CREATE TABLE IF NOT EXISTS insights_boards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('canvas', 'document')),
  description  TEXT,
  thumbnail_url TEXT,
  elements     JSONB DEFAULT '[]'::jsonb,
  content      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Drop org_id and any dependent policies with CASCADE
ALTER TABLE insights_boards DROP COLUMN IF EXISTS org_id CASCADE;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_insights_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS insights_boards_updated_at ON insights_boards;
CREATE TRIGGER insights_boards_updated_at
  BEFORE UPDATE ON insights_boards
  FOR EACH ROW EXECUTE FUNCTION update_insights_boards_updated_at();

-- Enable RLS
ALTER TABLE insights_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select" ON insights_boards;
DROP POLICY IF EXISTS "authenticated_insert" ON insights_boards;
DROP POLICY IF EXISTS "authenticated_update" ON insights_boards;
DROP POLICY IF EXISTS "authenticated_delete" ON insights_boards;

CREATE POLICY "authenticated_select" ON insights_boards FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON insights_boards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON insights_boards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete" ON insights_boards FOR DELETE TO authenticated USING (true);
