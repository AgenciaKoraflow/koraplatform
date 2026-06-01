import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { projectDocumentKeys } from "@/hooks/useProjectDocuments";
import { mapDbProjectDocument } from "@/lib/mappers";
import type { DbProjectDocumentRow } from "@/types/db";
import type { ProjectDocument, ProjectDocumentType } from "@/types/data";
import { toast } from "sonner";

const BUCKET = "project-documents";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useProjectDocumentMutations() {
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({
      projectId,
      type,
      file,
      oldStoragePath,
    }: {
      projectId: string;
      type: ProjectDocumentType;
      file: File;
      oldStoragePath?: string;
    }): Promise<ProjectDocument> => {
      const ext = file.name.split(".").pop() ?? "";
      const path = `${projectId}/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data, error } = await supabase
        .from("project_documents")
        .upsert(
          {
            project_id: projectId,
            type,
            file_name: file.name,
            storage_path: path,
            mime_type: file.type || null,
            file_size: file.size,
          },
          { onConflict: "project_id,type" }
        )
        .select()
        .single();
      if (error) throw new Error(error.message);

      if (oldStoragePath && oldStoragePath !== path) {
        await supabase.storage.from(BUCKET).remove([oldStoragePath]);
      }

      return mapDbProjectDocument(data as DbProjectDocumentRow);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectDocumentKeys.byProject(variables.projectId) });
      toast.success("Documento enviado com sucesso");
    },
    onError: (e) => toast.error(`Erro ao enviar documento: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      storagePath,
      projectId,
    }: {
      id: string;
      storagePath: string;
      projectId: string;
    }) => {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      const { error } = await supabase.from("project_documents").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return projectId;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectDocumentKeys.byProject(variables.projectId) });
      toast.success("Documento removido");
    },
    onError: (e) => toast.error(`Erro ao remover documento: ${errMsg(e)}`),
  });

  return {
    uploadDocument: (params: {
      projectId: string;
      type: ProjectDocumentType;
      file: File;
      oldStoragePath?: string;
    }) => uploadMutation.mutateAsync(params),
    deleteDocument: (id: string, storagePath: string, projectId: string) =>
      deleteMutation.mutate({ id, storagePath, projectId }),
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
