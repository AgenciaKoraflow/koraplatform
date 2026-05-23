import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbClient, toISODate } from "@/lib/mappers";
import { Client } from "@/types/data";
import { clientKeys } from "@/hooks/useClients";
import { projectKeys } from "@/hooks/useProjects";
import { taskKeys } from "@/hooks/useTasks";
import { contractKeys } from "@/hooks/useContracts";
import { knowledgeKeys } from "@/hooks/useKnowledgeItems";
import { ticketKeys } from "@/hooks/useTickets";
import type { DbClientRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useClientMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (client: Omit<Client, "id">): Promise<Client> => {
      const dbData: Record<string, unknown> = {
        name: client.name.trim(),
        company: client.company.trim(),
        email: client.email?.trim() || null,
        phone: client.phone?.trim() || null,
        pipeline_stage: client.stage,
        notes: client.value?.trim() || null,
      };
      const ann = toISODate(client.anniversary);
      if (ann) dbData.anniversary = ann;
      const prop = toISODate(client.proposalSentDate);
      if (prop) dbData.proposal_sent_date = prop;
      if (client.briefing?.trim()) dbData.briefing = client.briefing.trim();
      if (client.head?.trim()) dbData.head = client.head.trim();
      if (client.bu) dbData.bu = client.bu;
      if (client.logo?.trim()) dbData.logo = client.logo.trim();
      const { data: rows, error } = await supabase.from("clients").insert(dbData).select();
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar cliente");
      return mapDbClient(rows[0] as DbClientRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      toast.success("Cliente adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar cliente: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.name) dbData.name = data.name;
      if (data.company) dbData.company = data.company;
      if (data.email) dbData.email = data.email;
      if (data.phone) dbData.phone = data.phone;
      if (data.stage) dbData.pipeline_stage = data.stage;
      if (data.value) dbData.notes = data.value;
      if (data.anniversary) dbData.anniversary = toISODate(data.anniversary);
      if (data.briefing !== undefined) dbData.briefing = data.briefing || null;
      if (data.proposalSentDate !== undefined)
        dbData.proposal_sent_date = toISODate(data.proposalSentDate);
      if (data.head !== undefined) dbData.head = data.head?.trim() || null;
      if (data.bu !== undefined) dbData.bu = data.bu;
      if (data.logo !== undefined) dbData.logo = data.logo || null;
      const { error } = await supabase.from("clients").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: clientKeys.allItems() });
      const previous = qc.getQueryData<Client[]>(clientKeys.allItems());
      qc.setQueryData<Client[]>(clientKeys.allItems(), (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...data } : c)) ?? []
      );
      return { previous };
    },
    onSuccess: () => toast.success("Cliente atualizado com sucesso"),
    onError: (error, _, context) => {
      if (context?.previous) qc.setQueryData(clientKeys.allItems(), context.previous);
      toast.error(`Erro ao atualizar cliente: ${errMsg(error)}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      [clientKeys.all, projectKeys.all, taskKeys.all, contractKeys.all, knowledgeKeys.all, ticketKeys.all]
        .forEach((key) => qc.invalidateQueries({ queryKey: key }));
      toast.success("Cliente excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir cliente: ${errMsg(error)}`),
  });

  return {
    addClient: (data: Omit<Client, "id">) =>
      addMutation.mutateAsync(data).catch(() => null as Client | null),
    updateClient: async (id: string, data: Partial<Client>): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ id, data });
        return true;
      } catch {
        return false;
      }
    },
    deleteClient: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
