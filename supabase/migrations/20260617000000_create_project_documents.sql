-- Storage bucket for project planning and technical document PDFs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  52428800, -- 50 MB
  NULL      -- allow all mime types
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "project-documents: authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "project-documents: authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "project-documents: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "project-documents: authenticated delete" ON storage.objects;

CREATE POLICY "project-documents: authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "project-documents: authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-documents');

CREATE POLICY "project-documents: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-documents');

CREATE POLICY "project-documents: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-documents');

-- Table for project document metadata (one planejamento + one optional tecnico per project).

CREATE TABLE IF NOT EXISTS project_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('planejamento', 'tecnico')),
  file_name    TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  mime_type    TEXT,
  file_size    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_documents_project_type_unique UNIQUE (project_id, type)
);

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pd_select" ON project_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pd_insert" ON project_documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pd_update" ON project_documents
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "pd_delete" ON project_documents
  FOR DELETE TO authenticated USING (true);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_project_documents') THEN
    CREATE TRIGGER set_updated_at_project_documents BEFORE UPDATE ON project_documents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
