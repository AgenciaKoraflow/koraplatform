import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalDocumentFolder } from "@/lib/mappers";
import type { DbInternalDocumentFolderRow } from "@/types/db";

export const internalDocumentFolderKeys = {
  all: ["internal_document_folders"] as const,
  list: (workspaceId: string) => [...internalDocumentFolderKeys.all, "list", workspaceId] as const,
};

export function useInternalDocumentFolders(workspaceId: string | undefined) {
  return useQuery({
    queryKey: internalDocumentFolderKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_document_folders")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbInternalDocumentFolder(row as DbInternalDocumentFolderRow));
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
