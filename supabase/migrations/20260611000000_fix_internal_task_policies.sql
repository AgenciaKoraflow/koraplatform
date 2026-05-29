-- Fix RLS policies for internal_task_subtasks and internal_task_time_entries.
-- These tables were created with role-based policies in 20260529000001;
-- align them with the no-role approach from 20260610000000.

-- ─── internal_task_subtasks ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "its_select" ON internal_task_subtasks;
DROP POLICY IF EXISTS "its_insert" ON internal_task_subtasks;
DROP POLICY IF EXISTS "its_update" ON internal_task_subtasks;
DROP POLICY IF EXISTS "its_delete" ON internal_task_subtasks;

CREATE POLICY "its_select" ON internal_task_subtasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "its_insert" ON internal_task_subtasks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "its_update" ON internal_task_subtasks
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "its_delete" ON internal_task_subtasks
  FOR DELETE TO authenticated USING (true);

-- ─── internal_task_time_entries ──────────────────────────────────────────────

DROP POLICY IF EXISTS "itte_select" ON internal_task_time_entries;
DROP POLICY IF EXISTS "itte_insert" ON internal_task_time_entries;
DROP POLICY IF EXISTS "itte_delete" ON internal_task_time_entries;

CREATE POLICY "itte_select" ON internal_task_time_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "itte_insert" ON internal_task_time_entries
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "itte_delete" ON internal_task_time_entries
  FOR DELETE TO authenticated USING (true);
