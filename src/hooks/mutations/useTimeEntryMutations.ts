import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTimeEntry } from "@/lib/mappers";
import { timeEntryKeys } from "@/hooks/useTaskTimeEntries";
import { subtaskTimeEntryKeys } from "@/hooks/useSubtaskTimeEntries";
import type { DbTaskTimeEntryRow } from "@/types/db";
import type { TaskTimeEntry } from "@/types/data";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useTimeEntryMutations(taskId: string, subtaskId?: string) {
  const qc = useQueryClient();

  function invalidate() {
    qc.invalidateQueries({ queryKey: timeEntryKeys.byTask(taskId) });
    if (subtaskId) {
      qc.invalidateQueries({ queryKey: subtaskTimeEntryKeys.bySubtask(subtaskId) });
    }
  }

  const addMutation = useMutation({
    mutationFn: async ({
      description,
      hours,
      author,
    }: {
      description: string;
      hours: number;
      author: string;
    }): Promise<TaskTimeEntry> => {
      const { data, error } = await supabase
        .from("task_time_entries")
        .insert({
          task_id: taskId,
          subtask_id: subtaskId ?? null,
          description,
          hours,
          author,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbTimeEntry(data as DbTaskTimeEntryRow);
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(`Erro ao registrar horas: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_time_entries").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(`Erro ao remover entrada: ${errMsg(e)}`),
  });

  return {
    addTimeEntry: (description: string, hours: number, author: string) =>
      addMutation.mutate({ description, hours, author }),
    deleteTimeEntry: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
