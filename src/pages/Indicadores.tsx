import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Calculator,
  Database,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, Tooltip as RechartsTooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useOKRData } from "@/hooks/useOKRData";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/data";
import type { Tables } from "@/integrations/supabase/types";

type FinancialTransactionRow = Tables<"financial_transactions">;

interface HistoryPoint {
  month: string;
  value: number;
}

interface Benchmark {
  id: string;
  name: string;
  description: string;
  currentValue: number | null;
  benchmarkValue: number;
  unit: string;
  format: "currency" | "percentage" | "number" | "days";
  category: "financial" | "clients" | "operations" | "growth";
  trend: "up" | "down" | "stable";
  isHigherBetter: boolean;
  explanation: string;
  recommendations: string[];
  history: HistoryPoint[];
  isCalculated: boolean;
  calculationError?: string;
}

// KPIs definitions with real data calculation
const calculateKPIs = (
  clients: Client[],
  projects: { status: string }[],
  transactions: FinancialTransactionRow[]
): Benchmark[] => {
  // Filter active clients
  const activeClients = clients.filter(c => c.stage === "cliente");
  
  // Calculate financial metrics
  const totalRevenue = transactions
    .filter(t => t.type === "receita" && t.status === "paid")
    .reduce((sum, t) => sum + (t.value || 0), 0);
  
  // Calculate MRR from recurring transactions
  const recurringTransactions = transactions.filter(t => t.recurrence_type === "mensal" && t.status === "paid");
  const mrr = recurringTransactions.reduce((sum, t) => sum + (t.value || 0), 0);
  
  // ARPC = MRR / Active Clients
  const arpc = activeClients.length > 0 ? mrr / activeClients.length : null;
  
  // Calculate client metrics
  const retentionRate = activeClients.length > 0 
    ? (activeClients.length / Math.max(clients.length, 1)) * 100 
    : null;

  // New clients this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newClientsThisMonth = clients.filter(c => 
    c.created_at && new Date(c.created_at) >= firstDayOfMonth
  ).length;

  const benchmarks: Benchmark[] = [
    // Financial KPIs - Benchmarks conservadores para agência iniciante (< 1 ano)
    {
      id: "mrr",
      name: "MRR (Receita Recorrente Mensal)",
      description: "Receita mensal previsível de contratos recorrentes.",
      currentValue: mrr || null,
      benchmarkValue: 5000, // R$ 5.000/mês é realista para iniciante
      unit: "R$",
      format: "currency",
      category: "financial",
      trend: "up",
      isHigherBetter: true,
      explanation: mrr 
        ? `O MRR atual é de R$ ${mrr.toLocaleString('pt-BR')}. Para uma agência iniciante, o foco é construir base de clientes recorrentes.`
        : "Não há dados suficientes para calcular o MRR. Adicione transações recorrentes.",
      recommendations: mrr ? [
        "Focar em poucos clientes com entrega de qualidade",
        "Buscar contratos de sustentação mesmo que menores",
        "Priorizar relacionamento de longo prazo"
      ] : ["Adicione transações com tipo de recorrência mensal"],
      history: mrr ? [{ month: "Atual", value: mrr }] : [],
      isCalculated: mrr !== null && mrr > 0
    },
    {
      id: "arpc",
      name: "ARPC (Receita Média por Cliente)",
      description: "Valor médio de receita por cliente ativo.",
      currentValue: arpc || null,
      benchmarkValue: 2500, // R$ 2.500/cliente é realista
      unit: "R$",
      format: "currency",
      category: "financial",
      trend: "up",
      isHigherBetter: true,
      explanation: arpc
        ? `A receita média por cliente é R$ ${arpc.toLocaleString('pt-BR')}. Para iniciante, foque em poucos clientes bem atendidos.`
        : "Não há dados suficientes. Adicione clientes e transações.",
      recommendations: arpc ? [
        "Concentre-se em poucos clientes com necessidades maiores",
        "Ofereça pacotes completos de automação",
        "Prefira profundidade com poucos a largura com muitos"
      ] : ["Adicione clientes e transações"],
      history: arpc ? [{ month: "Atual", value: arpc }] : [],
      isCalculated: arpc !== null && arpc > 0
    },
    {
      id: "total-revenue",
      name: "Receita Total",
      description: "Total de receitas registradas no sistema.",
      currentValue: totalRevenue || null,
      benchmarkValue: 20000, // R$ 20.000 total é um bom começo
      unit: "R$",
      format: "currency",
      category: "financial",
      trend: "up",
      isHigherBetter: true,
      explanation: totalRevenue
        ? `Total de receitas: R$ ${totalRevenue.toLocaleString('pt-BR')}. Para uma agência nova, cada real conta!`
        : "Nenhuma receita registrada ainda.",
      recommendations: totalRevenue ? [
        "Registrar todas as receitas para controle",
        "Categorizar receitas por tipo de serviço"
      ] : ["Adicione transações de receita"],
      history: totalRevenue ? [{ month: "Total", value: totalRevenue }] : [],
      isCalculated: totalRevenue !== null && totalRevenue > 0
    },
    // Client KPIs - Benchmarks realistas
    {
      id: "active-clients",
      name: "Clientes Ativos",
      description: "Quantidade de clientes no estágio 'cliente'.",
      currentValue: activeClients.length || null,
      benchmarkValue: 5, // 5 clientes é um bom número para iniciante
      unit: "",
      format: "number",
      category: "clients",
      trend: activeClients.length >= 3 ? "up" : "stable",
      isHigherBetter: true,
      explanation: `${activeClients.length} clientes ativos. Para uma agência nova, ter 3-5 clientes ativos é um bom começo!`,
      recommendations: activeClients.length > 0 ? [
        "Focar em entregar excelência para cada cliente",
        "Buscar indicações dos clientes atuais",
        "Criar cases de sucesso"
      ] : ["Adicione clientes e defina o estágio como 'cliente'"],
      history: [{ month: "Atual", value: activeClients.length }],
      isCalculated: true
    },
    {
      id: "new-clients-month",
      name: "Novos Clientes (Mês)",
      description: "Novos clientes cadastrados este mês.",
      currentValue: newClientsThisMonth || null,
      benchmarkValue: 1, // 1 cliente novo por mês é realista
      unit: "",
      format: "number",
      category: "clients",
      trend: newClientsThisMonth > 0 ? "up" : "stable",
      isHigherBetter: true,
      explanation: `${newClientsThisMonth} novo(s) cliente(s) este mês. Para iniciante, 1-2 clientes novos/mês é um bom ritmo.`,
      recommendations: newClientsThisMonth > 0 ? [
        "Parabéns! Continue investindo em prospecção",
        "Mantenha a qualidade de entrega"
      ] : ["Nenhum cliente novo este mês. Continue prospecionando"] ,
      history: [{ month: "Este Mês", value: newClientsThisMonth }],
      isCalculated: true
    },
    {
      id: "retention-rate",
      name: "Taxa de Retenção",
      description: "Percentual de clientes ativos vs total.",
      currentValue: retentionRate || null,
      benchmarkValue: 80, // 80% é bom para agência nova
      unit: "%",
      format: "percentage",
      category: "clients",
      trend: "stable",
      isHigherBetter: true,
      explanation: retentionRate
        ? `${retentionRate.toFixed(1)}% de taxa de retenção. Para iniciante, o foco é não perder nenhum cliente!`
        : "Dados insuficientes para calcular.",
      recommendations: retentionRate ? [
        "Manter comunicação regular com clientes",
        "Entregar além do esperado",
        "Resolvendo problemas rapidamente"
      ] : [],
      history: retentionRate ? [{ month: "Atual", value: retentionRate }] : [],
      isCalculated: retentionRate !== null
    },
    // Operations KPIs
    {
      id: "total-projects",
      name: "Total de Projetos",
      description: "Quantidade total de projetos no sistema.",
      currentValue: projects.length || null,
      benchmarkValue: 10, // 10 projetos é um bom número
      unit: "",
      format: "number",
      category: "operations",
      trend: projects.length >= 5 ? "up" : "stable",
      isHigherBetter: true,
      explanation: `${projects.length} projetos cadastrados. Para iniciante, foco em concluir projetos com qualidade.`,
      recommendations: projects.length > 0 ? [
        "Acompanhar progresso dos projetos",
        "Registrar conclusão de projetos"
      ] : ["Adicione projetos para começar"],
      history: [{ month: "Total", value: projects.length }],
      isCalculated: true
    },
    {
      id: "projects-in-progress",
      name: "Projetos em Andamento",
      description: "Projetos com status 'in_progress'.",
      currentValue: projects.filter(p => p.status === "in_progress").length || null,
      benchmarkValue: 3, // 3 projetos simultâneos é razoável
      unit: "",
      format: "number",
      category: "operations",
      trend: "stable",
      isHigherBetter: true,
      explanation: `${projects.filter(p => p.status === "in_progress").length} projetos em andamento. Para iniciante, foque em não sobrecarregar.`,
      recommendations: [
        "Manter foco em poucos projetos",
        "Entregar com qualidade antes de pegar mais"
      ],
      history: [{ month: "Atual", value: projects.filter(p => p.status === "in_progress").length }],
      isCalculated: true
    }
  ];

  return benchmarks;
};

