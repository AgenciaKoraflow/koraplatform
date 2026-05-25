import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAttachment } from "@/lib/mappers";
import type { DbTaskAttachmentRow } from "@/types/db";
import type { TaskAttachment } from "@/types/data";

export const attachmentKeys = {
  all: ["task_attachments"] as const,
  byTask: (taskId: string) => ["task_attachments", taskId] as const,
};

export function useTaskAttachments(taskId: string | undefined) {
  return useQuery<TaskAttachment[]>({
    queryKey: attachmentKeys.byTask(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbAttachment(r as DbTaskAttachmentRow));
    },
  });
}
