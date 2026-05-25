import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTimeEntry } from "@/lib/mappers";
import type { DbTaskTimeEntryRow } from "@/types/db";
import type { TaskTimeEntry } from "@/types/data";

export const subtaskTimeEntryKeys = {
  all: ["subtask_time_entries"] as const,
  bySubtask: (subtaskId: string) => ["subtask_time_entries", subtaskId] as const,
};

export function useSubtaskTimeEntries(subtaskId: string | undefined) {
  return useQuery<TaskTimeEntry[]>({
    queryKey: subtaskTimeEntryKeys.bySubtask(subtaskId ?? ""),
    enabled: !!subtaskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_time_entries")
        .select("*")
        .eq("subtask_id", subtaskId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbTimeEntry(r as DbTaskTimeEntryRow));
    },
  });
}
