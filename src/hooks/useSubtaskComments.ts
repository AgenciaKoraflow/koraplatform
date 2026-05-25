import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbComment } from "@/lib/mappers";
import type { DbTaskCommentRow } from "@/types/db";
import type { TaskComment } from "@/types/data";

export const subtaskCommentKeys = {
  all: ["subtask_comments"] as const,
  bySubtask: (subtaskId: string) => ["subtask_comments", subtaskId] as const,
};

export function useSubtaskComments(subtaskId: string | undefined) {
  return useQuery<TaskComment[]>({
    queryKey: subtaskCommentKeys.bySubtask(subtaskId ?? ""),
    enabled: !!subtaskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("subtask_id", subtaskId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbComment(r as DbTaskCommentRow));
    },
  });
}
