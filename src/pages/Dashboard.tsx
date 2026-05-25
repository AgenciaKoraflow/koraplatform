import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCardWithChart } from "@/components/dashboard/StatCardWithChart";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  CheckSquare,
  FileSignature,
  AlertTriangle,
  Clock,
  Calendar,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isBefore, isAfter, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useAllContracts } from "@/hooks/useContracts";
import { useOKRData } from "@/hooks/useOKRData";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type FinancialTransaction = Tables<"financial_transactions">;

const PIPELINE_STAGES = [
  { id: "prospeccao", label: "Prospecção", color: "bg-slate-400" },
  { id: "qualificacao", label: "Qualificação", color: "bg-blue-500" },
  { id: "proposta", label: "Proposta", color: "bg-violet-500" },
  { id: "negociacao", label: "Negociação", color: "bg-amber-500" },
  { id: "cliente", label: "Cliente", color: "bg-emerald-500" },
] as const;

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `R$ ${value.toFixed(0)}`;
}

function buildLast6Months(transactions: FinancialTransaction[]) {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(today, 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthLabel = format(date, "MMM/yy", { locale: ptBR });

    const receita = transactions
      .filter(t => {
        if (t.type !== "receita" || t.status !== "pago" || !t.paid_date) return false;
        const d = new Date(t.paid_date);
        return d >= start && d <= end;
      })
      .reduce((s, t) => s + (t.value || 0), 0);

    const despesa = transactions
      .filter(t => {
        if (t.type !== "despesa" || t.status !== "pago" || !t.paid_date) return false;
        const d = new Date(t.paid_date);
        return d >= start && d <= end;
      })
      .reduce((s, t) => s + (t.value || 0), 0);

    return { month: monthLabel, receita, despesa };
  });
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: contracts = [] } = useAllContracts();
  const { objectives } = useOKRData();

  useEffect(() => {
    supabase
      .from("financial_transactions")
      .select("*")
      .then(({ data }) => {
        setTransactions(data || []);
        setTxLoading(false);
      });
  }, []);

  const today = useMemo(() => new Date(), []);
  const startOfCurrentMonth = useMemo(() => startOfMonth(today), [today]);

  // Financial KPIs
  const receitaMes = useMemo(
    () =>
      transactions
        .filter(
          t =>
            t.type === "receita" &&
            t.status === "pago" &&
            t.paid_date &&
            new Date(t.paid_date) >= startOfCurrentMonth,
        )
        .reduce((s, t) => s + (t.value || 0), 0),
    [transactions, startOfCurrentMonth],
  );

  const despesaMes = useMemo(
    () =>
      transactions
        .filter(
          t =>
            t.type === "despesa" &&
            t.status === "pago" &&
            t.paid_date &&
            new Date(t.paid_date) >= startOfCurrentMonth,
        )
        .reduce((s, t) => s + (t.value || 0), 0),
    [transactions, startOfCurrentMonth],
  );

  const mrr = useMemo(
    () =>
      transactions
        .filter(t => t.recurrence_type === "mensal" && t.status === "pago")
        .reduce((s, t) => s + (t.value || 0), 0),
    [transactions],
  );

  const pendencias = useMemo(
    () =>
      transactions
        .filter(t => t.status === "pendente" || t.status === "atrasado")
        .reduce((s, t) => s + (t.value || 0), 0),
    [transactions],
  );

  const resultadoMes = receitaMes - despesaMes;

  // Operational KPIs
  const clientesAtivos = useMemo(() => clients.filter(c => c.stage === "cliente").length, [clients]);
  const projetosEmAndamento = useMemo(() => projects.filter(p => p.status === "in_progress").length, [projects]);
  const tarefasAbertas = useMemo(() => tasks.filter(t => t.status !== "done").length, [tasks]);
  const contratosAguardando = useMemo(
    () =>
      contracts.filter(
        c => c.status === "awaiting_koraflow_signature" || c.status === "awaiting_client_signature",
      ).length,
    [contracts],
  );

  // Chart data
  const chartData = useMemo(() => buildLast6Months(transactions), [transactions]);

  // Pipeline summary
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clients) counts[c.stage] = (counts[c.stage] || 0) + 1;
    return counts;
  }, [clients]);

  const maxPipelineCount = useMemo(
    () => Math.max(...PIPELINE_STAGES.map(s => pipelineCounts[s.id] || 0), 1),
    [pipelineCounts],
  );

  // Alerts
  const tarefasAtrasadas = useMemo(
    () => tasks.filter(t => t.status !== "done" && t.dueDate && isBefore(new Date(t.dueDate), today)),
    [tasks, today],
  );

  const faturasAtrasadas = useMemo(
    () => transactions.filter(t => t.status === "atrasado"),
    [transactions],
  );

  const projetosAtrasados = useMemo(
    () =>
      projects.filter(
        p => p.status === "in_progress" && p.dueDate && isBefore(new Date(p.dueDate), today),
      ),
    [projects, today],
  );

  // Upcoming tasks (next 7 days)
  const next7Days = useMemo(() => addDays(today, 7), [today]);
  const proximasTarefas = useMemo(
    () =>
      tasks
        .filter(
          t =>
            t.status !== "done" &&
            t.dueDate &&
            isAfter(new Date(t.dueDate), today) &&
            isBefore(new Date(t.dueDate), next7Days),
        )
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
    [tasks, today, next7Days],
  );

  // OKRs at risk
  const okrsEmRisco = useMemo(
    () => objectives.filter(o => o.status === "at_risk" || o.status === "failed"),
    [objectives],
  );

  const totalAlerts = tarefasAtrasadas.length + faturasAtrasadas.length + projetosAtrasados.length;

  const dateSubtitle = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dateSubtitleCapitalized = dateSubtitle.charAt(0).toUpperCase() + dateSubtitle.slice(1);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          subtitle={dateSubtitleCapitalized}
          kpi={
            totalAlerts > 0
              ? { label: "alertas ativos", value: String(totalAlerts), icon: AlertTriangle, accent: "amber" }
              : undefined
          }
        />

        {/* KPIs Financeiros */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Financeiro
          </p>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCardWithChart
              title="Receita do Mês"
              value={txLoading ? "..." : formatCurrency(receitaMes)}
              icon={DollarSign}
              changeType="positive"
            />
            <StatCardWithChart
              title="MRR"
              value={txLoading ? "..." : formatCurrency(mrr)}
              icon={TrendingUp}
              change="Recorrência mensal"
              changeType="neutral"
            />
            <StatCardWithChart
              title="Resultado do Mês"
              value={txLoading ? "..." : formatCurrency(Math.abs(resultadoMes))}
              icon={resultadoMes >= 0 ? TrendingUp : TrendingDown}
              change={resultadoMes >= 0 ? "Positivo" : "Negativo"}
              changeType={resultadoMes >= 0 ? "positive" : "negative"}
            />
            <StatCardWithChart
              title="Pendências"
              value={txLoading ? "..." : formatCurrency(pendencias)}
              icon={AlertTriangle}
              change="Pendente + atrasado"
              changeType={pendencias > 0 ? "negative" : "positive"}
            />
          </div>
        </div>

        {/* KPIs Operacionais */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Operacional
          </p>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCardWithChart
              title="Clientes Ativos"
              value={clientesAtivos}
              icon={Users}
              changeType="positive"
            />
            <StatCardWithChart
              title="Projetos em Andamento"
              value={projetosEmAndamento}
              icon={FolderKanban}
              changeType="neutral"
            />
            <StatCardWithChart
              title="Tarefas Abertas"
              value={tarefasAbertas}
              icon={CheckSquare}
              change={tarefasAtrasadas.length > 0 ? `${tarefasAtrasadas.length} atrasada(s)` : undefined}
              changeType={tarefasAtrasadas.length > 0 ? "negative" : "neutral"}
            />
            <StatCardWithChart
              title="Contratos Aguardando"
              value={contratosAguardando}
              icon={FileSignature}
              change={contratosAguardando > 0 ? "Assinatura pendente" : "Em dia"}
              changeType={contratosAguardando > 0 ? "negative" : "positive"}
            />
          </div>
        </div>

        {/* Gráfico + Funil */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Receita vs Despesa — Últimos 6 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      width={72}
                      tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "receita" ? "Receita" : "Despesa",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#gradReceita)"
                    />
                    <Area
                      type="monotone"
                      dataKey="despesa"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#gradDespesa)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                  Receita
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-0.5 bg-red-500 rounded" />
                  Despesa
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Funil Comercial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PIPELINE_STAGES.map(stage => {
                const count = pipelineCounts[stage.id] || 0;
                const pct = Math.round((count / maxPipelineCount) * 100);
                return (
                  <div key={stage.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{stage.label}</span>
                      <span className="text-xs font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total no funil</span>
                  <span className="font-semibold">{clients.length} contatos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas + Próximas Tarefas + OKRs */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Alertas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas
                {totalAlerts > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-amber-500 border-amber-500/30 bg-amber-500/10"
                  >
                    {totalAlerts}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {totalAlerts === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta ativo</p>
              ) : (
                <>
                  {tarefasAtrasadas.length > 0 && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <CheckSquare className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-500">
                          {tarefasAtrasadas.length} tarefa(s) atrasada(s)
                        </p>
                        <p className="text-xs text-muted-foreground">Com prazo vencido e não concluídas</p>
                      </div>
                    </div>
                  )}
                  {faturasAtrasadas.length > 0 && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <DollarSign className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-500">
                          {faturasAtrasadas.length} fatura(s) atrasada(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(faturasAtrasadas.reduce((s, t) => s + (t.value || 0), 0))} em
                          atraso
                        </p>
                      </div>
                    </div>
                  )}
                  {projetosAtrasados.length > 0 && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <FolderKanban className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-500">
                          {projetosAtrasados.length} projeto(s) com prazo vencido
                        </p>
                        <p className="text-xs text-muted-foreground">Data de entrega ultrapassada</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Próximas Tarefas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próximas Tarefas
                <span className="ml-auto text-xs text-muted-foreground font-normal">7 dias</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {proximasTarefas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tarefa nos próximos 7 dias
                </p>
              ) : (
                proximasTarefas.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 py-2 border-b border-border last:border-0"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), "dd/MM", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs flex-shrink-0",
                        task.priority === "high"
                          ? "border-red-500/30 text-red-500 bg-red-500/10"
                          : task.priority === "medium"
                            ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                            : "border-muted text-muted-foreground",
                      )}
                    >
                      {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* OKRs em Risco */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                OKRs em Risco
                {okrsEmRisco.length > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-red-500 border-red-500/30 bg-red-500/10"
                  >
                    {okrsEmRisco.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {okrsEmRisco.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum OKR em risco</p>
              ) : (
                okrsEmRisco.slice(0, 4).map(okr => {
                  const progress = okr.target > 0 ? Math.min((okr.current / okr.target) * 100, 100) : 0;
                  return (
                    <div key={okr.id} className="py-2 border-b border-border last:border-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-medium truncate flex-1">{okr.title}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs flex-shrink-0",
                            okr.status === "failed"
                              ? "border-red-500/30 text-red-500 bg-red-500/10"
                              : "border-amber-500/30 text-amber-500 bg-amber-500/10",
                          )}
                        >
                          {okr.status === "failed" ? "Falhou" : "Em Risco"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              okr.status === "failed" ? "bg-red-500" : "bg-amber-500",
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {okr.current}/{okr.target} {okr.unit}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {okrsEmRisco.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{okrsEmRisco.length - 4} outros
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
