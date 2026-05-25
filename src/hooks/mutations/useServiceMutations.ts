import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbService } from "@/lib/mappers";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { Service } from "@/types/data";
import { serviceKeys } from "@/hooks/useServices";
import type { DbServiceRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

type ServiceInput = Omit<Service, "id" | "createdAt" | "updatedAt">;

function toDbData(s: Partial<ServiceInput>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (s.name !== undefined) db.name = s.name;
  if (s.description !== undefined) db.description = s.description || null;
  if (s.category !== undefined) db.category = s.category || null;
  if (s.bu !== undefined) db.bu = s.bu;
  if (s.billingType !== undefined) db.billing_type = s.billingType;
  if (s.priceInitial !== undefined)
    db.price_initial = s.priceInitial ? parseCurrencyToNumber(s.priceInitial) : null;
  if (s.priceBargain !== undefined)
    db.price_bargain = s.priceBargain ? parseCurrencyToNumber(s.priceBargain) : null;
  if (s.recurrencePriceInitial !== undefined)
    db.recurrence_price_initial = s.recurrencePriceInitial ? parseCurrencyToNumber(s.recurrencePriceInitial) : null;
  if (s.recurrencePriceBargain !== undefined)
    db.recurrence_price_bargain = s.recurrencePriceBargain ? parseCurrencyToNumber(s.recurrencePriceBargain) : null;
  if (s.installmentsMax !== undefined) db.installments_max = s.installmentsMax ?? null;
  if (s.status !== undefined) db.status = s.status;
  return db;
}

export function useServiceMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (service: ServiceInput): Promise<Service> => {
      const { data: rows, error } = await supabase
        .from("services")
        .insert(toDbData(service))
        .select();
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar serviço");
      return mapDbService(rows[0] as unknown as DbServiceRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      toast.success("Serviço adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar serviço: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceInput> }) => {
      const db = toDbData(data);
      if (Object.keys(db).length === 0) return;
      const { error } = await supabase.from("services").update(db).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      toast.success("Serviço atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar serviço: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      toast.success("Serviço excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir serviço: ${errMsg(error)}`),
  });

  return {
    addService: (data: ServiceInput) =>
      addMutation.mutateAsync(data).catch(() => null as Service | null),
    updateService: (id: string, data: Partial<ServiceInput>) =>
      updateMutation.mutate({ id, data }),
    deleteService: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
