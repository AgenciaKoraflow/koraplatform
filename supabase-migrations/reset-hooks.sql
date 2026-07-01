-- Reset hooks table to allow fresh seed
-- This will delete all existing hooks and allow the new 48-hook seed to be imported

DELETE FROM public.hooks WHERE workspace_id IN (
  SELECT id FROM public.internal_workspace WHERE slug = 'koraflow'
);

-- Verify deletion
SELECT COUNT(*) as remaining_hooks FROM public.hooks
WHERE workspace_id IN (SELECT id FROM public.internal_workspace WHERE slug = 'koraflow');
