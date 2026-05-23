import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTask } from "@/lib/mappers";
import type { DbTaskRow } from "@/types/db";

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  clientId?: string;
  projectId?: string;
}

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params: TaskListParams) => [...taskKeys.lists(), params] as const,
  allItems: () => [...taskKeys.all, "all-items"] as const,
  byClient: (clientId: string) => [...taskKeys.all, "by-client", clientId] as const,
  byProject: (projectId: string) => [...taskKeys.all, "by-project", projectId] as const,
};

export function useTasks(params: TaskListParams = {}) {
  const { page = 0, pageSize = 50, search, status, priority, clientId, projectId } = params;

  return useQuery({
    queryKey: taskKeys.list({ page, pageSize, search, status, priority, clientId, projectId }),
    queryFn: async () => {
      let query = supabase.from("tasks").select("*", { count: "exact" });
      if (status) query = query.eq("status", status);
      if (priority) query = query.eq("priority", priority);
      if (clientId) query = query.eq("client_id", clientId);
      if (projectId) query = query.eq("project_id", projectId);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        tasks: (data ?? []).map((row) => mapDbTask(row as DbTaskRow)),
        total: count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Fetches all tasks without pagination — for analytics and search. */
export function useAllTasks() {
  return useQuery({
    queryKey: taskKeys.allItems(),
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbTask(row as DbTaskRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Tasks belonging to a specific client — for detail modals. */
export function useClientTasks(clientId: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbTask(row as DbTaskRow));
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Tasks belonging to a specific project — for project detail. */
export function useProjectTasks(projectId: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.byProject(projectId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbTask(row as DbTaskRow));
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
