import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbInternalCredential } from "@/lib/mappers";
import type { DbInternalCredentialRow } from "@/types/db";

export const internalCredentialKeys = {
  all: ["internal_credentials"] as const,
  list: (workspaceId: string) => [...internalCredentialKeys.all, "list", workspaceId] as const,
};

// Never select password_encrypted — use has_password (generated column) instead.
const IC_COLS = "id, workspace_id, title, username, has_password, url, notes, category, created_at, updated_at";

export function useInternalCredentials(workspaceId: string | undefined) {
  return useQuery({
    queryKey: internalCredentialKeys.list(workspaceId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_credentials")
        .select(IC_COLS)
        .eq("workspace_id", workspaceId!)
        .order("title");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbInternalCredential(row as DbInternalCredentialRow));
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}
