import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbContract } from "@/lib/mappers";
import type { DbContractRow } from "@/types/db";

export interface ContractListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  clientId?: string;
}

export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (params: ContractListParams) => [...contractKeys.lists(), params] as const,
  allItems: () => [...contractKeys.all, "all-items"] as const,
  byClient: (clientId: string) => [...contractKeys.all, "by-client", clientId] as const,
};

export function useContracts(params: ContractListParams = {}) {
  const { page = 0, pageSize = 50, search, status, clientId } = params;

  return useQuery({
    queryKey: contractKeys.list({ page, pageSize, search, status, clientId }),
    queryFn: async () => {
      let query = supabase.from("contracts").select("*", { count: "exact" });
      if (status) query = query.eq("status", status);
      if (clientId) query = query.eq("client_id", clientId);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.ilike("title", `%${safe}%`);
      }
      query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        contracts: (data ?? []).map((row) => mapDbContract(row as DbContractRow)),
        total: count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Fetches all contracts without pagination — for financial analytics. */
export function useAllContracts() {
  return useQuery({
    queryKey: contractKeys.allItems(),
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbContract(row as DbContractRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Contracts belonging to a specific client — for detail modals. */
export function useClientContracts(clientId: string | null | undefined) {
  return useQuery({
    queryKey: contractKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbContract(row as DbContractRow));
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
