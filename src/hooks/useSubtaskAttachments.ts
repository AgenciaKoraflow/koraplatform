import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAttachment } from "@/lib/mappers";
import type { DbTaskAttachmentRow } from "@/types/db";
import type { TaskAttachment } from "@/types/data";

export const subtaskAttachmentKeys = {
  all: ["subtask_attachments"] as const,
  bySubtask: (subtaskId: string) => ["subtask_attachments", subtaskId] as const,
};

export function useSubtaskAttachments(subtaskId: string | undefined) {
  return useQuery<TaskAttachment[]>({
    queryKey: subtaskAttachmentKeys.bySubtask(subtaskId ?? ""),
    enabled: !!subtaskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("subtask_id", subtaskId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbAttachment(r as DbTaskAttachmentRow));
    },
  });
}
