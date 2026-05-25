import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbComment } from "@/lib/mappers";
import { commentKeys } from "@/hooks/useTaskComments";
import type { DbTaskCommentRow } from "@/types/db";
import type { TaskComment } from "@/types/data";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useCommentMutations(taskId: string) {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({ author, content, mentionedUsers }: { author: string; content: string; mentionedUsers?: string[] }): Promise<TaskComment> => {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({ task_id: taskId, author, content, mentioned_users: mentionedUsers ?? [] })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbComment(data as DbTaskCommentRow);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao adicionar comentário: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao remover comentário: ${errMsg(e)}`),
  });

  return {
    addComment: (author: string, content: string, mentionedUsers?: string[]) => addMutation.mutate({ author, content, mentionedUsers }),
    deleteComment: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
