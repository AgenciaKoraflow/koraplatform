export interface FinancialTransaction {
  id: string;
  type: "receita" | "despesa";
  category: string;
  description: string;
  value: string;
  isRecurring: boolean;
  recurrenceType?: "mensal" | "trimestral" | "semestral" | "anual";
  dueDate?: string;
  dueDay?: number; // Day of month for recurring transactions (1-31)
  paidDate?: string;
  status: "pendente" | "pago" | "cancelado" | "atrasado";
  clientId?: string;
  projectId?: string;
  notes?: string;
  otherCategoryNote?: string; // Note when category is "Outro"
  createdAt: string;
  updatedAt: string;
  // New fields for installment tracking
  installmentCount?: number | null; // null = unlimited/indefinite
  firstPaymentDate?: string;
  isIndefinite?: boolean;
  contractId?: string;
}

export const EXPENSE_CATEGORIES = [
  "Ferramenta",
  "Marketing",
  "Infraestrutura",
  "Contábil",
  "Workshop",
  "Evento",
  "Equipamento",
  "Outro"
];

export const REVENUE_CATEGORIES = [
  "Projeto",
  "Consultoria",
  "Recorrência",
  "Workshop",
  "Licenciamento",
  "Outros"
];
