ALTER TABLE internal_documents ADD COLUMN IF NOT EXISTS doc_type     TEXT;
ALTER TABLE internal_documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE internal_documents ADD COLUMN IF NOT EXISTS file_name    TEXT;
ALTER TABLE internal_documents ADD COLUMN IF NOT EXISTS mime_type    TEXT;
ALTER TABLE internal_documents ADD COLUMN IF NOT EXISTS file_size    INTEGER;
