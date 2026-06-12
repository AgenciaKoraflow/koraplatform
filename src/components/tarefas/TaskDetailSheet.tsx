import { useState, useRef, useCallback, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, Circle, Clock, Eye, Ban, UserCheck, Flag, Calendar,
  Paperclip, Trash2, Upload, Download,
  AlertTriangle, User, Folder, ThumbsUp, Timer, X, Plus, ChevronRight, ChevronDown,
} from "lucide-react";
import { CommentComposer, sanitizeCommentHtml, type CommentComposerHandle } from "@/components/shared/CommentComposer";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles, useProfileAvatarMap } from "@/hooks/useProfile";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useTaskSubtasks } from "@/hooks/useTaskSubtasks";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";
import { useTaskTimeEntries } from "@/hooks/useTaskTimeEntries";
import { useSubtaskMutations } from "@/hooks/mutations/useSubtaskMutations";
import { useTaskMutations } from "@/hooks/mutations/useTaskMutations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommentMutations } from "@/hooks/mutations/useCommentMutations";
import { useAttachmentMutations } from "@/hooks/mutations/useAttachmentMutations";
import { useTimeEntryMutations } from "@/hooks/mutations/useTimeEntryMutations";
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskSubtask, SubtaskStatus } from "@/types/data";
import { BUBadge } from "@/components/shared/BUBadge";
import { SubtaskDetailDialog } from "./SubtaskDetailDialog";
import { taskStatus, priority } from "@/lib/colors";

const BUCKET = "task-attachments";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  todo:          { label: "A Fazer",             icon: Circle,      color: taskStatus.todo.text },
  in_progress:   { label: "Em Andamento",         icon: Clock,       color: taskStatus.in_progress.text },
  blocked:       { label: "Em Impedimento",       icon: Ban,         color: taskStatus.blocked.text },
  review:        { label: "Em Validação Interna", icon: Eye,         color: taskStatus.review.text },
  client_review: { label: "Em Cliente",           icon: UserCheck,   color: taskStatus.client_review.text },
  done:          { label: "Concluído",            icon: CheckCircle2, color: taskStatus.done.text },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low:    { label: "Baixa", color: priority.low.badge },
  medium: { label: "Média", color: priority.medium.badge },
  high:   { label: "Alta",  color: priority.high.badge },
};

const substatusConfig: Record<SubtaskStatus, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  todo:        { label: "A Fazer",        icon: Circle,       color: taskStatus.todo.text,        dot: taskStatus.todo.dot },
  in_progress: { label: "Em Andamento",   icon: Clock,        color: taskStatus.in_progress.text, dot: taskStatus.in_progress.dot },
  blocked:     { label: "Impedida",       icon: Ban,          color: taskStatus.blocked.text,     dot: taskStatus.blocked.dot },
  review:      { label: "Em Validação",   icon: Eye,          color: taskStatus.review.text,      dot: taskStatus.review.dot },
  done:        { label: "Concluída",      icon: CheckCircle2, color: taskStatus.done.text,        dot: taskStatus.done.dot },
};

function formatDisplayDate(isoOrFormatted: string): string {
  if (!isoOrFormatted) return "";
  if (isoOrFormatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)) return isoOrFormatted;
  const iso = isoOrFormatted.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
    if (!isNaN(d.getTime())) return format(d, "dd/MM/yyyy");
  }
  return isoOrFormatted;
}

function getDeadlineStatus(dueDate: string, status: string): { label: string; color: string } | null {
  if (!dueDate || dueDate === "A definir" || status === "done") return null;

  let parsed: Date | null = null;
  const dd = parse(dueDate, "dd/MM/yyyy", new Date());
  if (isValid(dd)) parsed = dd;
  if (!parsed) { const iso = parse(dueDate, "yyyy-MM-dd", new Date()); if (isValid(iso)) parsed = iso; }
  if (!parsed) { const isoFull = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/); if (isoFull) { const d = new Date(parseInt(isoFull[1]), parseInt(isoFull[2]) - 1, parseInt(isoFull[3])); if (!isNaN(d.getTime())) parsed = d; } }
  if (!parsed) return null;

  const today = new Date(); today.setHours(0, 0, 0, 0); parsed.setHours(0, 0, 0, 0);
  const days = differenceInDays(parsed, today);

  if (days < 0) return { label: `${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""} atrasado`, color: "text-red-500" };
  if (days === 0) return { label: "Vence hoje", color: "text-amber-500" };
  if (days <= 3) return { label: `${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}`, color: "text-amber-500" };
  return { label: `${days} dias restantes`, color: "text-green-500" };
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onApproveClient: (taskId: string) => void;
  clientName?: string;
  projectName?: string;
}

