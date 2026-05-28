import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalWorkspace } from "@/lib/mappers";
import type { DbInternalWorkspaceRow } from "@/types/db";

export const internalWorkspaceKeys = {
  all: ["internal_workspace"] as const,
  single: () => [...internalWorkspaceKeys.all, "single"] as const,
};

export function useInternalWorkspace() {
  return useQuery({
    queryKey: internalWorkspaceKeys.single(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_workspace")
        .select("*")
        .eq("slug", "koraflow")
        .single<DbInternalWorkspaceRow>();
      if (error) throw new Error(error.message);
      return mapDbInternalWorkspace(data);
    },
    staleTime: 10 * 60 * 1000,
  });
}
