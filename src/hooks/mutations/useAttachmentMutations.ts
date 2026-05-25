import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAttachment } from "@/lib/mappers";
import { attachmentKeys } from "@/hooks/useTaskAttachments";
import { subtaskAttachmentKeys } from "@/hooks/useSubtaskAttachments";
import type { DbTaskAttachmentRow } from "@/types/db";
import type { TaskAttachment } from "@/types/data";
import { toast } from "sonner";

const BUCKET = "task-attachments";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useAttachmentMutations(taskId: string, subtaskId?: string) {
  const qc = useQueryClient();

  function invalidate() {
    qc.invalidateQueries({ queryKey: attachmentKeys.byTask(taskId) });
    if (subtaskId) {
      qc.invalidateQueries({ queryKey: subtaskAttachmentKeys.bySubtask(subtaskId) });
    }
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<TaskAttachment> => {
      const ext = file.name.split(".").pop() ?? "";
      const folder = subtaskId ? `${taskId}/subtasks/${subtaskId}` : taskId;
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data, error } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          subtask_id: subtaskId ?? null,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type || null,
          file_size: file.size,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbAttachment(data as DbTaskAttachmentRow);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Arquivo enviado com sucesso");
    },
    onError: (e) => toast.error(`Erro ao enviar arquivo: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      const { error } = await supabase.from("task_attachments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Arquivo removido");
    },
    onError: (e) => toast.error(`Erro ao remover arquivo: ${errMsg(e)}`),
  });

  return {
    uploadAttachment: (file: File) => uploadMutation.mutate(file),
    deleteAttachment: (id: string, storagePath: string) =>
      deleteMutation.mutate({ id, storagePath }),
    isUploading: uploadMutation.isPending,
  };
}
