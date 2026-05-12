-- Remove the old check constraint on bu column that doesn't allow JSONB arrays
ALTER TABLE okr_objectives DROP CONSTRAINT IF EXISTS okr_objectives_bu_check;
