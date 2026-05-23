import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  return useQuery({
    queryKey: ticketKeys.list({ page, pageSize, search, status, clientId }),
    queryFn: async () => {
      let query = supabase.from("support_tickets").select("*", { count: "exact" });
      if (status) query = query.eq("status", status);
      if (clientId) query = query.eq("client_id", clientId);
      if (search) {
        const safe = search.replace(/[,()'"`;\\]/g, "").trim().substring(0, 50);
        if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      query = query.range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return {
        tickets: (data ?? []).map((row) => mapDbTicket(row as DbSupportTicketRow)),
        total: count ?? 0,
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
      const { data, error } = await supabase.from("support_tickets").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbTicket(row as DbSupportTicketRow));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Tickets belonging to a specific client — for detail modals. */
export function useClientTickets(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbTicket(row as DbSupportTicketRow));
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
