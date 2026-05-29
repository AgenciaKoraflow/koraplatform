import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalTaskTimeEntry } from "@/lib/mappers";
import type { DbInternalTaskTimeEntryRow } from "@/types/db";
import type { InternalTaskTimeEntry } from "@/types/data";

export const internalTimeEntryKeys = {
  all: ["internal_task_time_entries"] as const,
  byTask: (taskId: string) => ["internal_task_time_entries", taskId] as const,
};

export function useInternalTaskTimeEntries(taskId: string | undefined) {
  return useQuery<InternalTaskTimeEntry[]>({
    queryKey: internalTimeEntryKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_task_time_entries")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbInternalTaskTimeEntry(r as DbInternalTaskTimeEntryRow));
    },
  });
}
