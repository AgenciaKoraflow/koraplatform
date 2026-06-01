import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbProjectDocument } from "@/lib/mappers";
import type { DbProjectDocumentRow } from "@/types/db";
import type { ProjectDocument } from "@/types/data";

export const projectDocumentKeys = {
  all: ["project_documents"] as const,
  byProject: (projectId: string) => ["project_documents", projectId] as const,
};

export function useProjectDocuments(projectId: string | undefined) {
  return useQuery<ProjectDocument[]>({
    queryKey: projectDocumentKeys.byProject(projectId ?? ""),
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId!)
        .order("type");
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => mapDbProjectDocument(r as DbProjectDocumentRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}
