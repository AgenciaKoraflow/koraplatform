import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { internalDocumentFolderKeys } from "@/hooks/useInternalDocumentFolders";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useInternalDocumentFolderMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({ workspaceId, name }: { workspaceId: string; name: string }) => {
      const { error } = await supabase
        .from("internal_document_folders")
        .insert({ workspace_id: workspaceId, name });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalDocumentFolderKeys.all });
      toast.success("Pasta criada com sucesso");
    },
    onError: (error) => toast.error(`Erro ao criar pasta: ${errMsg(error)}`),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("internal_document_folders")
        .update({ name })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalDocumentFolderKeys.all });
      toast.success("Pasta renomeada");
    },
    onError: (error) => toast.error(`Erro ao renomear pasta: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("internal_document_folders")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalDocumentFolderKeys.all });
      toast.success("Pasta excluída — documentos movidos para 'Sem pasta'");
    },
    onError: (error) => toast.error(`Erro ao excluir pasta: ${errMsg(error)}`),
  });

  return {
    addFolder: (workspaceId: string, name: string) => addMutation.mutate({ workspaceId, name }),
    renameFolder: (id: string, name: string) => renameMutation.mutate({ id, name }),
    deleteFolder: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
