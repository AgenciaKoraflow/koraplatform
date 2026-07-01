import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Hook, CreateHookInput, UpdateHookInput } from "@/types/hooks";
import { toast } from "sonner";

export function useHooksMutations(workspaceId: string) {
  const queryClient = useQueryClient();

  const createHook = useMutation({
    mutationFn: async (input: CreateHookInput) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("hooks")
        .insert({
          workspace_id: workspaceId,
          created_by: user.user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Hook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hooks", workspaceId] });
      toast.success(`Hook "${data.text.substring(0, 30)}..." criado!`);
    },
    onError: (error) => {
      console.error("Error creating hook:", error);
      toast.error("Erro ao criar hook");
    },
  });

  const updateHook = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateHookInput }) => {
      const { data, error } = await supabase
        .from("hooks")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Hook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hooks", workspaceId] });
      toast.success("Hook atualizado!");
    },
    onError: (error) => {
      console.error("Error updating hook:", error);
      toast.error("Erro ao atualizar hook");
    },
  });

  const deleteHook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hooks").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hooks", workspaceId] });
      toast.success("Hook removido!");
    },
    onError: (error) => {
      console.error("Error deleting hook:", error);
      toast.error("Erro ao remover hook");
    },
  });

  const incrementTimesUsed = useMutation({
    mutationFn: async (id: string) => {
      const { data: hook, error: fetchError } = await supabase
        .from("hooks")
        .select("times_used")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("hooks")
        .update({ times_used: (hook.times_used || 0) + 1 })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Hook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hooks", workspaceId] });
    },
  });

  return {
    createHook,
    updateHook,
    deleteHook,
    incrementTimesUsed,
  };
}
