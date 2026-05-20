import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { callExternalDb, PaginatedResult } from "@/lib/externalDb";
import { mapDbKnowledge } from "@/lib/mappers";
import type { DbKnowledgeItemRow } from "@/types/db";

export interface KnowledgeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  clientId?: string;
}

export const knowledgeKeys = {
  all: ["knowledge_items"] as const,
  lists: () => [...knowledgeKeys.all, "list"] as const,
  list: (params: KnowledgeListParams) => [...knowledgeKeys.lists(), params] as const,
  allItems: () => [...knowledgeKeys.all, "all-items"] as const,
  byClient: (clientId: string) => [...knowledgeKeys.all, "by-client", clientId] as const,
};

export function useKnowledgeItems(params: KnowledgeListParams = {}) {
  const { page = 0, pageSize = 50, search, category, clientId } = params;

  const filters: Record<string, unknown> = {};
  if (category) filters.category = category;
  if (clientId) filters.client_id = clientId;

  return useQuery({
    queryKey: knowledgeKeys.list({ page, pageSize, search, category, clientId }),
    queryFn: async () => {
      const result = (await callExternalDb(
        "select",
        "knowledge_items",
        undefined,
        undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit: pageSize, offset: page * pageSize, search },
      )) as PaginatedResult<DbKnowledgeItemRow>;
      return {
        items: (result.data ?? []).map(mapDbKnowledge),
        total: result.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Fetches all knowledge items without pagination. */
export function useAllKnowledgeItems() {
  return useQuery({
    queryKey: knowledgeKeys.allItems(),
    queryFn: async () => {
      const data = await callExternalDb("select", "knowledge_items");
      return ((data as DbKnowledgeItemRow[]) ?? []).map(mapDbKnowledge);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Knowledge items belonging to a specific client — for detail modals. */
export function useClientKnowledge(clientId: string | null | undefined) {
  return useQuery({
    queryKey: knowledgeKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const data = await callExternalDb("select", "knowledge_items", undefined, undefined, {
        client_id: clientId,
      });
      return ((data as DbKnowledgeItemRow[]) ?? []).map(mapDbKnowledge);
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
