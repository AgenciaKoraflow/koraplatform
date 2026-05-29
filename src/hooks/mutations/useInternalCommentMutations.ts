import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { internalCommentKeys } from "@/hooks/useInternalTaskComments";

export function useInternalCommentMutations(taskId: string) {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({
      author,
      content,
      mentionedUsers,
      isPrivate,
    }: {
      author: string;
      content: string;
      mentionedUsers: string[];
      isPrivate: boolean;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("internal_task_comments")
        .insert({ task_id: taskId, author, content, mentioned_users: mentionedUsers, is_private: isPrivate });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: internalCommentKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao adicionar comentário: ${e instanceof Error ? e.message : "Erro desconhecido"}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("internal_task_comments")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: internalCommentKeys.byTask(taskId) }),
    onError: (e) => toast.error(`Erro ao remover comentário: ${e instanceof Error ? e.message : "Erro desconhecido"}`),
  });

  return {
    addComment: (author: string, content: string, mentionedUsers: string[], isPrivate: boolean) =>
      addMutation.mutate({ author, content, mentionedUsers, isPrivate }),
    deleteComment: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
