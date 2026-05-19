-- Run this in the EXTERNAL Supabase project SQL editor (not the main project).
-- Adds storage path columns so base64 blobs can be moved to Supabase Storage.
-- Safe to run multiple times (IF NOT EXISTS guards).

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS document_storage_path       TEXT,
  ADD COLUMN IF NOT EXISTS document_version            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signed_document_storage_path TEXT;

-- After the migrate-contracts-storage edge function runs successfully,
-- the base64 columns can be dropped with:
--
--   ALTER TABLE contracts
--     DROP COLUMN IF EXISTS document_data,
--     DROP COLUMN IF EXISTS signed_document_data;
--
-- Do NOT drop them before confirming the migration completed without errors.
