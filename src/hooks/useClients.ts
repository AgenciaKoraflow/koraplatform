import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { callExternalDb, PaginatedResult } from "@/lib/externalDb";
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

  const filters: Record<string, unknown> = {};
  if (stage) filters.pipeline_stage = stage;

  return useQuery({
    queryKey: clientKeys.list({ page, pageSize, search, stage }),
    queryFn: async () => {
      const result = (await callExternalDb(
        "select",
        "clients",
        undefined,
        undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit: pageSize, offset: page * pageSize, search },
      )) as PaginatedResult<DbClientRow>;
      return {
        clients: (result.data ?? []).map(mapDbClient),
        total: result.total,
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
      const data = await callExternalDb("select", "clients");
      return ((data as DbClientRow[]) ?? []).map(mapDbClient);
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
