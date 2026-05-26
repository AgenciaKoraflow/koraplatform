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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, Circle, Clock, Eye, Ban, UserCheck, Flag, Calendar,
  Paperclip, MessageSquare, Trash2, Upload, Download,
  AlertTriangle, User, Folder, ThumbsUp, Timer, X, Plus, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles, type Profile } from "@/hooks/useProfile";
import { useTaskSubtasks } from "@/hooks/useTaskSubtasks";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";
import { useTaskTimeEntries } from "@/hooks/useTaskTimeEntries";
import { useSubtaskMutations } from "@/hooks/mutations/useSubtaskMutations";
import { useCommentMutations } from "@/hooks/mutations/useCommentMutations";
import { useAttachmentMutations } from "@/hooks/mutations/useAttachmentMutations";
import { useTimeEntryMutations } from "@/hooks/mutations/useTimeEntryMutations";
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskSubtask } from "@/types/data";
import { BUBadge } from "@/components/shared/BUBadge";
import { SubtaskDetailDialog } from "./SubtaskDetailDialog";

const BUCKET = "task-attachments";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  todo:          { label: "A Fazer",        icon: Circle,       color: "text-slate-400" },
  in_progress:   { label: "Em Progresso",   icon: Clock,        color: "text-primary" },
  blocked:       { label: "Em Impedimento", icon: Ban,          color: "text-red-400" },
  review:        { label: "Em Revisão",     icon: Eye,          color: "text-amber-400" },
  client_review: { label: "Em Cliente",     icon: UserCheck,    color: "text-purple-400" },
  done:          { label: "Concluído",      icon: CheckCircle2, color: "text-green-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low:    { label: "Baixa",  color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  medium: { label: "Média",  color: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  high:   { label: "Alta",   color: "bg-red-500/20 text-red-400 border border-red-500/30" },
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

  const { addSubtask, toggleSubtask, deleteSubtask, isAdding: isAddingSubtask } =
    useSubtaskMutations(task?.id ?? "");
  const { addComment, deleteComment, isAdding: isAddingComment } =
    useCommentMutations(task?.id ?? "");
  const { uploadAttachment, deleteAttachment, isUploading } =
    useAttachmentMutations(task?.id ?? "");
  const { addTimeEntry, deleteTimeEntry, isAdding: isAddingEntry } =
    useTimeEntryMutations(task?.id ?? "");

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [entryDescription, setEntryDescription] = useState("");
  const [entryHours, setEntryHours] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<TaskSubtask | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return profiles
      .filter((p) => p.full_name?.toLowerCase().includes(q) || p.cargo?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [mentionQuery, profiles]);

  const handleCommentTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewCommentText(text);
    const cursor = e.target.selectionStart ?? text.length;
    const match = text.slice(0, cursor).match(/@(\w*)$/);
    setMentionQuery(match ? match[1].toLowerCase() : null);
  }, []);

  const handleSelectMention = useCallback(
    (p: Profile) => {
      const name = (p.full_name ?? "Usuário").replace(/\s+/g, "");
      setNewCommentText((prev) => prev.replace(/@\w*$/, `@${name} `));
      if (!mentionedUserIds.includes(p.id)) setMentionedUserIds((prev) => [...prev, p.id]);
      setMentionQuery(null);
      textareaRef.current?.focus();
    },
    [mentionedUserIds]
  );

  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim() || !task) return;
    addSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, task, addSubtask]);

  const handleCommentFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }, []);

  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim() || !task) return;
    for (const file of pendingFiles) uploadAttachment(file);
    addComment(authorName, newCommentText.trim(), mentionedUserIds);
    setNewCommentText("");
    setMentionedUserIds([]);
    setPendingFiles([]);
    setMentionQuery(null);
  }, [newCommentText, task, pendingFiles, uploadAttachment, addComment, authorName, mentionedUserIds]);

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
  const doneCount = subtasks.filter((s) => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const estimated = task.estimatedHours ?? 0;
  const progressPct = estimated > 0 ? Math.min(Math.round((totalHours / estimated) * 100), 100) : 0;
  const isOverBudget = estimated > 0 && totalHours > estimated;

  return (
    <>
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
                {task.clientApproved && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30">
                    <ThumbsUp className="w-3 h-3" />
                    Aprovado
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {task.status === "client_review" && !task.clientApproved && (
                    <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-500"
                      onClick={() => onApproveClient(task.id)}>
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Marcar Aprovado
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
                  </div>
                  {task.assignees && task.assignees.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Responsáveis</p>
                      <p className="text-sm truncate">{task.assignees.join(", ")}</p>
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
                        <button
                          className={cn(
                            "flex-1 text-sm text-left min-w-0 truncate hover:text-primary transition-colors",
                            sub.done && "line-through text-muted-foreground"
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

                {/* ── Comentários ── */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Comentários
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    {comments.length > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">{comments.length}</span>
                    )}
                  </div>

                  <div className="space-y-4 mb-4">
                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">
                        Nenhum comentário ainda.
                      </p>
                    )}
                    {comments.map((c) => (
                      <div key={c.id} className="group flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                          {c.author.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium">{c.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(c.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    {filteredMentions.length > 0 && (
                      <div className="rounded-md border border-border bg-popover shadow-md overflow-hidden">
                        {filteredMentions.map((p) => (
                          <button key={p.id} type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectMention(p); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                              {(p.full_name ?? "U").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium leading-none truncate">{p.full_name ?? "Usuário"}</p>
                              {p.cargo && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.cargo}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pendingFiles.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1 max-w-[160px]">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{f.name}</span>
                            <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                              className="text-muted-foreground hover:text-destructive ml-0.5 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <Textarea ref={textareaRef}
                      placeholder="Escreva um comentário... use @ para mencionar alguém"
                      value={newCommentText} onChange={handleCommentTextChange} rows={3}
                      className="text-sm resize-none bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <div>
                        <input ref={commentFileInputRef} type="file" multiple className="hidden"
                          onChange={handleCommentFileChange} />
                        <button type="button" onClick={() => commentFileInputRef.current?.click()}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Anexar arquivo">
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </div>
                      <Button size="sm" onClick={handleAddComment}
                        disabled={!newCommentText.trim() || isAddingComment} className="h-7 text-xs">
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Enviar
                      </Button>
                    </div>
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
        subtask={selectedSubtask}
        parentTaskId={task.id}
        open={!!selectedSubtask}
        onClose={() => setSelectedSubtask(null)}
      />
    </>
  );
}
