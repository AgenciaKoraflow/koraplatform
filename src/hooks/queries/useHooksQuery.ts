import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Hook } from "@/types/hooks";

export function useHooks(workspaceId: string) {
  return useQuery({
    queryKey: ["hooks", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hooks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Hook[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAudienceConfig(workspaceId: string) {
  return useQuery({
    queryKey: ["audience-config", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audience_configs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data || null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
