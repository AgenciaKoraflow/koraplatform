import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbSubtask } from "@/lib/mappers";
import type { DbTaskSubtaskRow } from "@/types/db";
import type { TaskSubtask } from "@/types/data";

export const subtaskKeys = {
  all: ["task_subtasks"] as const,
  byTask: (taskId: string) => ["task_subtasks", taskId] as const,
};

export function useTaskSubtasks(taskId: string | undefined) {
  return useQuery<TaskSubtask[]>({
    queryKey: subtaskKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_subtasks")
        .select("*")
        .eq("task_id", taskId!)
        .order("position", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbSubtask(r as DbTaskSubtaskRow));
    },
  });
}
