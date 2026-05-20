import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { callExternalDb, PaginatedResult } from "@/lib/externalDb";
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

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (clientId) filters.client_id = clientId;

  return useQuery({
    queryKey: contractKeys.list({ page, pageSize, search, status, clientId }),
    queryFn: async () => {
      const result = (await callExternalDb(
        "select",
        "contracts",
        undefined,
        undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit: pageSize, offset: page * pageSize, search },
      )) as PaginatedResult<DbContractRow>;
      return {
        contracts: (result.data ?? []).map(mapDbContract),
        total: result.total,
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
      const data = await callExternalDb("select", "contracts");
      return ((data as DbContractRow[]) ?? []).map(mapDbContract);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Contracts belonging to a specific client — for detail modals. */
export function useClientContracts(clientId: string | null | undefined) {
  return useQuery({
    queryKey: contractKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const data = await callExternalDb("select", "contracts", undefined, undefined, {
        client_id: clientId,
      });
      return ((data as DbContractRow[]) ?? []).map(mapDbContract);
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
