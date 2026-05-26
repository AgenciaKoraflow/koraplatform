import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

// Explicit column list — never includes `password` so the encrypted/plaintext
// value never transits to the browser. `has_password` is a generated column
// (GENERATED ALWAYS AS (password IS NOT NULL) STORED) added in migration
// 20260530000000_knowledge_has_password_column.sql.
const KI_COLS =
  "id, client_id, project_ids, project_id, title, category, content, username, has_password, url, tags, created_at, updated_at";

export function useKnowledgeItems(params: KnowledgeListParams = {}) {
  const { page = 0, pageSize = 50, search, category, clientId } = params;

  return useQuery({
    queryKey: knowledgeKeys.list({ page, pageSize, search, category, clientId }),
    queryFn: async () => {
      let query = supabase.from("knowledge_items").select(KI_COLS, { count: "exact" });
      if (category) query = query.eq("category", category);
      if (clientId) query = query.eq("client_id", clientId);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.or(`title.ilike.%${safe}%,content.ilike.%${safe}%`);
      }
      query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        items: (data ?? []).map((row) => mapDbKnowledge(row as DbKnowledgeItemRow)),
        total: count ?? 0,
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
      const { data, error } = await supabase.from("knowledge_items").select(KI_COLS);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbKnowledge(row as DbKnowledgeItemRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Knowledge items belonging to a specific client — for detail modals. */
export function useClientKnowledge(clientId: string | null | undefined) {
  return useQuery({
    queryKey: knowledgeKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_items")
        .select(KI_COLS)
        .eq("client_id", clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbKnowledge(row as DbKnowledgeItemRow));
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
