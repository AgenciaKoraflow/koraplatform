import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbSubtask } from "@/lib/mappers";
import { subtaskKeys } from "@/hooks/useTaskSubtasks";
import type { DbTaskSubtaskRow } from "@/types/db";
import type { TaskSubtask, SubtaskStatus } from "@/types/data";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useSubtaskMutations(taskId: string) {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (title: string): Promise<TaskSubtask> => {
      const { data: existing } = await supabase
        .from("task_subtasks")
        .select("position")
        .eq("task_id", taskId)
        .order("position", { ascending: false })
        .limit(1);
      const nextPos = existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0;
      const { data, error } = await supabase
        .from("task_subtasks")
        .insert({ task_id: taskId, title, position: nextPos })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbSubtask(data as DbTaskSubtaskRow);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao adicionar subtarefa: ${errMsg(e)}`),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("task_subtasks").update({ done }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao atualizar subtarefa: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_subtasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao remover subtarefa: ${errMsg(e)}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, substatus }: { id: string; substatus: SubtaskStatus }) => {
      const done = substatus === "done";
      const { error } = await supabase
        .from("task_subtasks")
        .update({ substatus, done })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subtaskKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao atualizar status: ${errMsg(e)}`),
  });

  return {
    addSubtask: (title: string) => addMutation.mutate(title),
    toggleSubtask: (id: string, done: boolean) => toggleMutation.mutate({ id, done }),
    deleteSubtask: (id: string) => deleteMutation.mutate(id),
    updateSubtaskStatus: (id: string, substatus: SubtaskStatus) => updateStatusMutation.mutate({ id, substatus }),
    isAdding: addMutation.isPending,
  };
}