const formatValue = (value: number | null, format: Benchmark["format"], unit: string): string => {
  if (value === null || value === undefined) return "N/A";
  
  switch (format) {
    case "currency":
      return `R$ ${value.toLocaleString("pt-BR")}`;
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "days":
      return `${value} ${unit}`;
    case "number":
    default:
      return unit ? `${value}${unit}` : value.toString();
  }
};

const getPerformanceStatus = (benchmark: Benchmark): "excellent" | "good" | "warning" | "critical" | "no-data" => {
  if (!benchmark.isCalculated || benchmark.currentValue === null) {
    return "no-data";
  }
  
  const ratio = benchmark.currentValue / benchmark.benchmarkValue;
  
  if (benchmark.isHigherBetter) {
    if (ratio >= 1.1) return "excellent";
    if (ratio >= 0.9) return "good";
    if (ratio >= 0.7) return "warning";
    return "critical";
  } else {
    if (ratio <= 0.9) return "excellent";
    if (ratio <= 1.1) return "good";
    if (ratio <= 1.3) return "warning";
    return "critical";
  }
};

const getStatusColor = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "text-emerald-500";
    case "good": return "text-primary";
    case "warning": return "text-amber-500";
    case "critical": return "text-red-500";
    case "no-data": return "text-muted-foreground";
  }
};