export function TaskDetailSheet({
  task,
  open,
  onClose,
  onEdit,
  onApproveClient,
  clientName,
  projectName,
}: TaskDetailSheetProps) {
  const { user, profile } = useAuth();
  const authorName = profile?.full_name || user?.email || "Usuário";
  const { data: profiles = [] } = useAllProfiles();
  const getAvatarUrl = useProfileAvatarMap();

  const { data: subtasks = [] } = useTaskSubtasks(task?.id);
  // All comments/attachments/timeEntries include subtask-linked rows (same task_id)
  const { data: allComments = [] } = useTaskComments(task?.id);
  const { data: allAttachments = [] } = useTaskAttachments(task?.id);
  const { data: allTimeEntries = [] } = useTaskTimeEntries(task?.id);

  // Only direct-task rows (no subtask link)
  const comments = useMemo(() => allComments.filter((c) => !c.subtaskId), [allComments]);

  // Total hours including subtask hours
  const totalHours = useMemo(
    () => allTimeEntries.reduce((s, e) => s + e.hours, 0),
    [allTimeEntries]
  );

  // Hours per subtask (live, derived from allTimeEntries)
  const subtaskHoursMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of allTimeEntries) {
      if (entry.subtaskId) {
        map[entry.subtaskId] = (map[entry.subtaskId] ?? 0) + entry.hours;
      }
    }
    return map;
  }, [allTimeEntries]);

  const { updateTask } = useTaskMutations();

  const { addSubtask, toggleSubtask, deleteSubtask, updateSubtaskStatus, isAdding: isAddingSubtask } =
    useSubtaskMutations(task?.id ?? "");
  const { addComment, deleteComment, isAdding: isAddingComment } =
    useCommentMutations(task?.id ?? "");
  const { uploadAttachment, deleteAttachment, isUploading } =
    useAttachmentMutations(task?.id ?? "");
  const { addTimeEntry, deleteTimeEntry, isAdding: isAddingEntry } =
    useTimeEntryMutations(task?.id ?? "");

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryHours, setEntryHours] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<TaskSubtask | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<CommentComposerHandle>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim() || !task) return;
    addSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, task, addSubtask]);

  const handleAddComment = useCallback(({ html, mentionedUserIds, files }: { html: string; mentionedUserIds: string[]; isPrivate: boolean; files: File[] }) => {
    if (!task) return;
    for (const file of files) uploadAttachment(file);
    if (pendingApproval) {
      addComment(authorName, html, mentionedUserIds, true);
      updateTask(task.id, {
        clientApproved: true,
        clientApprovalCount: (task.clientApprovalCount ?? 0) + 1,
      });
      setPendingApproval(false);
    } else {
      addComment(authorName, html, mentionedUserIds);
    }
  }, [task, pendingApproval, uploadAttachment, addComment, updateTask, authorName]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && task) { uploadAttachment(file); e.target.value = ""; }
    },
    [task, uploadAttachment]
  );

  const handleAddTimeEntry = useCallback(() => {
    const h = parseFloat(entryHours);
    if (!entryDescription.trim() || !entryHours || isNaN(h) || h <= 0 || !task) return;
    addTimeEntry(entryDescription.trim(), h, authorName);
    setEntryDescription("");
    setEntryHours("");
  }, [entryDescription, entryHours, task, addTimeEntry, authorName]);

  if (!task) return null;

  const statusInfo = statusConfig[task.status] ?? statusConfig.todo;
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priorityConfig[task.priority] ?? priorityConfig.medium;
  const doneCount = subtasks.filter((s) => s.substatus === "done").length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const estimated = task.estimatedHours ?? 0;
  const progressPct = estimated > 0 ? Math.min(Math.round((totalHours / estimated) * 100), 100) : 0;
  const isOverBudget = estimated > 0 && totalHours > estimated;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setPendingApproval(false); onClose(); } }}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full h-[85vh]">
          <Tabs defaultValue="detalhes" className="flex flex-col flex-1 min-h-0">

            {/* ── Header fixo ── */}
            <DialogHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2 flex-wrap pr-8">
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1", priorityInfo.color)}>
                  <Flag className="w-3 h-3" />
                  {priorityInfo.label}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn("flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity", statusInfo.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {(Object.entries(statusConfig) as [string, { label: string; icon: React.ElementType; color: string }][]).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => updateTask(task.id, { status: key as Task["status"] })}
                          className="gap-2 cursor-pointer"
                        >
                          <Icon className={cn("w-3.5 h-3.5 shrink-0", cfg.color)} />
                          <span className={task.status === key ? "font-semibold" : ""}>{cfg.label}</span>
                          {task.status === key && <CheckCircle2 className="w-3 h-3 ml-auto opacity-50" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {(task.clientApprovalCount ?? 0) > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30">
                    <ThumbsUp className="w-3 h-3" />
                    Aprovado · {task.clientApprovalCount}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {task.status === "client_review" && (
                    <Button size="sm"
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-60"
                      disabled={pendingApproval}
                      onClick={() => {
                        setPendingApproval(true);
                        setTimeout(() => {
                          commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          composerRef.current?.focus();
                        }, 50);
                      }}>
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {pendingApproval ? "Aguardando evidência…" : "Marcar Aprovado"}
                    </Button>
                  )}
                  {task.clientApproved && task.status === "client_review" && (
                    <Button size="sm" variant="outline"
                      className="h-7 text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                      onClick={() => onApproveClient(task.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Mover para Concluído
                    </Button>
                  )}
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
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="detalhes" className="text-xs sm:text-sm">Detalhes</TabsTrigger>
                <TabsTrigger value="horas" className="text-xs sm:text-sm">
                  Horas{totalHours > 0 ? ` · ${totalHours}h` : ""}
                </TabsTrigger>
                <TabsTrigger value="arquivos" className="text-xs sm:text-sm">
                  Arquivos{allAttachments.length > 0 ? ` · ${allAttachments.length}` : ""}
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
                  {clientName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Cliente</p>
                      <span className="text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {clientName}
                      </span>
                    </div>
                  )}
                  {projectName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Projeto</p>
                      <span className="text-sm flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {projectName}
                      </span>
                    </div>
                  )}
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
                  {task.assignees && task.assignees.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Responsáveis</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.assignees.map((name, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <UserAvatar name={name} src={getAvatarUrl(name)} size="sm" />
                            <span className="text-sm">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {task.bu && task.bu.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">BU</p>
                      <div className="flex flex-wrap gap-1">
                        {task.bu.map((b) => <BUBadge key={b} bu={b} />)}
                      </div>
                    </div>
                  )}
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
                    {subtasks.map((sub) => {
                      const ssCfg = substatusConfig[sub.substatus] ?? substatusConfig.todo;
                      const SubstatusIcon = ssCfg.icon;
                      return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 group rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn("shrink-0 flex items-center", ssCfg.color)}
                              title={ssCfg.label}
                            >
                              <SubstatusIcon className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            {(Object.entries(substatusConfig) as [SubtaskStatus, typeof substatusConfig[SubtaskStatus]][]).map(([key, cfg]) => {
                              const Icon = cfg.icon;
                              return (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => updateSubtaskStatus(sub.id, key)}
                                  className={cn("flex items-center gap-2 text-xs", sub.substatus === key && "font-semibold")}
                                >
                                  <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                                  {cfg.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                          className={cn(
                            "flex-1 text-sm text-left min-w-0 truncate hover:text-primary transition-colors",
                            sub.substatus === "done" && "line-through text-muted-foreground"
                          )}
                          onClick={() => setSelectedSubtask(sub)}
                        >
                          {sub.title}
                        </button>
                        {(subtaskHoursMap[sub.id] ?? 0) > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {subtaskHoursMap[sub.id]}h
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                        <button
                          onClick={() => deleteSubtask(sub.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      );
                    })}
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

                {/* ── Comentários ── */}
                <div ref={commentSectionRef}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Comentários
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    {comments.length > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">{comments.length}</span>
                    )}
                  </div>

                  {pendingApproval && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-400 flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                      Adicione um comentário como evidência para confirmar a aprovação do cliente.
                      <button className="ml-auto shrink-0 hover:opacity-70 transition-opacity" onClick={() => setPendingApproval(false)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-4 mb-4">
                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">
                        Nenhum comentário ainda.
                      </p>
                    )}
                    {comments.map((c) => (
                      <div key={c.id} className="group flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <UserAvatar name={c.author} src={getAvatarUrl(c.author)} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium">{c.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            {c.isApprovalEvidence && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25 flex items-center gap-1">
                                <ThumbsUp className="w-2.5 h-2.5" />
                                Aprovado pelo cliente
                              </span>
                            )}
                            {!c.isApprovalEvidence && (
                              <button
                                onClick={() => deleteComment(c.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div
                            className="text-sm text-foreground/90 leading-relaxed break-words prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(c.content) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer */}
                  <CommentComposer
                    ref={composerRef}
                    profiles={profiles}
                    avatarUrl={getAvatarUrl}
                    onSubmit={handleAddComment}
                    isSubmitting={isAddingComment}
                    requireEvidence={pendingApproval}
                  />
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
                  {allTimeEntries.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma hora registrada ainda.
                    </p>
                  )}
                  {allTimeEntries.map((entry) => {
                    const linkedSubtask = entry.subtaskId
                      ? subtasks.find((s) => s.id === entry.subtaskId)
                      : null;
                    return (
                      <div key={entry.id}
                        className="group flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug break-words">{entry.description}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              {entry.author} · {format(parseISO(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                            {linkedSubtask && (
                              <span className="text-xs bg-muted rounded px-1.5 py-0.5 truncate max-w-[140px]">
                                {linkedSubtask.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-primary shrink-0">{entry.hours}h</span>
                        <button onClick={() => deleteTimeEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
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

              {/* ── ABA: ARQUIVOS ── */}
              <TabsContent value="arquivos" className="mt-0 space-y-3">
                <div className="space-y-2">
                  {allAttachments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum arquivo anexado.
                    </p>
                  )}
                  {allAttachments.map((att) => {
                    const linkedSubtask = att.subtaskId
                      ? subtasks.find((s) => s.id === att.subtaskId)
                      : null;
                    return (
                      <div key={att.id}
                        className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                        <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.fileName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {att.fileSize != null && (
                              <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                            )}
                            {linkedSubtask && (
                              <span className="text-xs bg-muted rounded px-1.5 py-0.5 truncate max-w-[140px]">
                                {linkedSubtask.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <a href={getAttachmentUrl(att.storagePath)} target="_blank" rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0">
                          <Download className="w-4 h-4" />
                        </a>
                        <button onClick={() => deleteAttachment(att.id, att.storagePath)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="sticky bottom-0 bg-background -mx-5 sm:-mx-8 px-5 sm:px-8 pt-3 border-t border-border">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 py-6 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">{isUploading ? "Enviando..." : "Clique para enviar um arquivo"}</span>
                  </button>
                </div>
              </TabsContent>

            </DialogBody>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog de subtarefa (aninhado) */}
      <SubtaskDetailDialog
        subtask={selectedSubtask ? (subtasks.find((s) => s.id === selectedSubtask.id) ?? selectedSubtask) : null}
        parentTaskId={task.id}
        open={!!selectedSubtask}
        onClose={() => setSelectedSubtask(null)}
      />
    </>
  );
}
