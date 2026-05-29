import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Circle, Clock, Eye, Ban, CheckCircle2, Flag,
  Calendar, AlertTriangle, User, Users, Timer, Trash2, Plus, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useInternalTaskSubtasks } from "@/hooks/useInternalTaskSubtasks";
import { useInternalTaskTimeEntries } from "@/hooks/useInternalTaskTimeEntries";
import { useInternalSubtaskMutations } from "@/hooks/mutations/useInternalSubtaskMutations";
import { useInternalTimeEntryMutations } from "@/hooks/mutations/useInternalTimeEntryMutations";
import type { InternalTask } from "@/types/data";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  todo: { label: "A Fazer", icon: Circle, color: "text-slate-400" },
  in_progress: { label: "Em Andamento", icon: Clock, color: "text-primary" },
  blocked: { label: "Em Impedimento", icon: Ban, color: "text-red-400" },
  review: { label: "Em Validação Interna", icon: Eye, color: "text-amber-400" },
  done: { label: "Concluído", icon: CheckCircle2, color: "text-green-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  medium: { label: "Média", color: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  high: { label: "Alta", color: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

function formatDisplayDate(iso: string | undefined): string {
  if (!iso) return "";
  if (iso.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)) return iso;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    if (!isNaN(d.getTime())) return format(d, "dd/MM/yyyy");
  }
  return iso;
}

function getDeadlineStatus(dueDate: string | undefined, status: string): { label: string; color: string } | null {
  if (!dueDate || status === "done") return null;

  let parsed: Date | null = null;
  const dd = parse(dueDate, "dd/MM/yyyy", new Date());
  if (isValid(dd)) parsed = dd;
  if (!parsed) { const iso = parse(dueDate.substring(0, 10), "yyyy-MM-dd", new Date()); if (isValid(iso)) parsed = iso; }
  if (!parsed) return null;

  const today = new Date(); today.setHours(0, 0, 0, 0); parsed.setHours(0, 0, 0, 0);
  const days = differenceInDays(parsed, today);

  if (days < 0) return { label: `${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""} atrasado`, color: "text-red-500" };
  if (days === 0) return { label: "Vence hoje", color: "text-amber-500" };
  if (days <= 3) return { label: `${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}`, color: "text-amber-500" };
  return { label: `${days} dias restantes`, color: "text-green-500" };
}

interface Props {
  task: InternalTask | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: InternalTask) => void;
  profileName: (id?: string) => string | null;
}

