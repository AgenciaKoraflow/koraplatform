import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalDocument } from "@/lib/mappers";
import type { DbInternalDocumentRow } from "@/types/db";

export const internalDocumentKeys = {
  all: ["internal_documents"] as const,
  list: (workspaceId: string) => [...internalDocumentKeys.all, "list", workspaceId] as const,
};

export function useInternalDocuments(workspaceId: string | undefined) {
  return useQuery({
    queryKey: internalDocumentKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_documents")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("title");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbInternalDocument(row as DbInternalDocumentRow));
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
