import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mapDbClientInteraction } from "@/lib/mappers";
import type { DbClientInteractionRow } from "@/types/db";
import type { ClientInteraction } from "@/types/data";
import { toast } from "sonner";

// client_interactions is not in the generated database types yet
const db = supabase as unknown as SupabaseClient;

export const clientInteractionKeys = {
  all: ["client_interactions"] as const,
  byClient: (clientId: string) => [...clientInteractionKeys.all, clientId] as const,
};

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

/** Timeline of a client (meetings, deliveries, notes), newest first. */
export function useClientInteractions(clientId: string | null | undefined) {
  return useQuery({
    queryKey: clientInteractionKeys.byClient(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await db
        .from("client_interactions")
        .select("*")
        .eq("client_id", clientId!)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbClientInteraction(row as DbClientInteractionRow));
    },
    enabled: !!clientId,
  });
}

/** Every interaction, for cross-client indicators. */
export function useAllClientInteractions() {
  return useQuery({
    queryKey: clientInteractionKeys.all,
    queryFn: async () => {
      const { data, error } = await db.from("client_interactions").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapDbClientInteraction(row as DbClientInteractionRow));
    },
  });
}

type InteractionInput = Pick<ClientInteraction, "type" | "title" | "description" | "date">;

export function useClientInteractionMutations(clientId: string | null | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: clientInteractionKeys.all });

  const addMutation = useMutation({
    mutationFn: async ({ input, createdBy }: { input: InteractionInput; createdBy?: string }) => {
      if (!clientId) throw new Error("Cliente não selecionado");
      const { error } = await db.from("client_interactions").insert({
        client_id: clientId,
        type: input.type,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        date: input.date,
        created_by: createdBy ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Interação adicionada com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao adicionar interação: ${errMsg(e)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: InteractionInput }) => {
      const { error } = await db
        .from("client_interactions")
        .update({
          type: input.type,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          date: input.date,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Interação atualizada com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao atualizar interação: ${errMsg(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("client_interactions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Interação removida com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao remover interação: ${errMsg(e)}`),
  });

  return {
    addInteraction: (input: InteractionInput, createdBy?: string) =>
      addMutation.mutateAsync({ input, createdBy }),
    updateInteraction: (id: string, input: InteractionInput) =>
      updateMutation.mutateAsync({ id, input }),
    deleteInteraction: (id: string) => deleteMutation.mutate(id),
    isSaving: addMutation.isPending || updateMutation.isPending,
  };
}
