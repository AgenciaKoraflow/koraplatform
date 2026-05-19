-- Private bucket for contract PDFs and signed documents.
-- Access requires a signed URL generated server-side; unauthenticated clients
-- use the get_document_url edge function action to obtain one via signature token.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts-documents',
  'contracts-documents',
  false,
  20971520, -- 20 MB
  ARRAY[
    'application/pdf',
    'application/octet-stream',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "contracts-documents: authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts-documents');

CREATE POLICY "contracts-documents: authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts-documents');

CREATE POLICY "contracts-documents: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts-documents');

CREATE POLICY "contracts-documents: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts-documents');
