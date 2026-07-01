-- Limpar todos os hooks antigos
DELETE FROM public.hooks
WHERE workspace_id IN (
  SELECT id FROM public.internal_workspace WHERE slug = 'koraflow'
);

-- Verificar resultado
SELECT COUNT(*) as hooks_restantes FROM public.hooks
WHERE workspace_id IN (SELECT id FROM public.internal_workspace WHERE slug = 'koraflow');
