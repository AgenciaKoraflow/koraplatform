import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTask, toISODate } from "@/lib/mappers";
import { Task } from "@/types/data";
import { taskKeys } from "@/hooks/useTasks";
import { projectKeys } from "@/hooks/useProjects";
import type { DbTaskRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

async function syncProjectProgress(projectId: string, qc: ReturnType<typeof useQueryClient>) {
  try {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("project_id", projectId);
    const total = tasks?.length ?? 0;
    if (total === 0) return;
    const completed = (tasks ?? []).filter((t) => t.status === "done").length;
    const progress = Math.round((completed / total) * 100);
    await supabase.from("projects").update({ progress }).eq("id", projectId);
    qc.invalidateQueries({ queryKey: projectKeys.all });
  } catch {
    // Non-critical — progress corrected on next data load
  }
}

export function useTaskMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (task: Omit<Task, "id">): Promise<Task> => {
      const dbData: Record<string, unknown> = {
        client_id: task.clientId,
        project_id: task.projectId || null,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: toISODate(task.dueDate),
        assigned_to: task.assignees.join(", "),
      };
      if (task.bu) dbData.bu = task.bu;
      const { data: rows, error } = await supabase.from("tasks").insert(dbData).select();
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar tarefa");
      return mapDbTask(rows[0] as DbTaskRow);
    },
    onSuccess: async (newTask) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      if (newTask.projectId) await syncProjectProgress(newTask.projectId, qc);
      toast.success("Tarefa adicionada com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar tarefa: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.clientId) dbData.client_id = data.clientId;
      if (data.projectId !== undefined) dbData.project_id = data.projectId || null;
      if (data.title) dbData.title = data.title;
      if (data.description) dbData.description = data.description;
      if (data.status) dbData.status = data.status;
      if (data.priority) dbData.priority = data.priority;
      if (data.dueDate) dbData.due_date = toISODate(data.dueDate);
      if (data.assignees) dbData.assigned_to = data.assignees.join(", ");
      if (data.bu !== undefined) dbData.bu = data.bu;
      const { error } = await supabase.from("tasks").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
      return data.projectId;
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: taskKeys.allItems() });
      const previous = qc.getQueryData<Task[]>(taskKeys.allItems());
      qc.setQueryData<Task[]>(taskKeys.allItems(), (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...data } : t)) ?? []
      );
      return { previous };
    },
    onSuccess: async (projectId) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      if (projectId) await syncProjectProgress(projectId, qc);
      toast.success("Tarefa atualizada com sucesso");
    },
    onError: (error, _, context) => {
      if (context?.previous) qc.setQueryData(taskKeys.allItems(), context.previous);
      toast.error(`Erro ao atualizar tarefa: ${errMsg(error)}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: taskRow } = await supabase
        .from("tasks")
        .select("project_id")
        .eq("id", id)
        .single();
      const projectId = taskRow?.project_id ?? undefined;
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return projectId;
    },
    onSuccess: async (projectId) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      if (projectId) await syncProjectProgress(projectId, qc);
      toast.success("Tarefa excluída com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir tarefa: ${errMsg(error)}`),
  });

  return {
    addTask: (data: Omit<Task, "id">) =>
      addMutation.mutateAsync(data).catch(() => null as Task | null),
    updateTask: (id: string, data: Partial<Task>) => updateMutation.mutate({ id, data }),
    deleteTask: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
