import { useState, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, Circle, Clock, Eye, Ban, UserCheck, Flag, Calendar,
  Paperclip, MessageSquare, ListChecks, Trash2, Upload, Download,
  AlertTriangle, User, Folder, ThumbsUp, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useTaskSubtasks } from "@/hooks/useTaskSubtasks";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";
import { useSubtaskMutations } from "@/hooks/mutations/useSubtaskMutations";
import { useCommentMutations } from "@/hooks/mutations/useCommentMutations";
import { useAttachmentMutations } from "@/hooks/mutations/useAttachmentMutations";
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

function formatRelativeDate(isoOrFormatted: string): string {
  if (!isoOrFormatted) return "";
  let d: Date | null = null;
  const ddmm = isoOrFormatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmm) d = new Date(parseInt(ddmm[3]), parseInt(ddmm[2]) - 1, parseInt(ddmm[1]));
  if (!d || isNaN(d.getTime())) {
    const iso = isoOrFormatted.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
  }
  if (!d || isNaN(d.getTime())) return isoOrFormatted;
  return format(d, "dd/MM/yyyy");
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

  const { data: subtasks = [] } = useTaskSubtasks(task?.id);
  const { data: comments = [] } = useTaskComments(task?.id);
  const { data: attachments = [] } = useTaskAttachments(task?.id);

  const { addSubtask, toggleSubtask, deleteSubtask, isAdding: isAddingSubtask } = useSubtaskMutations(task?.id ?? "");
  const { addComment, deleteComment, isAdding: isAddingComment } = useCommentMutations(task?.id ?? "");
  const { uploadAttachment, deleteAttachment, isUploading } = useAttachmentMutations(task?.id ?? "");

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim() || !task) return;
    addSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, task, addSubtask]);

  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim() || !task) return;
    addComment(authorName, newCommentText.trim());
    setNewCommentText("");
  }, [newCommentText, task, addComment, authorName]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && task) {
      uploadAttachment(file);
      e.target.value = "";
    }
  }, [task, uploadAttachment]);

  if (!task) return null;

  const statusInfo = statusConfig[task.status] ?? statusConfig.todo;
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priorityConfig[task.priority] ?? priorityConfig.medium;
  const doneCount = subtasks.filter((s) => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden"
        side="right"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start gap-3 pr-6">
            <span className={cn("mt-1", priorityInfo.color, "px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1")}>
              <Flag className="w-3 h-3" />
              {priorityInfo.label}
            </span>
            {task.clientApproved && (
              <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30">
                <ThumbsUp className="w-3 h-3" />
                Aprovado pelo Cliente
              </span>
            )}
          </div>
          <SheetTitle className="text-lg font-semibold leading-snug mt-2">
            {task.title}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("flex items-center gap-1.5 text-sm", statusInfo.color)}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </span>
            <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={() => onEdit(task)}>
              Editar
            </Button>
            {task.status === "client_review" && !task.clientApproved && (
              <Button
                size="sm"
                className="h-7 text-xs bg-purple-600 hover:bg-purple-500"
                onClick={() => onApproveClient(task.id)}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                Marcar como Aprovado
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
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="details" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="flex-shrink-0 grid grid-cols-4 mx-6 mt-4 mb-0 h-9">
            <TabsTrigger value="details" className="text-xs">Detalhes</TabsTrigger>
            <TabsTrigger value="subtasks" className="text-xs">
              Subtarefas
              {subtasks.length > 0 && (
                <span className="ml-1.5 bg-muted rounded-full px-1.5 text-[10px]">{doneCount}/{subtasks.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              Comentários
              {comments.length > 0 && (
                <span className="ml-1.5 bg-muted rounded-full px-1.5 text-[10px]">{comments.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs">
              Arquivos
              {attachments.length > 0 && (
                <span className="ml-1.5 bg-muted rounded-full px-1.5 text-[10px]">{attachments.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Detalhes ── */}
          <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-4 space-y-5 mt-2">
            {task.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Descrição</p>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {clientName && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cliente</p>
                  <span className="text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {clientName}
                  </span>
                </div>
              )}
              {projectName && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Projeto</p>
                  <span className="text-sm flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                    {projectName}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Prazo</p>
                <span className="text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatRelativeDate(task.dueDate) || "Não definido"}
                </span>
              </div>
              {task.assignees && task.assignees.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Responsáveis</p>
                  <p className="text-sm">{task.assignees.join(", ")}</p>
                </div>
              )}
              {task.bu && task.bu.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">BU</p>
                  <div className="flex flex-wrap gap-1">
                    {task.bu.map((b) => <BUBadge key={b} bu={b} />)}
                  </div>
                </div>
              )}
              {task.createdAt && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Criada em</p>
                  <span className="text-sm text-muted-foreground">{formatRelativeDate(task.createdAt)}</span>
                </div>
              )}
            </div>

            {task.status === "blocked" && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Motivo do Impedimento
                </p>
                <p className="text-sm text-foreground/90">
                  {task.blockedReason || "Nenhum motivo informado."}
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── Subtarefas ── */}
          <TabsContent value="subtasks" className="flex-1 overflow-y-auto px-6 py-4 mt-2 flex flex-col gap-4">
            {subtasks.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{doneCount} de {subtasks.length} concluídas</span>
                  <span>{subtaskProgress}%</span>
                </div>
                <Progress value={subtaskProgress} className="h-1.5" />
              </div>
            )}

            <div className="space-y-1.5">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 group rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
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

            <div className="flex gap-2 mt-2">
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
          </TabsContent>

          {/* ── Comentários ── */}
          <TabsContent value="comments" className="flex-1 overflow-y-auto px-6 py-4 mt-2 flex flex-col gap-4">
            <div className="flex-1 space-y-4">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum comentário ainda. Seja o primeiro!
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
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 flex-shrink-0">
              <Textarea
                placeholder="Escreva um comentário..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newCommentText.trim() || isAddingComment}
                className="w-full"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                Enviar comentário
              </Button>
            </div>
          </TabsContent>

          {/* ── Arquivos ── */}
          <TabsContent value="files" className="flex-1 overflow-y-auto px-6 py-4 mt-2 flex flex-col gap-4">
            <div className="flex-1 space-y-2">
              {attachments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum arquivo anexado.
                </p>
              )}
              {attachments.map((att) => (
                <div key={att.id} className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
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

            <div className="border-t border-border pt-4 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 py-6 text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">{isUploading ? "Enviando..." : "Clique para enviar um arquivo"}</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
