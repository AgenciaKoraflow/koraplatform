import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, FileSignature, TrendingUp, Target, FolderKanban, CheckCircle2, AlertTriangle, ListChecks } from "lucide-react";
import { useAllClients } from "@/hooks/useClients";
import { useAllContracts } from "@/hooks/useContracts";
import { useAllProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useFinancial } from "@/hooks/useFinancial";
import { useOKRData } from "@/hooks/useOKRData";
import { parseCurrencyToNumber, formatCurrency } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS } from "@/types/okr";
import { cn } from "@/lib/utils";

const PIPELINE_STAGES = [
  { key: "prospeccao", label: "Prospecção", color: "bg-slate-400" },
  { key: "qualificacao", label: "Qualificação", color: "bg-blue-400" },
  { key: "proposta", label: "Proposta", color: "bg-amber-400" },
  { key: "negociacao", label: "Negociação", color: "bg-orange-500" },
  { key: "cliente", label: "Ativo", color: "bg-emerald-500" },
];

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  review: "Em revisão",
  done: "Concluído",
  blocked: "Bloqueado",
  client_review: "Revisão cliente",
};

function parsePtBrDate(s: string): Date | null {
  const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "primary" | "emerald" | "amber" | "blue";
}) {
  const accentClass = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    blue: "text-blue-500 bg-blue-500/10",
  }[accent];

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accentClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function EmpresaGeral() {
  const navigate = useNavigate();
  const { data: allClients = [] } = useAllClients();
  const { data: allContracts = [] } = useAllContracts();
  const { data: allProjects = [] } = useAllProjects();
  const { data: allTasks = [] } = useAllTasks();
  const { transactions, loading: financialLoading } = useFinancial();
  const { objectives, loading: okrLoading } = useOKRData();

  const metrics = useMemo(() => {
    const mrr = transactions
      .filter(t => t.isRecurring && t.type === "receita" && t.status === "pago")
      .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

    const activeClients = allClients.filter(c => c.stage === "cliente").length;
    const signedContracts = allContracts.filter(c => c.status === "signed").length;
    const activeProjects = allProjects.filter(p => p.status === "in_progress").length;
    const openTasks = allTasks.filter(t => t.status !== "done").length;

    const okrOnTrack = objectives.filter(o => o.status === "on_track" || o.status === "completed").length;
    const avgOKRProgress = objectives.length > 0
      ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length)
      : 0;
    const atRiskOKRs = objectives.filter(o => o.status === "at_risk" || o.status === "failed");
    const activeObjectives = objectives.filter(o => o.status !== "completed" && o.status !== "failed");

    const pipelineCounts = PIPELINE_STAGES.map(s => ({
      ...s,
      count: allClients.filter(c => c.stage === s.key).length,
    }));
    const pipelineTotal = pipelineCounts.reduce((sum, s) => sum + s.count, 0);

    const now = Date.now();
    const expiringContracts = allContracts.filter(c => {
      if (c.status !== "signed") return false;
      const d = parsePtBrDate(c.expiresAt);
      if (!d) return false;
      return d.getTime() > now && d.getTime() < now + 30 * 86_400_000;
    });

    const blockedTasks = allTasks.filter(t => t.status === "blocked");
    const overdueTransactions = transactions.filter(t => t.status === "atrasado");
    const riskyProjects = allProjects
      .filter(p => p.status === "in_progress" && p.progress < 30)
      .slice(0, 5);
    const criticalTasks = allTasks
      .filter(t => {
        if (t.priority !== "high" || t.status === "done") return false;
        const due = parsePtBrDate(t.dueDate);
        if (!due) return false;
        const daysLeft = (due.getTime() - now) / 86_400_000;
        return daysLeft <= 5;
      })
      .slice(0, 5);

    return {
      mrr, activeClients, signedContracts, activeProjects, openTasks,
      okrOnTrack, avgOKRProgress, atRiskOKRs, activeObjectives,
      pipelineCounts, pipelineTotal,
      expiringContracts, blockedTasks, overdueTransactions,
      riskyProjects, criticalTasks,
    };
  }, [allClients, allContracts, allProjects, allTasks, transactions, objectives]);

  if (financialLoading || okrLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted animate-pulse rounded-xl h-24" />
          ))}
        </div>
        <div className="bg-muted animate-pulse rounded-xl h-20" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-muted animate-pulse rounded-xl h-56" />
          <div className="bg-muted animate-pulse rounded-xl h-56" />
        </div>
      </div>
    );
  }

  const allAlerts = [
    { label: "Contratos expirando (30d)", count: metrics.expiringContracts.length, colorClass: "bg-orange-500" },
    { label: "Tarefas bloqueadas", count: metrics.blockedTasks.length, colorClass: "bg-red-500" },
    { label: "Pagamentos atrasados", count: metrics.overdueTransactions.length, colorClass: "bg-red-500" },
    { label: "OKRs em risco", count: metrics.atRiskOKRs.length, colorClass: "bg-yellow-500" },
  ].filter(a => a.count > 0);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="MRR" value={formatCurrency(metrics.mrr)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Clientes Ativos" value={metrics.activeClients} icon={Heart} accent="primary" />
        <StatCard label="Contratos Vigentes" value={metrics.signedContracts} icon={FileSignature} accent="blue" />
        <StatCard label="Projetos Ativos" value={metrics.activeProjects} icon={FolderKanban} accent="amber" />
        <StatCard label="Tarefas em Aberto" value={metrics.openTasks} icon={ListChecks} accent="amber" />
        <StatCard label="OKRs no Prazo" value={metrics.okrOnTrack} icon={Target} accent="emerald" />
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Pipeline de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.pipelineTotal === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente no pipeline</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3">
                {metrics.pipelineCounts.map(s => s.count > 0 && (
                  <div
                    key={s.key}
                    className={cn("h-full transition-all", s.color)}
                    style={{ width: `${(s.count / metrics.pipelineTotal) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {metrics.pipelineCounts.map(s => (
                  <div key={s.key} className="flex items-center gap-1.5 text-sm">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.color)} />
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* OKR Snapshot + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Objetivos da Empresa (OKR)</CardTitle>
              {objectives.length > 0 && (
                <Badge variant="secondary">{metrics.avgOKRProgress}% média</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {objectives.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum OKR cadastrado. Acesse a aba OKR para começar.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">Total: <strong className="text-foreground">{objectives.length}</strong></span>
                  <span className="text-emerald-600">No prazo: <strong>{metrics.okrOnTrack}</strong></span>
                  <span className="text-amber-600">Em risco: <strong>{metrics.atRiskOKRs.length}</strong></span>
                </div>
                <Progress value={metrics.avgOKRProgress} className="h-2" />
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {metrics.activeObjectives.map(o => (
                    <div key={o.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{o.title}</p>
                        <Progress value={Math.min(100, o.progress)} className="h-1 mt-1" />
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                        {CATEGORY_LABELS[o.category]}
                      </Badge>
                      <span
                        className={cn("w-2.5 h-2.5 rounded-full shrink-0", STATUS_COLORS[o.status])}
                        title={STATUS_LABELS[o.status]}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-foreground/70 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allAlerts.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-600 py-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Tudo em ordem</span>
              </div>
            ) : (
              <div className="space-y-3">
                {allAlerts.map(alert => (
                  <div key={alert.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", alert.colorClass)} />
                      <span className="text-muted-foreground">{alert.label}</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold shrink-0">{alert.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risky Projects + Critical Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Projetos em Atenção</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.riskyProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto com progresso baixo</p>
            ) : (
              <div className="space-y-3">
                {metrics.riskyProjects.map(p => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium truncate max-w-[60%]">{p.name}</span>
                      <span className="text-muted-foreground text-xs shrink-0">{p.progress}% · {p.dueDate}</span>
                    </div>
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Tarefas Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.criticalTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa de alta prioridade pendente</p>
            ) : (
              <div className="space-y-2">
                {metrics.criticalTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/tarefas?task=${t.id}`)}
                    className="w-full flex items-center justify-between gap-2 py-1.5 border-b border-border/30 last:border-0 text-left hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  >
                    <span className="text-sm truncate flex-1">{t.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs">{TASK_STATUS_LABELS[t.status] ?? t.status}</Badge>
                      {t.dueDate && <span className="text-xs text-muted-foreground hidden sm:inline">{t.dueDate}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
