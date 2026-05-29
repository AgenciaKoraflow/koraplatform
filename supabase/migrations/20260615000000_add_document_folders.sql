CREATE TABLE IF NOT EXISTS internal_document_folders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES internal_workspace(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE internal_document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idf_select" ON internal_document_folders
  FOR SELECT TO authenticated USING (get_my_role() IN ('admin', 'operador'));
CREATE POLICY "idf_insert" ON internal_document_folders
  FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "idf_update" ON internal_document_folders
  FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "idf_delete" ON internal_document_folders
  FOR DELETE TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE internal_documents
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES internal_document_folders(id) ON DELETE SET NULL;
