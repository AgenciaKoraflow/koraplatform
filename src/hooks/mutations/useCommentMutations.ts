import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbComment } from "@/lib/mappers";
import { commentKeys } from "@/hooks/useTaskComments";
import { subtaskCommentKeys } from "@/hooks/useSubtaskComments";
import type { DbTaskCommentRow } from "@/types/db";
import type { TaskComment } from "@/types/data";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useCommentMutations(taskId: string, subtaskId?: string) {
  const qc = useQueryClient();

  function invalidate() {
    qc.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    if (subtaskId) {
      qc.invalidateQueries({ queryKey: subtaskCommentKeys.bySubtask(subtaskId) });
    }
  }

  const addMutation = useMutation({
    mutationFn: async ({
      author,
      content,
      mentionedUsers,
    }: {
      author: string;
      content: string;
      mentionedUsers?: string[];
    }): Promise<TaskComment> => {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          subtask_id: subtaskId ?? null,
          author,
          content,
          mentioned_users: mentionedUsers ?? [],
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbComment(data as DbTaskCommentRow);
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(`Erro ao adicionar comentário: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(`Erro ao remover comentário: ${errMsg(e)}`),
  });

  return {
    addComment: (author: string, content: string, mentionedUsers?: string[]) =>
      addMutation.mutate({ author, content, mentionedUsers }),
    deleteComment: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
