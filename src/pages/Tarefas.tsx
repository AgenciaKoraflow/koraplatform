import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Search, Calendar, CheckCircle2, Circle, Clock, Eye, Edit, Trash2, AlertTriangle, User, ListChecks, Ban, UserCheck, Flag, ThumbsUp, X as XIcon, Copy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { toast } from "sonner";
import { useTaskMutations } from "@/hooks/mutations/useTaskMutations";
import { Task } from "@/types/data";
import { BU } from "@/types/bu";
import { useTasks } from "@/hooks/useTasks";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile, useProfileAvatarMap, useTeamOptions } from "@/hooks/useProfile";
import { useDebounce } from "@/hooks/useDebounce";
import { BUBadge } from "@/components/shared/BUBadge";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BUSelect } from "@/components/shared/BUSelect";
import { TaskDetailSheet } from "@/components/tarefas/TaskDetailSheet";
import { CreateTaskDialog } from "@/components/tarefas/CreateTaskDialog";
import { differenceInDays, parse, isValid } from "date-fns";
import { taskStatus, priority } from "@/lib/colors";

// Função para calcular status do prazo
function getDeadlineStatus(dueDate: string, status: Task["status"]): {
  status: "overdue" | "at_risk" | "on_track" | "completed";
  daysRemaining: number | null;
  label: string;
  color: string;
} {
  if (status === "done") {
    return { status: "completed", daysRemaining: null, label: "Concluída", color: "text-green-500" };
  }

  if (!dueDate || dueDate === "A definir") {
    return { status: "on_track", daysRemaining: null, label: "Sem prazo", color: "text-muted-foreground" };
  }

  let parsedDate: Date | null = null;

  // Tenta parse no formato DD/MM/YYYY
  const ddmmyyyy = parse(dueDate, "dd/MM/yyyy", new Date());
  if (isValid(ddmmyyyy)) {
    parsedDate = ddmmyyyy;
  }

  // Tenta parse no formato ISO (YYYY-MM-DD)
  if (!parsedDate) {
    const iso = parse(dueDate, "yyyy-MM-dd", new Date());
    if (isValid(iso)) {
      parsedDate = iso;
    }
  }

  if (!parsedDate) {
    return { status: "on_track", daysRemaining: null, label: dueDate, color: "text-muted-foreground" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  const daysRemaining = differenceInDays(parsedDate, today);

  if (daysRemaining < 0) {
    return {
      status: "overdue",
      daysRemaining,
      label: `${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? 's' : ''} atrasado`,
      color: "text-red-500"
    };
  } else if (daysRemaining <= 3) {
    return {
      status: "at_risk",
      daysRemaining,
      label: daysRemaining === 0 ? "Vence hoje" : `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`,
      color: "text-amber-500"
    };
  } else {
    return {
      status: "on_track",
      daysRemaining,
      label: `${daysRemaining} dias restantes`,
      color: "text-green-500"
    };
  }
}

const statusColumns = [
  { id: "todo",          label: "A Fazer",               icon: Circle,      dotColor: taskStatus.todo.dot,          headerColor: taskStatus.todo.text,          dropColor: taskStatus.todo.ring },
  { id: "in_progress",   label: "Em Andamento",           icon: Clock,       dotColor: taskStatus.in_progress.dot,   headerColor: taskStatus.in_progress.text,   dropColor: taskStatus.in_progress.ring },
  { id: "blocked",       label: "Em Impedimento",         icon: Ban,         dotColor: taskStatus.blocked.dot,       headerColor: taskStatus.blocked.text,       dropColor: taskStatus.blocked.ring },
  { id: "review",        label: "Em Validação Interna",   icon: Eye,         dotColor: taskStatus.review.dot,        headerColor: taskStatus.review.text,        dropColor: taskStatus.review.ring },
  { id: "client_review", label: "Em Cliente",             icon: UserCheck,   dotColor: taskStatus.client_review.dot, headerColor: taskStatus.client_review.text, dropColor: taskStatus.client_review.ring },
  { id: "done",          label: "Concluído",              icon: CheckCircle2, dotColor: taskStatus.done.dot,         headerColor: taskStatus.done.text,          dropColor: taskStatus.done.ring },
];

const priorityConfig = {
  low:    { label: "Baixa", color: priority.low.dot,    flagColor: priority.low.badge },
  medium: { label: "Média", color: priority.medium.dot, flagColor: priority.medium.badge },
  high:   { label: "Alta",  color: priority.high.dot,   flagColor: priority.high.badge },
};

export default function Tarefas() {
  const { updateTask, deleteTask, duplicateTask, isUpdating } = useTaskMutations();
  const { user, profile } = useAuth();
  const { mutateAsync: updateProfile } = useUpdateProfile(user?.id);
  const getAvatarUrl = useProfileAvatarMap();
  const teamOptions = useTeamOptions();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);

  const { data: taskData } = useTasks({ search: searchQuery || undefined, pageSize: 500 });
  const tasks = taskData?.tasks ?? [];
  const { data: clients = [] } = useAllClients();
  const { data: allProjects = [] } = useAllProjects();
  const projects = allProjects;
  const getClient = (id: string) => clients.find((c) => c.id === id);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (profile?.preferences?.task_view as ViewMode | undefined) ?? "kanban"
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogDefaultStatus, setCreateDialogDefaultStatus] = useState<Task["status"]>("todo");
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Filtros
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [filterProjectId, setFilterProjectId] = useState<string>(() => searchParams.get("project") ?? "");
  const [filterHead, setFilterHead] = useState<string>("");

  // Sync URL param on mount (from navigate from Projetos)
  useEffect(() => {
    const p = searchParams.get("project");
    if (p) setFilterProjectId(p);
  }, [searchParams]);

  // Open specific task from notification deep-link (?task=<id>)
  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId || tasks.length === 0) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task) openViewDialog(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tasks]);

  // Drag-and-drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: "",
    projectId: "",
    assignees: [] as string[],
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    dueDate: "",
    bu: "kora-dev" as BU,
    blockedReason: "",
    estimatedHours: "",
  });

  const tasksByStatus = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    for (const t of tasks) (map[t.status] ??= []).push(t);
    return map;
  }, [tasks]);

  const getTasksByStatus = useCallback(
    (status: string) => tasksByStatus[status] ?? [],
    [tasksByStatus],
  );

  const headOptions = useMemo(() => {
    const heads = new Set<string>();
    for (const p of projects) {
      if (p.head) heads.add(p.head);
    }
    return Array.from(heads).sort();
  }, [projects]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    // Hide tasks from paused projects unless the user is explicitly filtering by that project
    if (!filterProjectId) {
      result = result.filter((t) => !t.projectId || !pausedProjectIds.has(t.projectId));
    }
    if (filterPriority.length > 0) result = result.filter((t) => filterPriority.includes(t.priority));
    if (filterAssignees.length > 0) result = result.filter((t) => t.assignees.some((a) => filterAssignees.includes(a)));
    if (filterClientId) result = result.filter((t) => t.clientId === filterClientId);
    if (filterProjectId) result = result.filter((t) => t.projectId === filterProjectId);
    if (filterHead) result = result.filter((t) => {
      const project = projects.find((p) => p.id === t.projectId);
      return project?.head === filterHead;
    });
    return result;
  }, [tasks, pausedProjectIds, filterPriority, filterAssignees, filterClientId, filterProjectId, filterHead, projects]);

  const pausedProjectIds = useMemo(
    () => new Set(projects.filter((p) => p.status === "on_hold").map((p) => p.id)),
    [projects],
  );

  const filterableProjects = useMemo(
    () => filterClientId ? projects.filter((p) => p.clientId === filterClientId) : projects,
    [filterClientId, projects],
  );

  const availableProjects = useMemo(
    () => formData.clientId ? projects.filter((p) => p.clientId === formData.clientId) : [],
    [formData.clientId, projects],
  );

  const openNewDialog = useCallback((status: Task["status"] = "todo") => {
    setCreateDialogDefaultStatus(status);
    setIsCreateDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      clientId: task.clientId,
      projectId: task.projectId || "",
      assignees: task.assignees || [],
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      bu: (Array.isArray(task.bu) ? task.bu[0] : task.bu) || "kora-dev" as BU,
      blockedReason: task.blockedReason || "",
      estimatedHours: task.estimatedHours != null ? String(task.estimatedHours) : "",
    });
    setIsDialogOpen(true);
  }, []);

  const openViewDialog = useCallback((task: Task) => {
    setViewingTask(task);
    setIsDetailSheetOpen(true);
  }, []);

  const handleApproveClient = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.clientApproved && task.status === "client_review") {
      updateTask(taskId, { status: "done", clientApproved: true });
    } else {
      updateTask(taskId, { clientApproved: true });
    }
  }, [tasks, updateTask]);

  // DnD handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetColumnId) {
        updateTask(draggedTaskId, { status: targetColumnId as Task["status"] });
      }
    }
    setDraggedTaskId(null);
  }, [draggedTaskId, tasks, updateTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title || !formData.clientId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (!editingTask) return;
    updateTask(editingTask.id, {
      title: formData.title,
      description: formData.description,
      clientId: formData.clientId,
      projectId: formData.projectId || undefined,
      assignees: formData.assignees,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate,
      bu: formData.bu ? [formData.bu] : undefined,
      blockedReason: formData.status === "blocked" ? formData.blockedReason : undefined,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
    });
    setIsDialogOpen(false);
  }, [formData, editingTask, updateTask]);

  const handleDelete = useCallback(() => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setIsDeleteDialogOpen(false);
      setDeletingTaskId(null);
    }
  }, [deletingTaskId, deleteTask]);

  const getClientName = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company || "Cliente não encontrado";
  }, [clients]);

  const getProjectName = useCallback((projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name;
  }, [projects]);

  const renderAssignees = (assignees: string[]) => {
    if (!assignees || assignees.length === 0) return null;
    return (
      <div className="flex -space-x-2">
        {assignees.slice(0, 3).map((name, i) => (
          <UserAvatar key={i} name={name} src={getAvatarUrl(name)} size="sm" />
        ))}
        {assignees.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
            <span className="text-xs text-muted-foreground">+{assignees.length - 3}</span>
          </div>
        )}
      </div>
    );
  };

  // Componente para renderizar o indicador de prazo
  const renderDeadlineIndicator = (task: Task) => {
    const deadline = getDeadlineStatus(task.dueDate, task.status);
    const isOverdue = deadline.status === "overdue";
    const isAtRisk = deadline.status === "at_risk";

    return (
      <div className={cn("flex items-center gap-1 text-xs", deadline.color)}>
        {isOverdue && <AlertTriangle className="w-3 h-3" />}
        {!isOverdue && !isAtRisk && deadline.status !== "completed" && <Calendar className="w-3 h-3" />}
        <span>{deadline.label}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* Header */}
        <PageHeader
          icon={ListChecks}
          title="Tarefas"
          subtitle="Gerencie as tarefas de todos os projetos"
          actions={
            <button onClick={() => openNewDialog()} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow">
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar tarefas..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          {/* Priority chips */}
          <div className="flex items-center gap-1.5">
            {(Object.entries(priorityConfig) as [string, typeof priorityConfig.low][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterPriority((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key])}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all", filterPriority.includes(key) ? cfg.flagColor : "bg-muted/50 text-muted-foreground border-border hover:bg-muted")}
              >
                <Flag className="w-2.5 h-2.5" />
                {cfg.label}
              </button>
            ))}
          </div>
          {/* Client filter */}
          {clients.length > 0 && (
            <select
              value={filterClientId}
              onChange={(e) => { setFilterClientId(e.target.value); setFilterProjectId(""); }}
              className="h-9 px-3 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os clientes</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
            </select>
          )}
          {/* Project filter */}
          {filterableProjects.length > 0 && (
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="h-9 px-3 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os projetos</option>
              {filterableProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {/* Head filter */}
          {headOptions.length > 0 && (
            <select
              value={filterHead}
              onChange={(e) => setFilterHead(e.target.value)}
              className="h-9 px-3 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os heads</option>
              {headOptions.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          )}
          {/* Clear filters */}
          {(filterPriority.length > 0 || filterAssignees.length > 0 || filterClientId || filterProjectId || filterHead) && (
            <button
              onClick={() => { setFilterPriority([]); setFilterAssignees([]); setFilterClientId(""); setFilterProjectId(""); setFilterHead(""); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
          <ViewModeToggle
            modes={["kanban", "list", "grid"]}
            currentMode={viewMode}
            onChange={(mode) => {
              setViewMode(mode);
              updateProfile({ preferences: { ...profile?.preferences, task_view: mode } }).catch(() => { });
            }}
          />
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {statusColumns.map((column) => {
              const columnTasks = (filteredTasks.filter((t) => t.status === column.id));
              const Icon = column.icon;
              const isDropTarget = dragOverColumn === column.id;
              return (
                <div
                  key={column.id}
                  className="flex-shrink-0 w-72 flex flex-col"
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Icon className={cn("w-4 h-4", column.headerColor)} />
                    <span className="font-semibold text-foreground text-sm">{column.label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{columnTasks.length}</span>
                  </div>
                  <div className={cn("flex-1 space-y-3 rounded-xl p-2 transition-all min-h-24 max-h-[600px] overflow-y-auto scrollbar-none", isDropTarget && "ring-2 bg-card/50", isDropTarget && column.dropColor)}>
                    {columnTasks.map((task, index) => {
                      const pCfg = priorityConfig[task.priority] ?? priorityConfig.medium;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={cn("rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing animate-scale-in overflow-hidden", draggedTaskId === task.id && "opacity-50")}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {/* Priority flag banner */}
                          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium", pCfg.flagColor)}>
                            <Flag className="w-3 h-3" />
                            {pCfg.label}
                            {task.bu?.[0] && <BUBadge bu={task.bu[0]} showLabel={false} className="ml-auto" />}
                            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                              <ActionMenu items={[
                                { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(task) },
                                { label: "Editar", icon: Edit, onClick: () => openEditDialog(task) },
                                { label: "Duplicar", icon: Copy, onClick: () => duplicateTask(task) },
                                { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTaskId(task.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                              ]} />
                            </div>
                          </div>
                          {/* Card body */}
                          <div className="p-3" onClick={() => openViewDialog(task)}>
                            {/* Client approved indicator */}
                            {task.clientApproved && task.status === "client_review" && (
                              <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-2 py-1 mb-2">
                                <ThumbsUp className="w-3 h-3" />
                                Aprovado pelo cliente
                              </div>
                            )}
                            {/* Blocked reason indicator */}
                            {task.status === "blocked" && task.blockedReason && (
                              <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1 mb-2 line-clamp-1">
                                <Ban className="w-3 h-3 flex-shrink-0" />
                                {task.blockedReason}
                              </div>
                            )}
                            <h4 className="font-medium text-foreground text-sm mb-1 leading-snug">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                                <ClientAvatar client={getClient(task.clientId)} size="xs" />
                                {getClientName(task.clientId)}
                              </span>
                              {getProjectName(task.projectId) && (
                                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-xs text-primary">{getProjectName(task.projectId)}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              {renderDeadlineIndicator(task)}
                              {renderAssignees(task.assignees)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => openNewDialog(column.id as Task["status"])} className="w-full p-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-input hover:border-primary/50 transition-all">
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Tarefa</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Cliente / Projeto</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Prioridade</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Prazo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Responsáveis</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ClientAvatar client={getClient(task.clientId)} size="xs" />
                        <p className="text-foreground text-sm">{getClientName(task.clientId)}</p>
                      </div>
                      {getProjectName(task.projectId) && (
                        <p className="text-sm text-primary">{getProjectName(task.projectId)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium",
                        task.status === "done" ? "bg-green-500/10 text-green-500" :
                          task.status === "in_progress" ? "bg-primary/10 text-primary" :
                            task.status === "review" ? "bg-amber-500/10 text-amber-500" :
                              task.status === "blocked" ? "bg-red-500/10 text-red-400" :
                                task.status === "client_review" ? "bg-purple-500/10 text-purple-400" :
                                  "bg-muted text-muted-foreground"
                      )}>
                        {statusColumns.find(s => s.id === task.status)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", priorityConfig[task.priority].color)} />
                        <span className="text-sm">{priorityConfig[task.priority].label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderDeadlineIndicator(task)}</td>
                    <td className="px-6 py-4">{renderAssignees(task.assignees)}</td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu items={[
                        { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(task) },
                        { label: "Editar", icon: Edit, onClick: () => openEditDialog(task) },
                        { label: "Duplicar", icon: Copy, onClick: () => duplicateTask(task) },
                        { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTaskId(task.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTasks.map((task, index) => (
              <div key={task.id} className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer animate-scale-in" style={{ animationDelay: `${index * 50}ms` }} onClick={() => openViewDialog(task)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", priorityConfig[task.priority].color)} />
                    <span className="text-xs text-muted-foreground">{priorityConfig[task.priority].label}</span>
                  </div>
                  <ActionMenu items={[
                    { label: "Editar", icon: Edit, onClick: () => openEditDialog(task) },
                    { label: "Duplicar", icon: Copy, onClick: () => duplicateTask(task) },
                    { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTaskId(task.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                  ]} />
                </div>
                <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">{getClientName(task.clientId)}</span>
                  {getProjectName(task.projectId) && (
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">{getProjectName(task.projectId)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  {renderDeadlineIndicator(task)}
                  {renderAssignees(task.assignees)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultStatus={createDialogDefaultStatus}
      />

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Tarefa</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título da tarefa" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição da tarefa" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, projectId: "" })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.company} - {client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.clientId && (
              <div className="space-y-2">
                <Label htmlFor="project">Projeto</Label>
                <Select value={formData.projectId || "none"} onValueChange={(value) => setFormData({ ...formData, projectId: value === "none" ? "" : value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder={availableProjects.length > 0 ? "Selecione um projeto" : "Nenhum projeto disponível"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {availableProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Task["status"] })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {statusColumns.map(col => <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task["priority"] })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Prazo</Label>
              <DatePicker
                value={formData.dueDate}
                onChange={(value) => setFormData({ ...formData, dueDate: value })}
                placeholder="Selecione o prazo"
              />
              {formData.dueDate && (() => {
                const ds = getDeadlineStatus(formData.dueDate, formData.status);
                if (ds.daysRemaining === null) return null;
                return <p className={cn("text-xs", ds.color)}>{ds.label}</p>;
              })()}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  id="estimatedHours"
                  min="0"
                  step="0.5"
                  placeholder="Ex: 8"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <MultiSelect
                options={teamOptions}
                value={formData.assignees}
                onChange={(value) => setFormData({ ...formData, assignees: value })}
                placeholder="Adicionar responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bu">BU</Label>
              <BUSelect value={formData.bu} onChange={(bu) => setFormData({ ...formData, bu })} />
            </div>
            {formData.status === "blocked" && (
              <div className="space-y-2">
                <Label htmlFor="blockedReason">Motivo do Impedimento</Label>
                <Textarea id="blockedReason" value={formData.blockedReason} onChange={(e) => setFormData({ ...formData, blockedReason: e.target.value })} placeholder="Descreva o que está impedindo a continuidade desta tarefa" className="bg-input border-border" rows={3} />
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={isUpdating} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={tasks.find((t) => t.id === viewingTask?.id) ?? viewingTask}
        open={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        onEdit={(task) => { setIsDetailSheetOpen(false); openEditDialog(task); }}
        onApproveClient={handleApproveClient}
        clientName={viewingTask ? getClientName(viewingTask.clientId) : undefined}
        projectName={viewingTask ? getProjectName(viewingTask.projectId) ?? undefined : undefined}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
