import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InternalTask } from "@/types/data";
import { internalTaskKeys } from "@/hooks/useInternalTasks";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useInternalTaskMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (item: Omit<InternalTask, "id">): Promise<InternalTask> => {
      const { data: rows, error } = await supabase
        .from("internal_tasks")
        .insert({
          workspace_id: item.workspaceId,
          title: item.title,
          description: item.description ?? null,
          status: item.status,
          priority: item.priority,
          assigned_to: item.assignedTo ?? null,
          due_date: item.dueDate ?? null,
          estimated_hours: item.estimatedHours ?? null,
          blocked_reason: item.blockedReason ?? null,
        })
        .select("*");
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar tarefa");
      const r = rows[0];
      return {
        id: r.id,
        workspaceId: r.workspace_id,
        title: r.title ?? "",
        description: r.description ?? undefined,
        status: r.status as InternalTask["status"],
        priority: r.priority as InternalTask["priority"],
        assignedTo: r.assigned_to ?? undefined,
        dueDate: r.due_date ?? undefined,
        estimatedHours: r.estimated_hours ?? undefined,
        blockedReason: r.blocked_reason ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalTaskKeys.all });
      toast.success("Tarefa adicionada com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar tarefa: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InternalTask> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.title !== undefined) dbData.title = data.title;
      if (data.description !== undefined) dbData.description = data.description ?? null;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.priority !== undefined) dbData.priority = data.priority;
      if (data.assignedTo !== undefined) dbData.assigned_to = data.assignedTo ?? null;
      if (data.dueDate !== undefined) dbData.due_date = data.dueDate ?? null;
      if (data.estimatedHours !== undefined) dbData.estimated_hours = data.estimatedHours ?? null;
      if (data.blockedReason !== undefined) dbData.blocked_reason = data.blockedReason ?? null;
      if (Object.keys(dbData).length === 0) return;
      const { error } = await supabase.from("internal_tasks").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalTaskKeys.all });
      toast.success("Tarefa atualizada com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar tarefa: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internal_tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalTaskKeys.all });
      toast.success("Tarefa excluída com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir tarefa: ${errMsg(error)}`),
  });

  return {
    addTask: (data: Omit<InternalTask, "id">) =>
      addMutation.mutateAsync(data).catch(() => null as InternalTask | null),
    updateTask: (id: string, data: Partial<InternalTask>) =>
      updateMutation.mutate({ id, data }),
    deleteTask: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
