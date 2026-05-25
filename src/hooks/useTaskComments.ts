import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbComment } from "@/lib/mappers";
import type { DbTaskCommentRow } from "@/types/db";
import type { TaskComment } from "@/types/data";

export const commentKeys = {
  all: ["task_comments"] as const,
  byTask: (taskId: string) => ["task_comments", taskId] as const,
};

export function useTaskComments(taskId: string | undefined) {
  return useQuery<TaskComment[]>({
    queryKey: commentKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbComment(r as DbTaskCommentRow));
    },
  });
}
