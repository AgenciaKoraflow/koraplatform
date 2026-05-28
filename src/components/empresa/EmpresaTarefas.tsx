import { useState, useCallback, useMemo } from "react";
import {
  Plus, CheckSquare, Edit, Trash2, Circle, Clock, Ban, Eye, CheckCircle2,
  Flag, Calendar, AlertTriangle, User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useInternalTasks } from "@/hooks/useInternalTasks";
import { useInternalTaskMutations } from "@/hooks/mutations/useInternalTaskMutations";
import { usePermissions } from "@/hooks/usePermissions";
import type { InternalTask, InternalTaskStatus, InternalTaskPriority } from "@/types/data";

const statusColumns = [
  { id: "todo" as InternalTaskStatus, label: "A Fazer", icon: Circle, headerColor: "text-slate-400", dotColor: "bg-slate-500", dropColor: "ring-slate-500/40" },
  { id: "in_progress" as InternalTaskStatus, label: "Em andamento", icon: Clock, headerColor: "text-primary", dotColor: "bg-primary", dropColor: "ring-primary/40" },
  { id: "blocked" as InternalTaskStatus, label: "Em Impedimento", icon: Ban, headerColor: "text-red-400", dotColor: "bg-red-500", dropColor: "ring-red-500/40" },
  { id: "review" as InternalTaskStatus, label: "Em Validação Interna", icon: Eye, headerColor: "text-amber-400", dotColor: "bg-amber-500", dropColor: "ring-amber-500/40" },
  { id: "done" as InternalTaskStatus, label: "Concluídos", icon: CheckCircle2, headerColor: "text-green-400", dotColor: "bg-green-500", dropColor: "ring-green-500/40" },
];