const getStatusBg = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "bg-emerald-500/10 border-emerald-500/20";
    case "good": return "bg-primary/10 border-blue-500/20";
    case "warning": return "bg-amber-500/10 border-amber-500/20";
    case "critical": return "bg-red-500/10 border-red-500/20";
    case "no-data": return "bg-muted/20 border-muted/20";
  }
};

const getProgressColor = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "bg-emerald-500";
    case "good": return "bg-primary";
    case "warning": return "bg-amber-500";
    case "critical": return "bg-red-500";
    case "no-data": return "bg-muted";
  }
};

const getChartColor = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "#10b981";
    case "good": return "#3b82f6";
    case "warning": return "#f59e0b";
    case "critical": return "#ef4444";
    case "no-data": return "#6b7280";
  }
};

const getCategoryIcon = (category: Benchmark["category"]) => {
  switch (category) {
    case "financial": return <DollarSign className="h-4 w-4" />;
    case "clients": return <Users className="h-4 w-4" />;
    case "operations": return <Activity className="h-4 w-4" />;
    case "growth": return <TrendingUp className="h-4 w-4" />;
  }
};


function BenchmarkCard({ benchmark, onClick }: { benchmark: Benchmark; onClick: () => void }) {
  const status = getPerformanceStatus(benchmark);
  const progressValue = benchmark.isCalculated && benchmark.currentValue !== null
    ? benchmark.isHigherBetter 
      ? Math.min((benchmark.currentValue / benchmark.benchmarkValue) * 100, 120)
      : Math.min((benchmark.benchmarkValue / benchmark.currentValue) * 100, 120)
    : 0;

  return (
    <Card 
      className={cn(
        "border-2 transition-all duration-300 hover:shadow-md cursor-pointer hover:scale-[1.01]",
        getStatusBg(status),
        status === "no-data" && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                getStatusBg(status)
              )}>
                <span className={getStatusColor(status)}>
                  {getCategoryIcon(benchmark.category)}
                </span>
              </div>
              <CardTitle className="text-base font-semibold">{benchmark.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {status !== "no-data" && benchmark.trend === "up" && <TrendingUp className="h-5 w-5 text-emerald-500" />}
            {status !== "no-data" && benchmark.trend === "down" && <TrendingDown className="h-5 w-5 text-red-500" />}
            {status !== "no-data" && benchmark.trend === "stable" && <Activity className="h-5 w-5 text-muted-foreground" />}
            {status === "no-data" && <AlertCircle className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className={cn("text-xl font-extrabold", getStatusColor(status))}>
                {formatValue(benchmark.currentValue, benchmark.format, benchmark.unit)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Benchmark: {formatValue(benchmark.benchmarkValue, benchmark.format, benchmark.unit)}
              </p>
            </div>
            <Badge variant="outline" className={cn("font-semibold px-3 py-1", getStatusBg(status))}>
              {status === "excellent" && "Excelente"}
              {status === "good" && "Bom"}
              {status === "warning" && "Atenção"}
              {status === "critical" && "Crítico"}
              {status === "no-data" && "Sem Dados"}
            </Badge>
          </div>
          {benchmark.isCalculated && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Progresso vs Benchmark</span>
                <span className="font-bold">{Math.round(Math.min(progressValue, 100))}%</span>
              </div>
              <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-700 rounded-full", getProgressColor(status))}
                  style={{ width: `${Math.min(progressValue, 100)}%` }}
                />
              </div>
            </div>
          )}
          {!benchmark.isCalculated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Aguardando dados...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkDetailDialog({
  benchmark,
  open,
  onOpenChange
}: {
  benchmark: Benchmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { objectives } = useOKRData();

  if (!benchmark) return null;

  const status = getPerformanceStatus(benchmark);
  const chartColor = getChartColor(status);

  // Map benchmark category to OKR categories (multiple possible matches)
  const getCategoryMappings = (benchmarkCategory: string): string[] => {
    const mapping: Record<string, string[]> = {
      'financial': ['revenue', 'efficiency'],
      'clients': ['satisfaction', 'growth'],
      'operations': ['efficiency', 'quality', 'team'],
      'growth': ['growth', 'innovation']
    };
    return mapping[benchmarkCategory] || [benchmarkCategory];
  };

  // Filter OKRs by matching category
  const relatedOKRs = objectives.filter(okr =>
    getCategoryMappings(benchmark.category).includes(okr.category)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={getStatusColor(status)}>
              {getCategoryIcon(benchmark.category)}
            </span>
            {benchmark.name}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6 pt-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Valor Atual</p>
              <p className={cn("text-xl font-bold", getStatusColor(status))}>
                {formatValue(benchmark.currentValue, benchmark.format, benchmark.unit)}
              </p>
              {!benchmark.isCalculated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando dados suficientes para cálculo
                </p>
              )}
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Benchmark</p>
              <p className="text-xl font-bold text-foreground">
                {formatValue(benchmark.benchmarkValue, benchmark.format, benchmark.unit)}
              </p>
            </div>
          </div>

          {/* Chart */}
          {benchmark.history.length > 0 && (
            <div className="bg-gradient-to-br from-muted/20 to-transparent p-6 rounded-2xl border border-border/30">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-primary" />
                Evolução
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={benchmark.history} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id={`gradient-${benchmark.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
                        <stop offset="50%" stopColor={chartColor} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      width={60}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chartColor}
                      strokeWidth={3}
                      fill={`url(#gradient-${benchmark.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data Source Info */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Fonte de Dados
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {benchmark.explanation}
            </p>
            {!benchmark.isCalculated && (
              <p className="text-sm text-amber-500 mt-2">
                Adicione dados no sistema para calcular este indicador.
              </p>
            )}
          </div>

          {/* Recommendations */}
          {benchmark.isCalculated && benchmark.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recomendações
              </h4>
              <ul className="space-y-2">
                {benchmark.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related OKRs */}
          {relatedOKRs.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                OKRs Relacionados ({relatedOKRs.length})
              </h4>
              <div className="space-y-2">
                {relatedOKRs.map((okr) => (
                  <div key={okr.id} className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{okr.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{okr.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min((okr.current / okr.target) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {okr.current}/{okr.target} {okr.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Estes OKRs podem ajudar a alcançar o objetivo deste indicador.
              </p>
            </div>
          )}

          {relatedOKRs.length === 0 && (
            <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20">
              <p className="text-sm text-muted-foreground text-center">
                Nenhum OKR relacionado a esta categoria ainda.
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Crie OKRs para estruturar seus objetivos nesta área.
              </p>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ElementType;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const VALID_INDICATOR_TABS = ["all", "financial", "clients", "operations"];

export default function Indicadores() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = VALID_INDICATOR_TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "all";

  function handleTabChange(value: string) {
    setSearchParams({ tab: value }, { replace: true });
  }
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransactionRow[]>([]);
  
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await supabase
          .from('financial_transactions')
          .select('*')
          .order('created_at', { ascending: false });
        setTransactions(data || []);
      } catch (error) {
        logger.error('Error fetching transactions:', error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const benchmarks = useMemo(() => {
    return calculateKPIs(clients, projects, transactions);
  }, [clients, projects, transactions]);

  const filteredBenchmarks = activeTab === "all" 
    ? benchmarks 
    : benchmarks.filter(b => b.category === activeTab);

  const excellentCount = benchmarks.filter(b => getPerformanceStatus(b) === "excellent").length;
  const goodCount = benchmarks.filter(b => getPerformanceStatus(b) === "good").length;
  const warningCount = benchmarks.filter(b => getPerformanceStatus(b) === "warning").length;
  const criticalCount = benchmarks.filter(b => getPerformanceStatus(b) === "critical").length;
  const noDataCount = benchmarks.filter(b => getPerformanceStatus(b) === "no-data").length;
  const calculatedCount = benchmarks.filter(b => b.isCalculated).length;

  const overallScore = calculatedCount > 0
    ? Math.round(
        ((excellentCount * 100 + goodCount * 75 + warningCount * 50 + criticalCount * 25) / calculatedCount)
      )
    : 0;

  const handleCardClick = (benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={BarChart3}
          title="Indicadores"
          subtitle={`KPIs calculados • ${calculatedCount}/${benchmarks.length} disponíveis`}
          kpi={{
            label: "Score geral",
            value: overallScore > 0 ? `${overallScore}%` : "—",
            icon: Award,
          }}
        />
        {noDataCount > 0 && (
          <div className="text-sm text-amber-600 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-4 w-4" />
            {noDataCount} indicadores aguardando dados para cálculo
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Score Geral"
            value={overallScore > 0 ? `${overallScore}%` : "N/A"}
            subtitle={calculatedCount > 0 ? "média dos indicadores" : "aguarde dados"}
            icon={Award}
            trend={overallScore >= 75 ? "up" : overallScore > 0 ? "down" : undefined}
          />
          <SummaryCard
            title="Indicadores OK"
            value={`${excellentCount + goodCount}/${calculatedCount}`}
            subtitle="dentro do benchmark"
            icon={CheckCircle2}
            trend="up"
          />
          <SummaryCard
            title="Requerem Atenção"
            value={`${warningCount + criticalCount}`}
            subtitle="indicadores abaixo do ideal"
            icon={AlertTriangle}
            trend={warningCount + criticalCount > 3 ? "down" : "up"}
          />
          <SummaryCard
            title="Dados Processados"
            value={`${calculatedCount}/${benchmarks.length}`}
            subtitle=" KPIs calculados"
            icon={Calculator}
          />
        </div>

        {/* Tabs and Benchmarks */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-2">
              <PieChart className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <Activity className="h-4 w-4" />
              Operações
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredBenchmarks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBenchmarks.map(benchmark => (
                  <BenchmarkCard 
                    key={benchmark.id} 
                    benchmark={benchmark} 
                    onClick={() => handleCardClick(benchmark)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum indicador disponível nesta categoria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legenda de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm">Excelente: &gt;10% acima do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm">Bom: dentro de ±10% do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm">Atenção: 10-30% abaixo do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Crítico: &gt;30% abaixo do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-sm">Sem Dados: aguardando informações</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <BenchmarkDetailDialog 
        benchmark={selectedBenchmark}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
