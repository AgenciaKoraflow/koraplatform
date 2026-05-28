import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InternalDocument } from "@/types/data";
import { internalDocumentKeys } from "@/hooks/useInternalDocuments";
import { toast } from "sonner";

const BUCKET = "internal-documents";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function detectDocType(file: File): string {
  const mime = file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mime) || ["doc", "docx"].includes(ext)) return "Doc";
  if (["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.oasis.opendocument.spreadsheet"].includes(mime) || ["xls", "xlsx", "ods"].includes(ext)) return "Planilha";
  if (mime === "text/csv" || ext === "csv") return "CSV";
  if (["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"].includes(mime) || ["ppt", "pptx"].includes(ext)) return "Apresentação";
  if (mime === "text/html" || ext === "html" || ext === "htm") return "HTML";
  if (mime === "text/plain" || ext === "txt") return "Texto";
  return "Outro";
}

async function uploadFile(workspaceId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "";
  const path = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(error.message);
  return path;
}

async function removeFile(storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

type AddPayload = Omit<InternalDocument, "id"> & { file?: File };
type UpdatePayload = Partial<InternalDocument> & { file?: File; removeFile?: boolean; url?: string };

export function useInternalDocumentMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (item: AddPayload): Promise<InternalDocument> => {
      let storagePath: string | null = null;
      let fileName: string | null = null;
      let mimeType: string | null = null;
      let fileSize: number | null = null;

      if (item.file) {
        storagePath = await uploadFile(item.workspaceId, item.file);
        fileName = item.file.name;
        mimeType = item.file.type || null;
        fileSize = item.file.size;
      }

      const { data: rows, error } = await supabase
        .from("internal_documents")
        .insert({
          workspace_id: item.workspaceId,
          title: item.title,
          content: item.content ?? null,
          category: item.category ?? null,
          doc_type: item.docType ?? null,
          storage_path: storagePath,
          file_name: fileName,
          mime_type: mimeType,
          file_size: fileSize,
          url: item.url ?? null,
        })
        .select("*");
      if (error) {
        if (storagePath) await removeFile(storagePath);
        throw new Error(error.message);
      }
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar documento");
      const r = rows[0];
      return {
        id: r.id,
        workspaceId: r.workspace_id,
        title: r.title ?? "",
        content: r.content ?? undefined,
        category: r.category ?? undefined,
        docType: r.doc_type ?? undefined,
        storagePath: r.storage_path ?? undefined,
        fileName: r.file_name ?? undefined,
        mimeType: r.mime_type ?? undefined,
        fileSize: r.file_size ?? undefined,
        url: r.url ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalDocumentKeys.all });
      toast.success("Documento adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar documento: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, oldStoragePath }: { id: string; data: UpdatePayload; oldStoragePath?: string }) => {
      const dbData: Record<string, unknown> = {};
      if (data.title !== undefined) dbData.title = data.title;
      if (data.content !== undefined) dbData.content = data.content ?? null;
      if (data.category !== undefined) dbData.category = data.category ?? null;
      if (data.docType !== undefined) dbData.doc_type = data.docType ?? null;
      if (data.url !== undefined) dbData.url = data.url ?? null;

      if (data.file) {
        const workspaceId = data.workspaceId ?? "";
        const newPath = await uploadFile(workspaceId, data.file);
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

      if (Object.keys(dbData).length === 0) return;
      const { error } = await supabase.from("internal_documents").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalDocumentKeys.all });
      toast.success("Documento atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar documento: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath?: string }) => {
      if (storagePath) await removeFile(storagePath);
      const { error } = await supabase.from("internal_documents").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalDocumentKeys.all });
      toast.success("Documento excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir documento: ${errMsg(error)}`),
  });

  return {
    addDocument: (data: AddPayload) =>
      addMutation.mutateAsync(data).catch(() => null as InternalDocument | null),
    updateDocument: (id: string, data: UpdatePayload, oldStoragePath?: string) =>
      updateMutation.mutate({ id, data, oldStoragePath }),
    deleteDocument: (id: string, storagePath?: string) =>
      deleteMutation.mutate({ id, storagePath }),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