const priorityConfig: Record<InternalTaskPriority, { label: string; color: string; flagColor: string }> = {
  low: { label: "Baixa", color: "bg-slate-500", flagColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  medium: { label: "Média", color: "bg-primary", flagColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  high: { label: "Alta", color: "bg-red-500", flagColor: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

function getDeadlineStatus(dueDate: string | undefined, status: InternalTaskStatus) {
  if (status === "done") {
    return { label: "Finalizado", color: "text-green-500" };
  }
  if (!dueDate) {
    return { label: "Sem prazo", color: "text-muted-foreground" };
  }

  let parsedDate: Date | null = null;
  const iso = parse(dueDate.substring(0, 10), "yyyy-MM-dd", new Date());
  if (isValid(iso)) parsedDate = iso;

  if (!parsedDate) return { label: "Sem prazo", color: "text-muted-foreground" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);
  const days = differenceInDays(parsedDate, today);

  if (days < 0) return { label: `${Math.abs(days)}d atrasado`, color: "text-red-500", overdue: true };
  if (days === 0) return { label: "Vence hoje", color: "text-amber-500" };
  if (days <= 3) return { label: `${days}d restantes`, color: "text-amber-500" };
  return { label: `${days}d restantes`, color: "text-green-500" };
}

type FormData = {
  title: string;
  description: string;
  status: InternalTaskStatus;
  priority: InternalTaskPriority;
  assignedTo: string;
  dueDate: string;
  blockedReason: string;
};

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignedTo: "",
  dueDate: "",
  blockedReason: "",
};

interface Props {
  workspaceId: string;
}

export function EmpresaTarefas({ workspaceId }: Props) {
  const { isAdmin } = usePermissions();
  const { data: tasks = [], isLoading } = useInternalTasks(workspaceId);
  const { addTask, updateTask, deleteTask, isAdding, isUpdating } = useInternalTaskMutations();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; full_name: string | null }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InternalTask | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drag-and-drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, InternalTask[]> = {};
    for (const t of tasks) (map[t.status] ??= []).push(t);
    return map;
  }, [tasks]);

  const openAdd = useCallback((status: InternalTaskStatus = "todo") => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, status });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: InternalTask) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description ?? "",
      status: item.status,
      priority: item.priority,
      assignedTo: item.assignedTo ?? "",
      dueDate: item.dueDate ? item.dueDate.substring(0, 10) : "",
      blockedReason: "",
    });
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim()) return;
    const data: Omit<InternalTask, "id"> = {
      workspaceId,
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      assignedTo: formData.assignedTo || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      createdAt: "",
      updatedAt: "",
    };
    if (editingItem) {
      updateTask(editingItem.id, data);
    } else {
      await addTask(data);
    }
    setDialogOpen(false);
  }, [formData, editingItem, workspaceId, addTask, updateTask]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: InternalTaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedId) {
      const task = tasks.find((t) => t.id === draggedId);
      if (task && task.status !== targetStatus) {
        updateTask(draggedId, { status: targetStatus });
      }
    }
    setDraggedId(null);
  }, [draggedId, tasks, updateTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverColumn(null);
  }, []);

  const profileName = (id?: string) =>
    id ? (profiles.find((p) => p.id === id)?.full_name ?? "—") : null;

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => openAdd()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhuma tarefa cadastrada</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const Icon = column.icon;
          const columnTasks = tasksByStatus[column.id] ?? [];
          const isDropTarget = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 flex flex-col"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className={cn("w-4 h-4", column.headerColor)} />
                <span className="font-semibold text-foreground text-sm">{column.label}</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>

              {/* Drop zone */}
              <div
                className={cn(
                  "flex-1 space-y-3 rounded-xl p-2 transition-all min-h-24",
                  isDropTarget && "ring-2 bg-card/50",
                  isDropTarget && column.dropColor,
                )}
              >
                {columnTasks.map((task, index) => {
                  const pCfg = priorityConfig[task.priority] ?? priorityConfig.medium;
                  const deadline = getDeadlineStatus(task.dueDate, task.status);
                  const assignee = profileName(task.assignedTo);

                  return (
                    <div
                      key={task.id}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 overflow-hidden",
                        isAdmin && "cursor-grab active:cursor-grabbing",
                        draggedId === task.id && "opacity-50",
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Priority flag banner */}
                      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium", pCfg.flagColor)}>
                        <Flag className="w-3 h-3" />
                        {pCfg.label}
                        {isAdmin && (
                          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu items={[
                              { label: "Editar", icon: Edit, onClick: () => openEdit(task) },
                              { label: "Excluir", icon: Trash2, onClick: () => setDeleteId(task.id), variant: "destructive" },
                            ]} />
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-3">
                        {task.status === "blocked" && (
                          <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1 mb-2 line-clamp-1">
                            <Ban className="w-3 h-3 flex-shrink-0" />
                            Em impedimento
                          </div>
                        )}
                        <h4 className="font-medium text-foreground text-sm mb-1 leading-snug">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          {/* Deadline */}
                          <div className={cn("flex items-center gap-1 text-xs", deadline.color)}>
                            {"overdue" in deadline && deadline.overdue
                              ? <AlertTriangle className="w-3 h-3" />
                              : task.status !== "done" && task.dueDate
                                ? <Calendar className="w-3 h-3" />
                                : null}
                            <span>{deadline.label}</span>
                          </div>
                          {/* Assignee */}
                          {assignee && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {assignee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add button per column */}
                {isAdmin && (
                  <button
                    onClick={() => openAdd(column.id)}
                    className="w-full p-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-input hover:border-primary/50 transition-all"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Atualize os dados da tarefa." : "Adicione uma nova tarefa interna."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Atualizar documentação de processos"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva a tarefa..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((p) => ({ ...p, status: v as InternalTaskStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData((p) => ({ ...p, priority: v as InternalTaskPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(priorityConfig) as [InternalTaskPriority, typeof priorityConfig.low][]).map(([k, cfg]) => (
                      <SelectItem key={k} value={k}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select
                value={formData.assignedTo || "none"}
                onValueChange={(v) => setFormData((p) => ({ ...p, assignedTo: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name ?? profile.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data limite</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            {formData.status === "blocked" && (
              <div className="space-y-1.5">
                <Label>Motivo do impedimento</Label>
                <Textarea
                  placeholder="Descreva o que está impedindo a continuidade desta tarefa..."
                  rows={3}
                  value={formData.blockedReason}
                  onChange={(e) => setFormData((p) => ({ ...p, blockedReason: e.target.value }))}
                />
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim() || isAdding || isUpdating}>
              {editingItem ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir tarefa"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) deleteTask(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
