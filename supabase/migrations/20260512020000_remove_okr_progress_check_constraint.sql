-- Allow OKR progress to exceed 100% (goal can be surpassed).
-- The original constraint limited progress to 0-100.
ALTER TABLE okr_objectives DROP CONSTRAINT IF EXISTS okr_objectives_progress_check;
