import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbClient } from "@/lib/mappers";
import type { DbClientRow } from "@/types/db";

export interface ClientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: string;
}

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params: ClientListParams) => [...clientKeys.lists(), params] as const,
  allItems: () => [...clientKeys.all, "all-items"] as const,
  byClient: (clientId: string) => [...clientKeys.all, "by-client", clientId] as const,
};

export function useClients(params: ClientListParams = {}) {
  const { page = 0, pageSize = 50, search, stage } = params;

  return useQuery({
    queryKey: clientKeys.list({ page, pageSize, search, stage }),
    queryFn: async () => {
      let query = supabase.from("clients").select("*", { count: "exact" });
      if (stage) query = query.eq("pipeline_stage", stage);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.or(`name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`);
      }
      query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        clients: (data ?? []).map((row) => mapDbClient(row as DbClientRow)),
        total: count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Fetches all clients without pagination — for dropdowns and analytics. */
export function useAllClients() {
  return useQuery({
    queryKey: clientKeys.allItems(),
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbClient(row as DbClientRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Related clients for a specific entity ID (reuses all-items cache). */
export function useClientById(id: string | null | undefined) {
  const { data: allClients } = useAllClients();
  if (!id) return undefined;
  return allClients?.find((c) => c.id === id);
}
