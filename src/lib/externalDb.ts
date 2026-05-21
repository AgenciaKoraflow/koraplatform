import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseInvokeError } from "@/lib/supabaseFunctions";

export type ExternalDbAction =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "get_password"
  | "migrate_encrypt_passwords";

export type ExternalDbTable =
  | "clients"
  | "projects"
  | "tasks"
  | "contracts"
  | "knowledge_items"
  | "support_tickets";

export interface PaginationParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export async function callExternalDb(
  action: ExternalDbAction,
  table: ExternalDbTable,
  data?: Record<string, unknown>,
  id?: string,
  filters?: Record<string, unknown>,
  pagination?: PaginationParams,
): Promise<unknown> {
  const body: Record<string, unknown> = { action, table };
  if (data !== undefined) body.data = data;
  if (id !== undefined) body.id = id;
  if (filters !== undefined) body.filters = filters;
  if (pagination) {
    if (pagination.limit !== undefined) body.limit = pagination.limit;
    if (pagination.offset !== undefined) body.offset = pagination.offset;
    if (pagination.orderBy) body.order_by = pagination.orderBy;
    if (pagination.orderDir) body.order_dir = pagination.orderDir;
    if (pagination.search) body.search = pagination.search;
  }

  const { data: result, error } = await supabase.functions.invoke("external-db", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    const message = await formatSupabaseInvokeError(error);
    throw new Error(message);
  }

  if (result?.error) {
    const msg =
      typeof result.error === "string" ? result.error : JSON.stringify(result.error);
    throw new Error(msg);
  }

  if (pagination?.limit !== undefined) {
    return { data: result?.data ?? [], total: result?.total ?? 0 } as PaginatedResult<unknown>;
  }

  return result?.data ?? null;
}
