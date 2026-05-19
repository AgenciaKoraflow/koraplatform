import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callExternalDb } from "@/lib/externalDb";
import { mapDbProject, toISODate } from "@/lib/mappers";
import { parseCurrencyToNumber } from "@/lib/currency";
import { Project } from "@/types/data";
import { projectKeys } from "@/hooks/useProjects";
import { taskKeys } from "@/hooks/useTasks";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useProjectMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (project: Omit<Project, "id">): Promise<Project> => {
      const dbData: Record<string, unknown> = {
        client_id: project.clientId,
        name: project.name,
        description: project.description || null,
        status: project.status,
        progress: project.progress || 0,
        end_date: toISODate(project.dueDate),
        billing_type: project.billingType || "projeto",
        type: project.type || "projeto",
        head: project.head || null,
        team: project.team || [],
      };
      if (project.value) dbData.value = parseCurrencyToNumber(project.value);
      if (project.recurrenceValue)
        dbData.recurrence_value = parseCurrencyToNumber(project.recurrenceValue);
      if (project.recurrenceStartDate)
        dbData.recurrence_start_date = toISODate(project.recurrenceStartDate);
      if (project.bu) dbData.bu = project.bu;
      const result = await callExternalDb("insert", "projects", dbData);
      if (!result?.[0]) throw new Error("Resposta vazia ao criar projeto");
      return mapDbProject(result[0]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Projeto adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar projeto: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.clientId) dbData.client_id = data.clientId;
      if (data.name) dbData.name = data.name;
      if (data.description !== undefined) dbData.description = data.description;
      if (data.status) dbData.status = data.status;
      if (data.progress !== undefined) dbData.progress = data.progress;
      if (data.dueDate) dbData.end_date = toISODate(data.dueDate);
      if (data.value !== undefined)
        dbData.value = data.value ? parseCurrencyToNumber(data.value) : null;
      if (data.billingType !== undefined) dbData.billing_type = data.billingType;
      if (data.type !== undefined) dbData.type = data.type;
      if (data.recurrenceValue !== undefined)
        dbData.recurrence_value = data.recurrenceValue
          ? parseCurrencyToNumber(data.recurrenceValue)
          : null;
      if (data.recurrenceStartDate !== undefined)
        dbData.recurrence_start_date = data.recurrenceStartDate
          ? toISODate(data.recurrenceStartDate)
          : null;
      if (data.head !== undefined) dbData.head = data.head || null;
      if (data.team !== undefined) dbData.team = data.team || [];
      if (data.bu !== undefined) dbData.bu = data.bu;
      if (Object.keys(dbData).length === 0) return;
      await callExternalDb("update", "projects", dbData, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Projeto atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar projeto: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callExternalDb("delete", "projects", undefined, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Projeto excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir projeto: ${errMsg(error)}`),
  });

  return {
    addProject: (data: Omit<Project, "id">) =>
      addMutation.mutateAsync(data).catch(() => null as Project | null),
    updateProject: (id: string, data: Partial<Project>) =>
      updateMutation.mutate({ id, data }),
    deleteProject: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
