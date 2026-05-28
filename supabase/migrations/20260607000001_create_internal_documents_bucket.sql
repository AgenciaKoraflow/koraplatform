-- Storage bucket for internal workspace documents (PDFs, Word, Excel, HTML, etc.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'internal-documents',
  'internal-documents',
  false,
  52428800, -- 50 MB
  NULL      -- allow all mime types
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "internal-documents: authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "internal-documents: authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "internal-documents: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "internal-documents: authenticated delete" ON storage.objects;

CREATE POLICY "internal-documents: authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'internal-documents');

CREATE POLICY "internal-documents: authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'internal-documents');

CREATE POLICY "internal-documents: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'internal-documents');

CREATE POLICY "internal-documents: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'internal-documents');
