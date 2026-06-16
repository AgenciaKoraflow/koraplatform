import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FinancialTransaction } from "@/types/financial";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { Tables } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";

type FinancialTransactionRow = Tables<"financial_transactions">;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function toISODate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) return dateString.split("T")[0];
  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

function parseValue(value: string): number {
  return parseCurrencyToNumber(value);
}

function mapDbTransaction(db: FinancialTransactionRow): FinancialTransaction {
  return {
    id: db.id,
    type: db.type as FinancialTransaction["type"],
    category: db.category ?? "",
    description: db.description ?? "",
    value: db.value
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(db.value)
      : "R$ 0,00",
    isRecurring: db.is_recurring,
    recurrenceType: (db.recurrence_type as FinancialTransaction["recurrenceType"]) ?? undefined,
    dueDate: db.due_date ?? undefined,
    dueDay: db.due_day ?? undefined,
    paidDate: db.paid_date ?? undefined,
    status: (db.status as FinancialTransaction["status"]) ?? "pendente",
    clientId: db.client_id ?? undefined,
    projectId: db.project_id ?? undefined,
    notes: db.notes ?? undefined,
    otherCategoryNote: db.other_category_note ?? undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    updatedAt: db.updated_at ? formatDate(db.updated_at) : "",
    installmentCount: db.installment_count ?? undefined,
    firstPaymentDate: db.first_payment_date ?? undefined,
    isIndefinite: db.is_indefinite,
  };
}

export const financialKeys = {
  all: ["financial_transactions"] as const,
};

export function useFinancial() {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: loading } = useQuery({
    queryKey: financialKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapDbTransaction);
    },
    staleTime: 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: financialKeys.all });

  const addMutation = useMutation({
    mutationFn: async (transaction: Omit<FinancialTransaction, "id">): Promise<FinancialTransaction | null> => {
      const dbData = {
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        value: parseValue(transaction.value),
        is_recurring: transaction.isRecurring,
        recurrence_type: transaction.recurrenceType ?? null,
        due_date: toISODate(transaction.dueDate),
        due_day: transaction.dueDay ?? null,
        paid_date: toISODate(transaction.paidDate),
        status: transaction.status,
        client_id: transaction.clientId ?? null,
        project_id: transaction.projectId ?? null,
        notes: transaction.notes ?? null,
        other_category_note: transaction.otherCategoryNote ?? null,
        installment_count: transaction.installmentCount ?? null,
        first_payment_date: toISODate(transaction.firstPaymentDate),
        is_indefinite: transaction.isIndefinite ?? false,
      };

      const { data: result, error } = await supabase
        .from("financial_transactions")
        .insert(dbData)
        .select();

      if (error) throw new Error(error.message);
      return result?.[0] ? mapDbTransaction(result[0]) : null;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transação adicionada com sucesso");
    },
    onError: (error) => {
      logger.error("Error adding transaction:", error instanceof Error ? error : undefined);
      toast.error("Erro ao adicionar transação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: transaction }: { id: string; data: Partial<FinancialTransaction> }) => {
      const dbData: Record<string, unknown> = {};
      if (transaction.type) dbData.type = transaction.type;
      if (transaction.category) dbData.category = transaction.category;
      if (transaction.description) dbData.description = transaction.description;
      if (transaction.value) dbData.value = parseValue(transaction.value);
      if (transaction.isRecurring !== undefined) dbData.is_recurring = transaction.isRecurring;
      if (transaction.recurrenceType !== undefined) dbData.recurrence_type = transaction.recurrenceType ?? null;
      if (transaction.dueDate !== undefined) dbData.due_date = toISODate(transaction.dueDate);
      if (transaction.dueDay !== undefined) dbData.due_day = transaction.dueDay ?? null;
      if (transaction.paidDate !== undefined) dbData.paid_date = toISODate(transaction.paidDate);
      if (transaction.status) dbData.status = transaction.status;
      if (transaction.clientId !== undefined) dbData.client_id = transaction.clientId ?? null;
      if (transaction.projectId !== undefined) dbData.project_id = transaction.projectId ?? null;
      if (transaction.notes !== undefined) dbData.notes = transaction.notes ?? null;
      if (transaction.otherCategoryNote !== undefined) dbData.other_category_note = transaction.otherCategoryNote ?? null;
      if (transaction.installmentCount !== undefined) dbData.installment_count = transaction.installmentCount ?? null;
      if (transaction.firstPaymentDate !== undefined) dbData.first_payment_date = toISODate(transaction.firstPaymentDate);
      if (transaction.isIndefinite !== undefined) dbData.is_indefinite = transaction.isIndefinite;

      const { error } = await supabase
        .from("financial_transactions")
        .update(dbData)
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transação atualizada com sucesso");
    },
    onError: (error) => {
      logger.error("Error updating transaction:", error instanceof Error ? error : undefined);
      toast.error("Erro ao atualizar transação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transação excluída com sucesso");
    },
    onError: (error) => {
      logger.error("Error deleting transaction:", error instanceof Error ? error : undefined);
      toast.error("Erro ao excluir transação");
    },
  });

  return {
    transactions,
    loading,
    addTransaction: async (t: Omit<FinancialTransaction, "id">): Promise<FinancialTransaction | null> => {
      try {
        return await addMutation.mutateAsync(t);
      } catch {
        return null;
      }
    },
    updateTransaction: async (id: string, data: Partial<FinancialTransaction>) => {
      try {
        await updateMutation.mutateAsync({ id, data });
      } catch {
        // error handled in onError
      }
    },
    deleteTransaction: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        // error handled in onError
      }
    },
    refreshTransactions: invalidate,
  };
}
