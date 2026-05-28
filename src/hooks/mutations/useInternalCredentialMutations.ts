import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalCredential } from "@/lib/mappers";
import { InternalCredential } from "@/types/data";
import { internalCredentialKeys } from "@/hooks/useInternalCredentials";
import type { DbInternalCredentialRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

const IC_COLS = "id, workspace_id, title, username, has_password, url, notes, category, created_at, updated_at";

async function saveCredentialPassword(id: string, password: string): Promise<void> {
  const { error } = await supabase.functions.invoke("get-internal-credential", {
    body: { id, password },
  });
  if (error) {
    throw new Error(
      `Falha ao criptografar senha: ${error.message}. Verifique se KNOWLEDGE_ENCRYPTION_KEY está configurado.`,
    );
  }
}

export function useInternalCredentialMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (
      item: Omit<InternalCredential, "id"> & { password?: string },
    ): Promise<InternalCredential> => {
      const dbData: Record<string, unknown> = {
        workspace_id: item.workspaceId,
        title: item.title,
        username: item.username ?? null,
        url: item.url ?? null,
        notes: item.notes ?? null,
        category: item.category ?? null,
      };
      const { data: rows, error } = await supabase
        .from("internal_credentials")
        .insert(dbData)
        .select(IC_COLS);
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar credencial");
      const newItem = mapDbInternalCredential(rows[0] as DbInternalCredentialRow);
      if (item.password) {
        await saveCredentialPassword(newItem.id, item.password);
      }
      return newItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalCredentialKeys.all });
      toast.success("Credencial adicionada com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar credencial: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InternalCredential> & { password?: string };
    }) => {
      const dbData: Record<string, unknown> = {};
      if (data.title !== undefined) dbData.title = data.title;
      if (data.username !== undefined) dbData.username = data.username ?? null;
      if (data.url !== undefined) dbData.url = data.url ?? null;
      if (data.notes !== undefined) dbData.notes = data.notes ?? null;
      if (data.category !== undefined) dbData.category = data.category ?? null;
      if (Object.keys(dbData).length > 0) {
        const { error } = await supabase.from("internal_credentials").update(dbData).eq("id", id);
        if (error) throw new Error(error.message);
      }
      if (data.password) {
        await saveCredentialPassword(id, data.password);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalCredentialKeys.all });
      toast.success("Credencial atualizada com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar credencial: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internal_credentials").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalCredentialKeys.all });
      toast.success("Credencial excluída com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir credencial: ${errMsg(error)}`),
  });

  const getCredentialPassword = async (id: string): Promise<string | null> => {
    try {
      const { data: result, error } = await supabase.functions.invoke("get-internal-credential", {
        body: { id },
      });
      if (!error) {
        const pw = (result as { data?: { password?: string } | null } | null)?.data?.password;
        if (typeof pw === "string") return pw;
        if ((result as { data?: unknown } | null)?.data === null) return null;
      }
      toast.error("Edge Function indisponível. Configure KNOWLEDGE_ENCRYPTION_KEY.");
      return null;
    } catch (error) {
      toast.error(`Erro ao obter senha: ${errMsg(error)}`);
      return null;
    }
  };

  return {
    addCredential: (data: Omit<InternalCredential, "id"> & { password?: string }) =>
      addMutation.mutateAsync(data).catch(() => null as InternalCredential | null),
    updateCredential: (id: string, data: Partial<InternalCredential> & { password?: string }) =>
      updateMutation.mutate({ id, data }),
    deleteCredential: (id: string) => deleteMutation.mutate(id),
    getCredentialPassword,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
