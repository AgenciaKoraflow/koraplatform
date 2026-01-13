export interface FinancialTransaction {
  id: string;
  type: "receita" | "despesa";
  category: string;
  description: string;
  value: string;
  isRecurring: boolean;
  recurrenceType?: "mensal" | "trimestral" | "semestral" | "anual";
  dueDate?: string;
  paidDate?: string;
  status: "pendente" | "pago" | "cancelado" | "atrasado";
  clientId?: string;
  projectId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPENSE_CATEGORIES = [
  "Ferramentas",
  "Software/SaaS",
  "Marketing",
  "Infraestrutura",
  "Pessoal",
  "Impostos",
  "Workshops/Cursos",
  "Viagens",
  "Equipamentos",
  "Serviços Terceiros",
  "Outros"
];

export const REVENUE_CATEGORIES = [
  "Projeto",
  "Consultoria",
  "Sustentação",
  "Recorrência",
  "Workshop",
  "Licenciamento",
  "Outros"
];
