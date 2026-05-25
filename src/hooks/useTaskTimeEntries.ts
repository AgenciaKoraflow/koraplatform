import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTimeEntry } from "@/lib/mappers";
import type { DbTaskTimeEntryRow } from "@/types/db";
import type { TaskTimeEntry } from "@/types/data";

export const timeEntryKeys = {
  all: ["task_time_entries"] as const,
  byTask: (taskId: string) => ["task_time_entries", taskId] as const,
};

export function useTaskTimeEntries(taskId: string | undefined) {
  return useQuery<TaskTimeEntry[]>({
    queryKey: timeEntryKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_time_entries")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbTimeEntry(r as DbTaskTimeEntryRow));
    },
  });
}
