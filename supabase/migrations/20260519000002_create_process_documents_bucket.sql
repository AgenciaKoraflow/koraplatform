-- Public bucket for process/ticket attachments.
-- Referenced in Processos.tsx but was missing a migration.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'process-documents',
  'process-documents',
  true,
  20971520, -- 20 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "process-documents: authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'process-documents');

CREATE POLICY "process-documents: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'process-documents');

CREATE POLICY "process-documents: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'process-documents');