export function InternalTaskDetailSheet({ task, open, onClose, onEdit, profileName }: Props) {
  const { user, profile } = useAuth();
  const authorName = profile?.full_name || user?.email || "Usuário";

  const { data: subtasks = [] } = useInternalTaskSubtasks(task?.id);
  const { data: timeEntries = [] } = useInternalTaskTimeEntries(task?.id);

  const totalHours = useMemo(
    () => timeEntries.reduce((s, e) => s + e.hours, 0),
    [timeEntries],
  );

  const { addSubtask, toggleSubtask, deleteSubtask, isAdding: isAddingSubtask } =
    useInternalSubtaskMutations(task?.id ?? "");
  const { addEntry, deleteEntry, isAdding: isAddingEntry } =
    useInternalTimeEntryMutations(task?.id ?? "");

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryHours, setEntryHours] = useState("");

  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim() || !task) return;
    addSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, task, addSubtask]);

  const handleAddTimeEntry = useCallback(() => {
    const h = parseFloat(entryHours);
    if (!entryDescription.trim() || !entryHours || isNaN(h) || h <= 0 || !task) return;
    addEntry(entryDescription.trim(), h, authorName);
    setEntryDescription("");
    setEntryHours("");
  }, [entryDescription, entryHours, task, addEntry, authorName]);

  if (!task) return null;

  const statusInfo = statusConfig[task.status] ?? statusConfig.todo;
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priorityConfig[task.priority] ?? priorityConfig.medium;
  const doneCount = subtasks.filter((s) => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const estimated = task.estimatedHours ?? 0;
  const progressPct = estimated > 0 ? Math.min(Math.round((totalHours / estimated) * 100), 100) : 0;
  const isOverBudget = estimated > 0 && totalHours > estimated;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full h-[85vh]">
        <Tabs defaultValue="detalhes" className="flex flex-col flex-1 min-h-0">

          {/* ── Header fixo ── */}
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap pr-8">
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1", priorityInfo.color)}>
                <Flag className="w-3 h-3" />
                {priorityInfo.label}
              </span>
              <span className={cn("flex items-center gap-1.5 text-xs font-medium", statusInfo.color)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </span>
              <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(task)}>
                  Editar
                </Button>
              </div>
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold leading-snug mt-1.5 pr-8">
              {task.title}
            </DialogTitle>
          </DialogHeader>

          {/* ── Navegação de abas (fixa) ── */}
          <div className="shrink-0 px-5 sm:px-8 pt-3 pb-2">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="detalhes" className="text-xs sm:text-sm">Detalhes</TabsTrigger>
              <TabsTrigger value="horas" className="text-xs sm:text-sm">
                Horas{totalHours > 0 ? ` · ${totalHours}h` : ""}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Conteúdo scrollável ── */}
          <DialogBody className="py-5">

            {/* ── ABA: DETALHES ── */}
            <TabsContent value="detalhes" className="mt-0 space-y-6">

              {/* Descrição */}
              {task.description && (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Metadados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Responsável</p>
                  <span className="text-sm flex items-center gap-1.5">
                    {task.allInvolved
                      ? <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      : <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    {task.allInvolved ? "Todos Envolvidos" : (profileName(task.assignedTo) ?? "Não definido")}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Prazo</p>
                  <span className="text-sm flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {formatDisplayDate(task.dueDate) || "Não definido"}
                  </span>
                  {task.dueDate && (() => {
                    const ds = getDeadlineStatus(task.dueDate, task.status);
                    if (!ds) return null;
                    return <p className={cn("text-xs mt-0.5", ds.color)}>{ds.label}</p>;
                  })()}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Estimado</p>
                    <span className="text-sm flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {task.estimatedHours != null ? `${task.estimatedHours}h` : "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Gasto</p>
                    <span className="text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {totalHours > 0 ? `${totalHours}h` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Impedimento */}
              {task.status === "blocked" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Motivo do Impedimento
                  </p>
                  <p className="text-sm text-foreground/90">
                    {task.blockedReason || "Nenhum motivo informado."}
                  </p>
                </div>
              )}

              {/* ── Subtarefas ── */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Subtarefas
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  {subtasks.length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {doneCount}/{subtasks.length}
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="mb-3">
                    <Progress value={subtaskProgress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">{subtaskProgress}% concluído</p>
                  </div>
                )}

                <div className="space-y-0.5 mb-3">
                  {subtasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma subtarefa adicionada.
                    </p>
                  )}
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 group rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={sub.done}
                        onCheckedChange={(checked) => toggleSubtask(sub.id, !!checked)}
                        className="shrink-0"
                      />
                      <span className={cn(
                        "flex-1 text-sm text-left min-w-0 truncate",
                        sub.done && "line-through text-muted-foreground"
                      )}>
                        {sub.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                      <button
                        onClick={() => deleteSubtask(sub.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar subtarefa..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    className="h-9 text-sm"
                  />
                  <Button size="sm" onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                    className="h-9 px-4 shrink-0">
                    Adicionar
                  </Button>
                </div>
              </div>

            </TabsContent>

            {/* ── ABA: HORAS ── */}
            <TabsContent value="horas" className="mt-0 space-y-4">

              {/* Comparativo estimado vs gasto */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Progresso de horas</span>
                  {estimated > 0 && (
                    <span className={cn("text-xs font-semibold", isOverBudget ? "text-red-400" : "text-muted-foreground")}>
                      {progressPct}%
                    </span>
                  )}
                </div>

                {estimated > 0 ? (
                  <>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOverBudget ? "bg-red-500"
                            : progressPct >= 80 ? "bg-amber-500"
                              : "bg-primary"
                        )}
                        style={{ width: `${Math.min(progressPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        Estimado: <strong className="text-foreground">{estimated}h</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Gasto: <strong className={cn(isOverBudget ? "text-red-400" : "text-foreground")}>{totalHours}h</strong>
                      </span>
                      {isOverBudget ? (
                        <span className="flex items-center gap-1 text-red-400 font-medium">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          +{(totalHours - estimated).toFixed(1)}h acima
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Restante: <strong className="text-foreground">{(estimated - totalHours).toFixed(1)}h</strong>
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0" />
                    {totalHours > 0
                      ? <span><strong className="text-foreground">{totalHours}h</strong> registradas · sem estimativa definida</span>
                      : "Nenhuma hora registrada ainda."}
                  </div>
                )}
              </div>

              {/* Lista de entradas */}
              <div className="space-y-2">
                {timeEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma hora registrada ainda.
                  </p>
                )}
                {timeEntries.map((entry) => (
                  <div key={entry.id}
                    className="group flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug break-words">{entry.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.author} · {format(parseISO(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary shrink-0">{entry.hours}h</span>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulário de registro */}
              <div className="sticky bottom-0 bg-background -mx-5 sm:-mx-8 px-5 sm:px-8 pt-3 border-t border-border">
                <div className="flex gap-2">
                  <Input placeholder="Descrição da atividade..."
                    value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTimeEntry()}
                    className="h-9 text-sm flex-1 min-w-0" />
                  <NumberInput min="0.5" step="0.5" placeholder="Horas"
                    value={entryHours} onChange={(e) => setEntryHours(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTimeEntry()}
                    className="w-20 shrink-0" />
                  <Button size="sm" onClick={handleAddTimeEntry}
                    disabled={!entryDescription.trim() || !entryHours || isAddingEntry}
                    className="h-9 shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

            </TabsContent>

          </DialogBody>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
