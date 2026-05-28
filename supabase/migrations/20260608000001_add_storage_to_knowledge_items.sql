-- Colunas de arquivo para knowledge_items (documentos de clientes)
ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name    TEXT,
  ADD COLUMN IF NOT EXISTS mime_type    TEXT,
  ADD COLUMN IF NOT EXISTS file_size    INTEGER;

-- Bucket privado para documentos de clientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policies: acesso apenas para admin/operador
CREATE POLICY "client_docs_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-documents' AND get_my_role() IN ('admin', 'operador'));

CREATE POLICY "client_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-documents' AND get_my_role() IN ('admin', 'operador'));

CREATE POLICY "client_docs_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-documents' AND get_my_role() IN ('admin', 'operador'));
