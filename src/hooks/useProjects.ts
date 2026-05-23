import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  return useQuery({
    queryKey: projectKeys.list({ page, pageSize, search, status, clientId }),
    queryFn: async () => {
      let query = supabase.from("projects").select("*", { count: "exact" });
      if (status) query = query.eq("status", status);
      if (clientId) query = query.eq("client_id", clientId);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        projects: (data ?? []).map((row) => mapDbProject(row as DbProjectRow)),
        total: count ?? 0,
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
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbProject(row as DbProjectRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Projects belonging to a specific client — for detail modals. */
export function useClientProjects(clientId: string | null | undefined) {
  return useQuery({
    queryKey: projectKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbProject(row as DbProjectRow));
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
