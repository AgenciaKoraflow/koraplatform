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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock, Paperclip, MessageSquare, Trash2, Upload, Download,
  Plus, CheckCircle2, Circle, X, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles, type Profile } from "@/hooks/useProfile";
import { useSubtaskTimeEntries } from "@/hooks/useSubtaskTimeEntries";
import { useSubtaskComments } from "@/hooks/useSubtaskComments";
import { useSubtaskAttachments } from "@/hooks/useSubtaskAttachments";
import { useTimeEntryMutations } from "@/hooks/mutations/useTimeEntryMutations";
import { useCommentMutations } from "@/hooks/mutations/useCommentMutations";
import { useAttachmentMutations } from "@/hooks/mutations/useAttachmentMutations";
import { useSubtaskMutations } from "@/hooks/mutations/useSubtaskMutations";
import { supabase } from "@/integrations/supabase/client";
import type { TaskSubtask } from "@/types/data";

const BUCKET = "task-attachments";

function getAttachmentUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SubtaskDetailDialogProps {
  subtask: TaskSubtask | null;
  parentTaskId: string;
  open: boolean;
  onClose: () => void;
}

export function SubtaskDetailDialog({
  subtask,
  parentTaskId,
  open,
  onClose,
}: SubtaskDetailDialogProps) {
  const { user, profile } = useAuth();
  const authorName = profile?.full_name || user?.email || "Usuário";
  const { data: profiles = [] } = useAllProfiles();

  const { data: timeEntries = [] } = useSubtaskTimeEntries(subtask?.id);
  const { data: comments = [] } = useSubtaskComments(subtask?.id);
  const { data: attachments = [] } = useSubtaskAttachments(subtask?.id);

  const { addTimeEntry, deleteTimeEntry, isAdding: isAddingEntry } =
    useTimeEntryMutations(parentTaskId, subtask?.id);
  const { addComment, deleteComment, isAdding: isAddingComment } =
    useCommentMutations(parentTaskId, subtask?.id);
  const { uploadAttachment, deleteAttachment, isUploading } =
    useAttachmentMutations(parentTaskId, subtask?.id);
  const { toggleSubtask } = useSubtaskMutations(parentTaskId);

  const [entryDescription, setEntryDescription] = useState("");
  const [entryHours, setEntryHours] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalHours = useMemo(
    () => timeEntries.reduce((s, e) => s + e.hours, 0),
    [timeEntries]
  );

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

  const handleAddTimeEntry = useCallback(() => {
    const h = parseFloat(entryHours);
    if (!entryDescription.trim() || !entryHours || isNaN(h) || h <= 0) return;
    addTimeEntry(entryDescription.trim(), h, authorName);
    setEntryDescription("");
    setEntryHours("");
  }, [entryDescription, entryHours, addTimeEntry, authorName]);

  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim()) return;
    for (const file of pendingFiles) uploadAttachment(file);
    addComment(authorName, newCommentText.trim(), mentionedUserIds);
    setNewCommentText("");
    setMentionedUserIds([]);
    setPendingFiles([]);
    setMentionQuery(null);
  }, [newCommentText, pendingFiles, uploadAttachment, addComment, authorName, mentionedUserIds]);

  const handleCommentFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) { uploadAttachment(file); e.target.value = ""; }
    },
    [uploadAttachment]
  );

  if (!subtask) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl w-[calc(100%-2rem)] sm:w-full">
        <Tabs defaultValue="detalhes" className="flex flex-col flex-1 min-h-0">

          {/* ── Header fixo ── */}
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2.5 pr-8">
              <Checkbox
                checked={subtask.done}
                onCheckedChange={(checked) => toggleSubtask(subtask.id, !!checked)}
                className="shrink-0"
              />
              {subtask.done
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                : <Circle className="w-4 h-4 text-slate-400 shrink-0" />
              }
              <span className={cn(
                "text-xs font-medium",
                subtask.done ? "text-green-400" : "text-muted-foreground"
              )}>
                {subtask.done ? "Concluída" : "Pendente"}
              </span>
            </div>
            <DialogTitle className="text-base font-semibold leading-snug mt-1.5 pr-8">
              {subtask.title}
            </DialogTitle>
          </DialogHeader>

          {/* ── Navegação de abas (fixa) ── */}
          <div className="shrink-0 px-5 sm:px-6 pt-3 pb-2">
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="detalhes" className="text-xs sm:text-sm">Detalhes</TabsTrigger>
              <TabsTrigger value="horas" className="text-xs sm:text-sm">
                Horas{totalHours > 0 ? ` · ${totalHours}h` : ""}
              </TabsTrigger>
              <TabsTrigger value="arquivos" className="text-xs sm:text-sm">
                Arquivos{attachments.length > 0 ? ` · ${attachments.length}` : ""}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Conteúdo scrollável ── */}
          <DialogBody className="py-5">

            {/* ── ABA: DETALHES ── */}
            <TabsContent value="detalhes" className="mt-0 space-y-5">

              {/* Resumo */}
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Criada em</p>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(subtask.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                {totalHours > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Horas registradas</p>
                    <span className="text-sm flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {totalHours}h
                    </span>
                  </div>
                )}
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
                          <button onClick={() => deleteComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-auto">
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

              {/* Totalizador */}
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Total registrado nesta subtarefa</p>
                  <p className="text-sm font-medium">{totalHours > 0 ? `${totalHours}h` : "—"}</p>
                </div>
              </div>

              {/* Lista */}
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
                    <button onClick={() => deleteTimeEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulário */}
              <div className="flex gap-2 pt-1">
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
            </TabsContent>

            {/* ── ABA: ARQUIVOS ── */}
            <TabsContent value="arquivos" className="mt-0 space-y-3">
              <div className="space-y-2">
                {attachments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum arquivo anexado.
                  </p>
                )}
                {attachments.map((att) => (
                  <div key={att.id}
                    className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors">
                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.fileName}</p>
                      {att.fileSize != null && (
                        <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                      )}
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
                ))}
              </div>

              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center gap-2 py-6 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-5 h-5" />
                <span className="text-sm">{isUploading ? "Enviando..." : "Clique para enviar um arquivo"}</span>
              </button>
            </TabsContent>

          </DialogBody>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
