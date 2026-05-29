import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InternalTaskComment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  mentionedUsers: string[];
  isPrivate: boolean;
  createdAt: string;
}

export const internalCommentKeys = {
  all: ["internal_task_comments"] as const,
  byTask: (taskId: string) => ["internal_task_comments", taskId] as const,
};

export function useInternalTaskComments(taskId: string | undefined) {
  return useQuery<InternalTaskComment[]>({
    queryKey: internalCommentKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("internal_task_comments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((r: any) => ({
        id: r.id,
        taskId: r.task_id,
        author: r.author,
        content: r.content,
        mentionedUsers: r.mentioned_users ?? [],
        isPrivate: r.is_private ?? false,
        createdAt: r.created_at,
      }));
    },
  });
}
