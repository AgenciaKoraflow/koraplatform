import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbKnowledge } from "@/lib/mappers";
import { KnowledgeItem } from "@/types/data";
import { knowledgeKeys } from "@/hooks/useKnowledgeItems";
import type { DbKnowledgeItemRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

function toDbRow(raw: Record<string, unknown>): DbKnowledgeItemRow {
  const { password, ...rest } = raw;
  return { ...rest, has_password: password !== null && password !== undefined && password !== "" } as DbKnowledgeItemRow;
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
      const { data: rows, error } = await supabase.from("knowledge_items").insert(dbData).select();
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar item");
      const newItem = mapDbKnowledge(toDbRow(rows[0] as Record<string, unknown>));
      // Encrypt and save password server-side if provided
      if (item.password) {
        await supabase.functions.invoke("get-password", {
          body: { id: newItem.id, password: item.password },
        });
      }
      return newItem;
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
      if (data.url !== undefined) dbData.url = data.url;
      if (data.tags) dbData.tags = data.tags;
      if (Object.keys(dbData).length > 0) {
        const { error } = await supabase.from("knowledge_items").update(dbData).eq("id", id);
        if (error) throw new Error(error.message);
      }
      // Encrypt and save password server-side if provided
      if (data.password) {
        await supabase.functions.invoke("get-password", {
          body: { id, password: data.password },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar item: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir item: ${errMsg(error)}`),
  });

  const getKnowledgePassword = async (id: string): Promise<string | null> => {
    try {
      const { data: result, error } = await supabase.functions.invoke("get-password", {
        body: { id },
      });
      if (error) throw new Error(error.message);
      const pw = (result as { data?: { password?: string } } | null)?.data?.password;
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
