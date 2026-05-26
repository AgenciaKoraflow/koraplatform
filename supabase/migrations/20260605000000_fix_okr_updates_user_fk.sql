-- Fix okr_updates.updated_by FK to allow user deletion without blocking
-- The constraint was created without ON DELETE SET NULL, causing DELETE to fail
-- when the user has okr_updates records.

ALTER TABLE okr_updates
  DROP CONSTRAINT IF EXISTS okr_updates_updated_by_fkey;

ALTER TABLE okr_updates
  ADD CONSTRAINT okr_updates_updated_by_fkey
    FOREIGN KEY (updated_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
