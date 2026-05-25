import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, Circle, Clock, Eye, Ban, UserCheck, Flag, Calendar,
  Paperclip, MessageSquare, Trash2, Upload, Download,
  AlertTriangle, User, Folder, ThumbsUp, Timer, X, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles, type Profile } from "@/hooks/useProfile";
import { useTaskSubtasks } from "@/hooks/useTaskSubtasks";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";
import type { TaskTimeEntry } from "@/types/data";
import { useSubtaskMutations } from "@/hooks/mutations/useSubtaskMutations";
import { useCommentMutations } from "@/hooks/mutations/useCommentMutations";
import { useAttachmentMutations } from "@/hooks/mutations/useAttachmentMutations";
import { useTaskTimeEntries } from "@/hooks/useTaskTimeEntries";
import { useTimeEntryMutations } from "@/hooks/mutations/useTimeEntryMutations";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "@/types/data";
import { BUBadge } from "@/components/shared/BUBadge";

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
  const ddmm = isoOrFormatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmm) return isoOrFormatted;
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

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
      {right && <span className="text-xs text-muted-foreground whitespace-nowrap">{right}</span>}
    </div>
  );
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
  const { data: comments = [] } = useTaskComments(task?.id);
  const { data: attachments = [] } = useTaskAttachments(task?.id);
  const { data: timeEntries = [] } = useTaskTimeEntries(task?.id);

  const { addSubtask, toggleSubtask, deleteSubtask, isAdding: isAddingSubtask } = useSubtaskMutations(task?.id ?? "");
  const { addComment, deleteComment, isAdding: isAddingComment } = useCommentMutations(task?.id ?? "");
  const { uploadAttachment, deleteAttachment, isUploading } = useAttachmentMutations(task?.id ?? "");
  const { addTimeEntry, deleteTimeEntry, isAdding: isAddingEntry } = useTimeEntryMutations(task?.id ?? "");

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [entryDescription, setEntryDescription] = useState("");
  const [entryHours, setEntryHours] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return profiles
      .filter((p) =>
        p.full_name?.toLowerCase().includes(q) || p.cargo?.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [mentionQuery, profiles]);

  const handleCommentTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewCommentText(text);
    const cursor = e.target.selectionStart ?? text.length;
    const before = text.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    setMentionQuery(match ? match[1].toLowerCase() : null);
  }, []);

  const handleSelectMention = useCallback(
    (p: Profile) => {
      const name = (p.full_name ?? "Usuário").replace(/\s+/g, "");
      setNewCommentText((prev) => prev.replace(/@\w*$/, `@${name} `));
      if (!mentionedUserIds.includes(p.id)) {
        setMentionedUserIds((prev) => [...prev, p.id]);
      }
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
      if (file && task) {
        uploadAttachment(file);
        e.target.value = "";
      }
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        {/* ── Header ── */}
        <DialogHeader className="border-b border-border pb-4">
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
                <Button
                  size="sm"
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-500"
                  onClick={() => onApproveClient(task.id)}
                >
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Marcar Aprovado
                </Button>
              )}
              {task.clientApproved && task.status === "client_review" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                  onClick={() => onApproveClient(task.id)}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Mover para Concluído
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(task)}>
                Editar
              </Button>
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold leading-snug mt-2 pr-8">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="py-6 space-y-8">
          {/* ── DETALHES ── */}
          <section>
            <SectionTitle>Detalhes</SectionTitle>

            {task.description && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-4">
                {task.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {clientName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Cliente</p>
                  <span className="text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {clientName}
                  </span>
                </div>
              )}
              {projectName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Projeto</p>
                  <span className="text-sm flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                    {projectName}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Prazo</p>
                <span className="text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatDisplayDate(task.dueDate) || "Não definido"}
                </span>
              </div>
              {task.assignees && task.assignees.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Responsáveis</p>
                  <p className="text-sm">{task.assignees.join(", ")}</p>
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
              {task.createdAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Criada em</p>
                  <span className="text-sm text-muted-foreground">{formatDisplayDate(task.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Time tracking summary */}
            <div className="mt-4 flex items-center gap-6 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Estimado</p>
                  <p className="text-sm font-medium">
                    {task.estimatedHours != null ? `${task.estimatedHours}h` : "—"}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Gasto</p>
                  <p className="text-sm font-medium">
                    {timeEntries.length > 0
                      ? `${timeEntries.reduce((s, e) => s + e.hours, 0)}h`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {task.status === "blocked" && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Motivo do Impedimento
                </p>
                <p className="text-sm text-foreground/90">
                  {task.blockedReason || "Nenhum motivo informado."}
                </p>
              </div>
            )}
          </section>

          {/* ── HORAS REAIS ── */}
          <section>
            <SectionTitle
              right={
                timeEntries.length > 0
                  ? `${timeEntries.reduce((s, e) => s + e.hours, 0)}h gastas`
                  : undefined
              }
            >
              Horas Reais
            </SectionTitle>

            <div className="space-y-2 mb-3">
              {timeEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Nenhuma hora registrada ainda.
                </p>
              )}
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.author} · {format(parseISO(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary flex-shrink-0">{entry.hours}h</span>
                  <button
                    onClick={() => deleteTimeEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add entry form */}
            <div className="flex gap-2">
              <Input
                placeholder="Descrição da atividade..."
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTimeEntry()}
                className="h-9 text-sm flex-1"
              />
              <Input
                type="number"
                min="0.5"
                step="0.5"
                placeholder="Horas"
                value={entryHours}
                onChange={(e) => setEntryHours(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTimeEntry()}
                className="h-9 text-sm w-24 flex-shrink-0"
              />
              <Button
                size="sm"
                onClick={handleAddTimeEntry}
                disabled={!entryDescription.trim() || !entryHours || isAddingEntry}
                className="h-9 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </section>

          {/* ── SUBTAREFAS ── */}
          <section>
            <SectionTitle right={subtasks.length > 0 ? `${doneCount}/${subtasks.length}` : undefined}>
              Subtarefas
            </SectionTitle>

            {subtasks.length > 0 && (
              <div className="mb-3">
                <Progress value={subtaskProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{subtaskProgress}% concluído</p>
              </div>
            )}

            <div className="space-y-1 mb-3">
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
                    className="flex-shrink-0"
                  />
                  <span className={cn("flex-1 text-sm", sub.done && "line-through text-muted-foreground")}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
              <Button
                size="sm"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                className="h-9 px-4 flex-shrink-0"
              >
                Adicionar
              </Button>
            </div>
          </section>

          {/* ── COMENTÁRIOS ── */}
          <section>
            <SectionTitle right={comments.length > 0 ? String(comments.length) : undefined}>
              Comentários
            </SectionTitle>

            <div className="space-y-4 mb-4">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentário ainda.
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="group flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {c.author.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment composer */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              {/* @mention dropdown */}
              {filteredMentions.length > 0 && (
                <div className="rounded-md border border-border bg-popover shadow-md overflow-hidden">
                  {filteredMentions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectMention(p);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {(p.full_name ?? "U").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium leading-none">{p.full_name ?? "Usuário"}</p>
                        {p.cargo && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.cargo}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pending file pills */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pendingFiles.map((f, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      {f.name}
                      <button
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <Textarea
                ref={textareaRef}
                placeholder="Escreva um comentário... use @ para mencionar alguém"
                value={newCommentText}
                onChange={handleCommentTextChange}
                rows={3}
                className="text-sm resize-none bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div>
                  <input
                    ref={commentFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleCommentFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => commentFileInputRef.current?.click()}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim() || isAddingComment}
                  className="h-7 text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Enviar
                </Button>
              </div>
            </div>
          </section>

          {/* ── ARQUIVOS ── */}
          <section>
            <SectionTitle right={attachments.length > 0 ? String(attachments.length) : undefined}>
              Arquivos
            </SectionTitle>

            <div className="space-y-2 mb-4">
              {attachments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum arquivo anexado.
                </p>
              )}
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.fileName}</p>
                    {att.fileSize != null && (
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                    )}
                  </div>
                  <a
                    href={getAttachmentUrl(att.storagePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteAttachment(att.id, att.storagePath)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 py-6 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">{isUploading ? "Enviando..." : "Clique para enviar um arquivo"}</span>
            </button>
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
