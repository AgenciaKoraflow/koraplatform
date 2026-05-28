import type { BU } from "./bu";

export type OKRStatus = "not_started" | "in_progress" | "on_track" | "at_risk" | "completed" | "failed";
export type OKRPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

export interface OKRObjective {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  status: OKRStatus;
  startDate: string;
  endDate: string;
  priority: "high" | "medium" | "low";
  category: "revenue" | "growth" | "efficiency" | "quality" | "satisfaction" | "innovation" | "team" | "other";
  bu: BU[];
  progress: number;
  lastUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OKRUpdate {
  id: string;
  objectiveId: string;
  date: string;
  value: number;
  comment: string;
  updatedBy: string;
  createdAt: string;
}

export interface OKRFormData {
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  status: OKRStatus;
  startDate: string;
  endDate: string;
  priority: "high" | "medium" | "low";
  category: "revenue" | "growth" | "efficiency" | "quality" | "satisfaction" | "innovation" | "team" | "other";
  bu: BU[];
}

export const CATEGORY_LABELS: Record<NonNullable<OKRObjective['category']>, string> = {
  revenue: "Receita",
  growth: "Crescimento",
  efficiency: "Eficiência",
  quality: "Qualidade",
  satisfaction: "Satisfação",
  innovation: "Inovação",
  team: "Equipe",
  other: "Outro"
};

export const STATUS_LABELS: Record<OKRStatus, string> = {
  not_started: "Não Iniciado",
  in_progress: "Em Andamento",
  on_track: "No Prazo",
  at_risk: "Em Risco",
  completed: "Concluído",
  failed: "Falhou"
};

export const STATUS_COLORS: Record<OKRStatus, string> = {
  not_started: "bg-gray-500",
  in_progress: "bg-primary",
  on_track: "bg-green-500",
  at_risk: "bg-yellow-500",
  completed: "bg-emerald-600",
  failed: "bg-red-500"
};

export const PRIORITY_LABELS: Record<NonNullable<OKRObjective['priority']>, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa"
};

export const PRIORITY_COLORS: Record<NonNullable<OKRObjective['priority']>, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500"
};

export const CATEGORY_COLORS: Record<NonNullable<OKRObjective['category']>, string> = {
  revenue: "bg-green-500",
  growth: "bg-primary",
  efficiency: "bg-primary",
  quality: "bg-primary",
  satisfaction: "bg-primary",
  innovation: "bg-primary",
  team: "bg-primary",
  other: "bg-gray-500"
};