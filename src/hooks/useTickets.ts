import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { callExternalDb, PaginatedResult } from "@/lib/externalDb";
import { mapDbTicket } from "@/lib/mappers";
import type { DbSupportTicketRow } from "@/types/db";

export interface TicketListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  clientId?: string;
}

export const ticketKeys = {
  all: ["support_tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (params: TicketListParams) => [...ticketKeys.lists(), params] as const,
  allItems: () => [...ticketKeys.all, "all-items"] as const,
  byClient: (clientId: string) => [...ticketKeys.all, "by-client", clientId] as const,
};

export function useTickets(params: TicketListParams = {}) {
  const { page = 0, pageSize = 50, search, status, clientId } = params;

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (clientId) filters.client_id = clientId;

  return useQuery({
    queryKey: ticketKeys.list({ page, pageSize, search, status, clientId }),
    queryFn: async () => {
      const result = (await callExternalDb(
        "select",
        "support_tickets",
        undefined,
        undefined,
        Object.keys(filters).length > 0 ? filters : undefined,
        { limit: pageSize, offset: page * pageSize, search },
      )) as PaginatedResult<DbSupportTicketRow>;
      return {
        tickets: (result.data ?? []).map(mapDbTicket),
        total: result.total,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/** Fetches all tickets without pagination. */
export function useAllTickets() {
  return useQuery({
    queryKey: ticketKeys.allItems(),
    queryFn: async () => {
      const data = await callExternalDb("select", "support_tickets");
      return ((data as DbSupportTicketRow[]) ?? []).map(mapDbTicket);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Tickets belonging to a specific client — for detail modals. */
export function useClientTickets(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const data = await callExternalDb("select", "support_tickets", undefined, undefined, {
        client_id: clientId,
      });
      return ((data as DbSupportTicketRow[]) ?? []).map(mapDbTicket);
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
