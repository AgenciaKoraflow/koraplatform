import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InternalWorkspace } from "@/types/data";
import { internalWorkspaceKeys } from "@/hooks/useInternalWorkspace";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useInternalWorkspaceMutations() {
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InternalWorkspace> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.name !== undefined) dbData.name = data.name;
      if (data.slug !== undefined) dbData.slug = data.slug ?? null;
      if (data.logoUrl !== undefined) dbData.logo_url = data.logoUrl ?? null;
      if (data.description !== undefined) dbData.description = data.description ?? null;
      if (Object.keys(dbData).length === 0) return;
      const { error } = await supabase.from("internal_workspace").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: internalWorkspaceKeys.all });
      toast.success("Workspace atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar workspace: ${errMsg(error)}`),
  });

  return {
    updateWorkspace: (id: string, data: Partial<InternalWorkspace>) =>
      updateMutation.mutate({ id, data }),
    isUpdating: updateMutation.isPending,
  };
}
