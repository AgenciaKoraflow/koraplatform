-- Remove role-based RLS enforcement.
-- All authenticated users now have full access.
-- The profiles.role column is kept but not enforced.

-- ─── profiles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Any authenticated user can update any profile (user management page).
CREATE POLICY "profiles_update_any" ON profiles
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── internal_workspace ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "iw_select" ON internal_workspace;
DROP POLICY IF EXISTS "iw_insert" ON internal_workspace;
DROP POLICY IF EXISTS "iw_update" ON internal_workspace;
DROP POLICY IF EXISTS "iw_delete" ON internal_workspace;

CREATE POLICY "iw_select" ON internal_workspace
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "iw_insert" ON internal_workspace
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "iw_update" ON internal_workspace
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "iw_delete" ON internal_workspace
  FOR DELETE TO authenticated USING (true);

-- ─── internal_credentials ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ic_select" ON internal_credentials;
DROP POLICY IF EXISTS "ic_insert" ON internal_credentials;
DROP POLICY IF EXISTS "ic_update" ON internal_credentials;
DROP POLICY IF EXISTS "ic_delete" ON internal_credentials;

CREATE POLICY "ic_select" ON internal_credentials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ic_insert" ON internal_credentials
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ic_update" ON internal_credentials
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ic_delete" ON internal_credentials
  FOR DELETE TO authenticated USING (true);

-- ─── internal_insights ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ii_select" ON internal_insights;
DROP POLICY IF EXISTS "ii_insert" ON internal_insights;
DROP POLICY IF EXISTS "ii_update" ON internal_insights;
DROP POLICY IF EXISTS "ii_delete" ON internal_insights;

CREATE POLICY "ii_select" ON internal_insights
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ii_insert" ON internal_insights
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ii_update" ON internal_insights
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ii_delete" ON internal_insights
  FOR DELETE TO authenticated USING (true);

-- ─── internal_tasks ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "it_select" ON internal_tasks;
DROP POLICY IF EXISTS "it_insert" ON internal_tasks;
DROP POLICY IF EXISTS "it_update" ON internal_tasks;
DROP POLICY IF EXISTS "it_delete" ON internal_tasks;

CREATE POLICY "it_select" ON internal_tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "it_insert" ON internal_tasks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "it_update" ON internal_tasks
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "it_delete" ON internal_tasks
  FOR DELETE TO authenticated USING (true);

-- ─── internal_documents ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "id_select" ON internal_documents;
DROP POLICY IF EXISTS "id_insert" ON internal_documents;
DROP POLICY IF EXISTS "id_update" ON internal_documents;
DROP POLICY IF EXISTS "id_delete" ON internal_documents;

CREATE POLICY "id_select" ON internal_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "id_insert" ON internal_documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "id_update" ON internal_documents
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "id_delete" ON internal_documents
  FOR DELETE TO authenticated USING (true);

-- ─── storage: client-documents ───────────────────────────────────────────────

DROP POLICY IF EXISTS "client_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "client_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "client_docs_delete" ON storage.objects;

CREATE POLICY "client_docs_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

CREATE POLICY "client_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

CREATE POLICY "client_docs_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');
