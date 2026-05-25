import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbService } from "@/lib/mappers";
import type { DbServiceRow } from "@/types/db";

export interface ServiceListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  bu?: string;
  status?: string;
}

export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (params: ServiceListParams) => [...serviceKeys.lists(), params] as const,
  allItems: () => [...serviceKeys.all, "all-items"] as const,
};

export function useServices(params: ServiceListParams = {}) {
  const { page = 0, pageSize = 50, search, bu, status } = params;

  return useQuery({
    queryKey: serviceKeys.list({ page, pageSize, search, bu, status }),
    queryFn: async () => {
      let query = supabase.from("services").select("*", { count: "exact" });
      if (bu) query = query.eq("bu", bu);
      if (status) query = query.eq("status", status);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.or(`name.ilike.%${safe}%,category.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      query = query.order("name").range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        services: (data ?? []).map((row) => mapDbService(row as unknown as DbServiceRow)),
        total: count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAllServices() {
  return useQuery({
    queryKey: serviceKeys.allItems(),
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbService(row as unknown as DbServiceRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}
