import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbKnowledge } from "@/lib/mappers";
import { KnowledgeItem } from "@/types/data";
import { knowledgeKeys } from "@/hooks/useKnowledgeItems";
import type { DbKnowledgeItemRow } from "@/types/db";
import { toast } from "sonner";

const BUCKET = "client-documents";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

// Columns to select after insert — same set as list queries, never includes
// the password column so the value never reaches the browser.
const KI_COLS =
  "id, client_id, project_ids, project_id, title, category, content, username, has_password, url, tags, storage_path, file_name, mime_type, file_size, created_at, updated_at";

async function savePassword(id: string, password: string): Promise<void> {
  const { error } = await supabase.functions.invoke("get-password", {
    body: { id, password },
  });
  if (error) {
    throw new Error(
      `Falha ao criptografar senha: ${error.message}. Verifique se KNOWLEDGE_ENCRYPTION_KEY está configurado nos secrets do Supabase.`,
    );
  }
}

async function uploadFile(clientId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "";
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(error.message);
  return path;
}

async function removeFile(storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

type AddPayload = Omit<KnowledgeItem, "id"> & { password?: string; file?: File };
type UpdatePayload = Partial<KnowledgeItem> & { password?: string; file?: File; removeFile?: boolean };

export function useKnowledgeMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (item: AddPayload): Promise<KnowledgeItem> => {
      let storagePath: string | null = null;
      let fileName: string | null = null;
      let mimeType: string | null = null;
      let fileSize: number | null = null;

      if (item.file && item.clientId) {
        storagePath = await uploadFile(item.clientId, item.file);
        fileName = item.file.name;
        mimeType = item.file.type || null;
        fileSize = item.file.size;
      }

      const dbData: Record<string, unknown> = {
        client_id: item.clientId ?? null,
        project_id: item.projectIds?.[0] ?? null,
        title: item.title,
        category: item.category,
        content: item.content,
        username: item.username ?? null,
        url: item.url ?? null,
        tags: item.tags,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        file_size: fileSize,
      };
      const { data: rows, error } = await supabase
        .from("knowledge_items")
        .insert(dbData)
        .select(KI_COLS);
      if (error) {
        if (storagePath) await removeFile(storagePath);
        throw new Error(error.message);
      }
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar item");
      const newItem = mapDbKnowledge(rows[0] as DbKnowledgeItemRow);
      if (item.password) {
        await savePassword(newItem.id, item.password);
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
      oldStoragePath,
    }: {
      id: string;
      data: UpdatePayload;
      oldStoragePath?: string;
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

      if (data.file && data.clientId) {
        const newPath = await uploadFile(data.clientId, data.file);
        dbData.storage_path = newPath;
        dbData.file_name = data.file.name;
        dbData.mime_type = data.file.type || null;
        dbData.file_size = data.file.size;
        if (oldStoragePath) await removeFile(oldStoragePath);
      } else if (data.removeFile) {
        dbData.storage_path = null;
        dbData.file_name = null;
        dbData.mime_type = null;
        dbData.file_size = null;
        if (oldStoragePath) await removeFile(oldStoragePath);
      }

      if (Object.keys(dbData).length > 0) {
        const { error } = await supabase.from("knowledge_items").update(dbData).eq("id", id);
        if (error) throw new Error(error.message);
      }
      if (data.password) {
        await savePassword(id, data.password);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar item: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath?: string }) => {
      if (storagePath) await removeFile(storagePath);
      const { error } = await supabase.from("knowledge_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast.success("Item excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir item: ${errMsg(error)}`),
  });

  /**
   * Returns the plaintext password for an item.
   * Tries the Edge Function first (decrypts if encrypted with AES-256-GCM).
   * Falls back to a direct DB read for plaintext-stored passwords.
   * Shows a toast on any error.
   */
  const getKnowledgePassword = async (id: string): Promise<string | null> => {
    try {
      // Prefer Edge Function — it handles both encrypted (v1:...) and plaintext.
      const { data: result, error } = await supabase.functions.invoke("get-password", {
        body: { id },
      });
      if (!error) {
        const pw = (result as { data?: { password?: string } | null } | null)?.data?.password;
        if (typeof pw === "string") return pw;
        // data: null means no password stored.
        if ((result as { data?: unknown } | null)?.data === null) return null;
      }

      // Edge Function unavailable — fetch raw value directly.
      const { data, error: dbError } = await supabase
        .from("knowledge_items")
        .select("password")
        .eq("id", id)
        .single();
      if (dbError) throw new Error(dbError.message);
      const raw = (data as { password: string | null } | null)?.password;
      if (!raw) return null;
      // If the value is encrypted but the Edge Function is unavailable we cannot
      // decrypt it — inform the user rather than returning garbled ciphertext.
      if (raw.startsWith("v1:")) {
        toast.error(
          "Senha criptografada mas Edge Function indisponível. Configure KNOWLEDGE_ENCRYPTION_KEY.",
        );
        return null;
      }
      return raw;
    } catch (error) {
      toast.error(`Erro ao obter senha: ${errMsg(error)}`);
      return null;
    }
  };

  return {
    addKnowledgeItem: (data: AddPayload) =>
      addMutation.mutateAsync(data).catch(() => null as KnowledgeItem | null),
    updateKnowledgeItem: (id: string, data: UpdatePayload, oldStoragePath?: string) =>
      updateMutation.mutate({ id, data, oldStoragePath }),
    deleteKnowledgeItem: (id: string, storagePath?: string) =>
      deleteMutation.mutate({ id, storagePath }),
    getKnowledgePassword,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
