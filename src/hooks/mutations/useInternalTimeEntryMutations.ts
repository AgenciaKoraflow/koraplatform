import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { internalTimeEntryKeys } from "@/hooks/useInternalTaskTimeEntries";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useInternalTimeEntryMutations(taskId: string) {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({ description, hours, author }: { description: string; hours: number; author: string }) => {
      const { error } = await supabase
        .from("internal_task_time_entries")
        .insert({ task_id: taskId, description, hours, author });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: internalTimeEntryKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao registrar horas: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internal_task_time_entries").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: internalTimeEntryKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao remover entrada de horas: ${errMsg(e)}`),
  });

  return {
    addEntry: (description: string, hours: number, author: string) =>
      addMutation.mutate({ description, hours, author }),
    deleteEntry: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
