-- Storage bucket for task and subtask file attachments.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  52428800, -- 50 MB
  NULL      -- allow all mime types
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "task-attachments: authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "task-attachments: authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "task-attachments: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "task-attachments: authenticated delete" ON storage.objects;

CREATE POLICY "task-attachments: authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "task-attachments: authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "task-attachments: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "task-attachments: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments');
