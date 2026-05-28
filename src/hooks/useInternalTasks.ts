import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalTask } from "@/lib/mappers";
import type { DbInternalTaskRow } from "@/types/db";

export const internalTaskKeys = {
  all: ["internal_tasks"] as const,
  list: (workspaceId: string) => [...internalTaskKeys.all, "list", workspaceId] as const,
};

export function useInternalTasks(workspaceId: string | undefined) {
  return useQuery({
    queryKey: internalTaskKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_tasks")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbInternalTask(row as DbInternalTaskRow));
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
