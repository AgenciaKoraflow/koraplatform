import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbTicket } from "@/lib/mappers";
import { SupportTicket } from "@/types/data";
import { ticketKeys } from "@/hooks/useTickets";
import type { DbSupportTicketRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useTicketMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (ticket: Omit<SupportTicket, "id">): Promise<SupportTicket> => {
      const dbData = {
        client_id: ticket.clientId,
        project_id:
          ticket.projectIds && ticket.projectIds.length > 0 ? ticket.projectIds[0] : null,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
      };
      const { data: rows, error } = await supabase.from("support_tickets").insert(dbData).select();
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar ticket");
      return mapDbTicket(rows[0] as DbSupportTicketRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
      toast.success("Ticket adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar ticket: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupportTicket> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.clientId) dbData.client_id = data.clientId;
      if (data.projectIds !== undefined)
        dbData.project_id =
          data.projectIds && data.projectIds.length > 0 ? data.projectIds[0] : null;
      if (data.title) dbData.title = data.title;
      if (data.description) dbData.description = data.description;
      if (data.status) dbData.status = data.status;
      if (data.priority) dbData.priority = data.priority;
      const { error } = await supabase.from("support_tickets").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
      toast.success("Ticket atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar ticket: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_tickets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
      toast.success("Ticket excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir ticket: ${errMsg(error)}`),
  });

  return {
    addTicket: (data: Omit<SupportTicket, "id">) =>
      addMutation.mutateAsync(data).catch(() => null as SupportTicket | null),
    updateTicket: (id: string, data: Partial<SupportTicket>) =>
      updateMutation.mutate({ id, data }),
    deleteTicket: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
