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

// Strip the encrypted password blob and compute has_password so mapDbKnowledge
// never receives the raw ciphertext (the decryption key is server-side only).
function toDbRow(raw: Record<string, unknown>): DbKnowledgeItemRow {
  const { password, ...rest } = raw;
  return { ...rest, has_password: password !== null && password !== undefined && password !== "" } as DbKnowledgeItemRow;
}

export function useKnowledgeItems(params: KnowledgeListParams = {}) {
  const { page = 0, pageSize = 50, search, category, clientId } = params;

  return useQuery({
    queryKey: knowledgeKeys.list({ page, pageSize, search, category, clientId }),
    queryFn: async () => {
      let query = supabase.from("knowledge_items").select("*", { count: "exact" });
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
        items: (data ?? []).map((row) => mapDbKnowledge(toDbRow(row as Record<string, unknown>))),
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
      const { data, error } = await supabase.from("knowledge_items").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbKnowledge(toDbRow(row as Record<string, unknown>)));
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
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbKnowledge(toDbRow(row as Record<string, unknown>)));
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
