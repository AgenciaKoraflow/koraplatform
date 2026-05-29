import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalTaskSubtask } from "@/lib/mappers";
import type { DbInternalTaskSubtaskRow } from "@/types/db";
import type { InternalTaskSubtask } from "@/types/data";

export const internalSubtaskKeys = {
  all: ["internal_task_subtasks"] as const,
  byTask: (taskId: string) => ["internal_task_subtasks", taskId] as const,
};

export function useInternalTaskSubtasks(taskId: string | undefined) {
  return useQuery<InternalTaskSubtask[]>({
    queryKey: internalSubtaskKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_task_subtasks")
        .select("*")
        .eq("task_id", taskId!)
        .order("position", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbInternalTaskSubtask(r as DbInternalTaskSubtaskRow));
    },
  });
}
