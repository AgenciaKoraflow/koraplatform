import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FinancialTransaction } from "@/types/financial";
import { parseCurrencyToNumber } from "@/lib/currency";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function toISODate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  
  // Check if already in ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.split('T')[0];
  }
  
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  return null;
}

function parseValue(value: string): number {
  return parseCurrencyToNumber(value);
}

function mapDbTransaction(db: any): FinancialTransaction {
  return {
    id: db.id,
    type: db.type,
    category: db.category || '',
    description: db.description || '',
    value: db.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(db.value) : 'R$ 0,00',
    isRecurring: db.is_recurring || false,
    recurrenceType: db.recurrence_type,
    dueDate: db.due_date || undefined,
    paidDate: db.paid_date || undefined,
    status: db.status || 'pendente',
    clientId: db.client_id || undefined,
    projectId: db.project_id || undefined,
    notes: db.notes || undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : '',
    updatedAt: db.updated_at ? formatDate(db.updated_at) : ''
  };
}

export function useFinancial() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransactions((data || []).map(mapDbTransaction));
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const addTransaction = async (transaction: Omit<FinancialTransaction, "id">): Promise<FinancialTransaction | null> => {
    try {
      const dbData = {
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        value: parseValue(transaction.value),
        is_recurring: transaction.isRecurring,
        recurrence_type: transaction.recurrenceType || null,
        due_date: toISODate(transaction.dueDate),
        paid_date: toISODate(transaction.paidDate),
        status: transaction.status,
        client_id: transaction.clientId || null,
        project_id: transaction.projectId || null,
        notes: transaction.notes || null
      };
      
      const { data: result, error } = await supabase
        .from('financial_transactions')
        .insert(dbData)
        .select();
      
      if (error) throw error;
      
      if (result && result[0]) {
        const newTransaction = mapDbTransaction(result[0]);
        setTransactions(prev => [newTransaction, ...prev]);
        toast.success('Transação adicionada com sucesso');
        return newTransaction;
      }
      return null;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao adicionar transação');
      return null;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<FinancialTransaction>) => {
    try {
      const dbData: any = {};
      if (transaction.type) dbData.type = transaction.type;
      if (transaction.category) dbData.category = transaction.category;
      if (transaction.description) dbData.description = transaction.description;
      if (transaction.value) dbData.value = parseValue(transaction.value);
      if (transaction.isRecurring !== undefined) dbData.is_recurring = transaction.isRecurring;
      if (transaction.recurrenceType !== undefined) dbData.recurrence_type = transaction.recurrenceType || null;
      if (transaction.dueDate !== undefined) dbData.due_date = toISODate(transaction.dueDate);
      if (transaction.paidDate !== undefined) dbData.paid_date = toISODate(transaction.paidDate);
      if (transaction.status) dbData.status = transaction.status;
      if (transaction.clientId !== undefined) dbData.client_id = transaction.clientId || null;
      if (transaction.projectId !== undefined) dbData.project_id = transaction.projectId || null;
      if (transaction.notes !== undefined) dbData.notes = transaction.notes || null;
      
      const { error } = await supabase
        .from('financial_transactions')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t));
      toast.success('Transação atualizada com sucesso');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transação excluída com sucesso');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions: loadTransactions
  };
}
