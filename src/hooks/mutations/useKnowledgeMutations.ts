import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callExternalDb } from "@/lib/externalDb";
import { mapDbKnowledge } from "@/lib/mappers";
import { KnowledgeItem } from "@/types/data";
import { knowledgeKeys } from "@/hooks/useKnowledgeItems";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useKnowledgeMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (item: Omit<KnowledgeItem, "id"> & { password?: string }): Promise<KnowledgeItem> => {
      const dbData: Record<string, unknown> = {
        client_id: item.clientId ?? null,
        project_id: item.projectIds?.[0] ?? null,
        title: item.title,
        category: item.category,
        content: item.content,
        username: item.username ?? null,
        url: item.url ?? null,
        tags: item.tags,
      };
      if (item.password) dbData.password = item.password;
      const result = await callExternalDb("insert", "knowledge_items", dbData);
      if (!result?.[0]) throw new Error("Resposta vazia ao criar item");
      return mapDbKnowledge(result[0]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar item: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<KnowledgeItem> & { password?: string };
    }) => {
      const dbData: Record<string, unknown> = {};
      if (data.clientId !== undefined) dbData.client_id = data.clientId ?? null;
      if (data.projectIds !== undefined) dbData.project_id = data.projectIds?.[0] ?? null;
      if (data.title) dbData.title = data.title;
      if (data.category) dbData.category = data.category;
      if (data.content !== undefined) dbData.content = data.content;
      if (data.username !== undefined) dbData.username = data.username;
      if (data.password) dbData.password = data.password;
      if (data.url !== undefined) dbData.url = data.url;
      if (data.tags) dbData.tags = data.tags;
      await callExternalDb("update", "knowledge_items", dbData, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar item: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callExternalDb("delete", "knowledge_items", undefined, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir item: ${errMsg(error)}`),
  });

  const getKnowledgePassword = async (id: string): Promise<string | null> => {
    try {
      const result = await callExternalDb("get_password", "knowledge_items", undefined, id);
      const pw = (result as { password?: string } | null)?.password;
      return typeof pw === "string" ? pw : null;
    } catch (error) {
      toast.error(`Erro ao obter senha: ${errMsg(error)}`);
      return null;
    }
  };

  return {
    addKnowledgeItem: (data: Omit<KnowledgeItem, "id"> & { password?: string }) =>
      addMutation.mutateAsync(data).catch(() => null as KnowledgeItem | null),
    updateKnowledgeItem: (id: string, data: Partial<KnowledgeItem> & { password?: string }) =>
      updateMutation.mutate({ id, data }),
    deleteKnowledgeItem: (id: string) => deleteMutation.mutate(id),
    getKnowledgePassword,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
