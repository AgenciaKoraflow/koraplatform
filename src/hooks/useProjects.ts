import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { callExternalDb, PaginatedResult } from "@/lib/externalDb";
import { mapDbProject } from "@/lib/mappers";
import type { DbProjectRow } from "@/types/db";

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  clientId?: string;
}

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: ProjectListParams) => [...projectKeys.lists(), params] as const,
  allItems: () => [...projectKeys.all, "all-items"] as const,
  byClient: (clientId: string) => [...projectKeys.all, "by-client", clientId] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

export function useProjects(params: ProjectListParams = {}) {
  const { page = 0, pageSize = 50, search, status, clientId } = params;

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (clientId) filters.client_id = clientId;

  return useQuery({
    queryKey: projectKeys.list({ page, pageSize, search, status, clientId }),
    queryFn: async () => {
      const result = (await callExternalDb(
        "select",
        "projects",
        undefined,
        undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit: pageSize, offset: page * pageSize, search },
      )) as PaginatedResult<DbProjectRow>;
      return {
        projects: (result.data ?? []).map(mapDbProject),
        total: result.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Fetches all projects without pagination — for dropdowns and analytics. */
export function useAllProjects() {
  return useQuery({
    queryKey: projectKeys.allItems(),
    queryFn: async () => {
      const data = await callExternalDb("select", "projects");
      return ((data as DbProjectRow[]) ?? []).map(mapDbProject);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Projects belonging to a specific client — for detail modals. */
export function useClientProjects(clientId: string | null | undefined) {
  return useQuery({
    queryKey: projectKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const data = await callExternalDb("select", "projects", undefined, undefined, {
        client_id: clientId,
      });
      return ((data as DbProjectRow[]) ?? []).map(mapDbProject);
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
