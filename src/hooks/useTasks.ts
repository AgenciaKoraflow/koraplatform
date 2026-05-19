import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { callExternalDb, PaginatedResult } from "@/lib/externalDb";
import { mapDbTask } from "@/lib/mappers";
import { Task } from "@/types/data";

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

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (clientId) filters.client_id = clientId;
  if (projectId) filters.project_id = projectId;

  return useQuery({
    queryKey: taskKeys.list({ page, pageSize, search, status, priority, clientId, projectId }),
    queryFn: async () => {
      const result = (await callExternalDb(
        "select",
        "tasks",
        undefined,
        undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit: pageSize, offset: page * pageSize, search },
      )) as PaginatedResult<unknown>;
      return {
        tasks: (result.data ?? []).map(mapDbTask),
        total: result.total,
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
      const data = await callExternalDb("select", "tasks");
      return ((data as any[]) ?? []).map(mapDbTask) as Task[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Tasks belonging to a specific client — for detail modals. */
export function useClientTasks(clientId: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const data = await callExternalDb("select", "tasks", undefined, undefined, {
        client_id: clientId,
      });
      return ((data as any[]) ?? []).map(mapDbTask) as Task[];
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
      const data = await callExternalDb("select", "tasks", undefined, undefined, {
        project_id: projectId,
      });
      return ((data as any[]) ?? []).map(mapDbTask) as Task[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
