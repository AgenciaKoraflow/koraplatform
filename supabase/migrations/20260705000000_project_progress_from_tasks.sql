-- O progresso do projeto passa a ser calculado no banco a partir das tarefas e
-- subtarefas, em vez de depender de cada tela lembrar de recalcular.
--
-- Regra: cada tarefa vale 1. Tarefa concluída conta inteira; tarefa aberta com
-- subtarefas conta a fração de subtarefas concluídas; sem subtarefas conta 0.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS task_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_task_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.recalc_project_progress(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_done INTEGER;
  v_score NUMERIC;
  v_progress INTEGER;
BEGIN
  IF p_project_id IS NULL THEN RETURN; END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE t.status = 'done'),
    coalesce(sum(
      CASE
        WHEN t.status = 'done' THEN 1
        WHEN s.total > 0 THEN s.done::NUMERIC / s.total
        ELSE 0
      END
    ), 0)
  INTO v_total, v_done, v_score
  FROM tasks t
  LEFT JOIN LATERAL (
    SELECT count(*) AS total, count(*) FILTER (WHERE ts.done) AS done
    FROM task_subtasks ts
    WHERE ts.task_id = t.id
  ) s ON TRUE
  WHERE t.project_id = p_project_id;

  v_progress := CASE WHEN v_total = 0 THEN 0 ELSE round(v_score / v_total * 100)::INTEGER END;

  UPDATE projects
  SET task_count = v_total,
      completed_task_count = v_done,
      progress = v_progress
  WHERE id = p_project_id
    AND (task_count, completed_task_count, coalesce(progress, 0))
        IS DISTINCT FROM (v_total, v_done, v_progress);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_tasks_recalc_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_project_progress(NEW.project_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_project_progress(OLD.project_id);
  ELSE
    PERFORM public.recalc_project_progress(OLD.project_id);
    IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
      PERFORM public.recalc_project_progress(NEW.project_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tasks_recalc_project ON tasks;
CREATE TRIGGER tasks_recalc_project
  AFTER INSERT OR DELETE OR UPDATE OF status, project_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_tasks_recalc_project();

CREATE OR REPLACE FUNCTION public.trg_subtasks_recalc_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_task_id := OLD.task_id;
  ELSE
    v_task_id := NEW.task_id;
  END IF;
  -- When the parent task is being deleted too, it is already gone and this is a no-op.
  PERFORM public.recalc_project_progress(
    (SELECT project_id FROM tasks WHERE id = v_task_id)
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS subtasks_recalc_project ON task_subtasks;
CREATE TRIGGER subtasks_recalc_project
  AFTER INSERT OR DELETE OR UPDATE OF done ON task_subtasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_subtasks_recalc_project();

-- Corrige os projetos que já estão com o progresso desatualizado.
SELECT public.recalc_project_progress(id) FROM projects;
