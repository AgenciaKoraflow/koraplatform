import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Calendar, CheckCircle2, Circle, Clock, Eye, Edit, Trash2, AlertTriangle, User, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { MultiSelect, TEAM_OPTIONS } from "@/components/shared/MultiSelect";
import { toast } from "sonner";
import { useTaskMutations } from "@/hooks/mutations/useTaskMutations";
import { Task } from "@/types/data";
import { BU } from "@/types/bu";
import { useTasks } from "@/hooks/useTasks";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useDebounce } from "@/hooks/useDebounce";
import { BUBadge } from "@/components/shared/BUBadge";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BUSelect } from "@/components/shared/BUSelect";
import { differenceInDays, parse, isValid } from "date-fns";

// Configuração de fotos dos membros da equipe
const TEAM_PHOTOS: Record<string, string> = {
  James: "https://avatars.githubusercontent.com/u/583231?v=4",
  João: "https://avatars.githubusercontent.com/u/583232?v=4",
  Edson: "https://avatars.githubusercontent.com/u/583233?v=4",
};

// Cores para avatares sem foto
const AVATAR_COLORS: Record<string, string> = {
  James: "bg-primary",
  João: "bg-green-500",
  Edson: "bg-muted",
};

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

// Componente de avatar do responsável
function AssigneeAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const photoUrl = TEAM_PHOTOS[name];
  const bgColor = AVATAR_COLORS[name] || "bg-gray-500";
  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  if (photoUrl) {
    return (
      <img 
        src={photoUrl} 
        alt={name} 
        className={cn("rounded-full border-2 border-card object-cover", sizeClasses)}
        title={name}
      />
    );
  }

  return (
    <div 
      className={cn("rounded-full border-2 border-card flex items-center justify-center text-white font-medium", sizeClasses, bgColor)}
      title={name}
    >
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
}

const statusColumns = [
  { id: "todo", label: "A Fazer", icon: Circle },
  { id: "in_progress", label: "Em Progresso", icon: Clock },
  { id: "review", label: "Em Revisão", icon: CheckCircle2 },
  { id: "done", label: "Concluído", icon: CheckCircle2 },
];

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500" },
  medium: { label: "Média", color: "bg-primary" },
  high: { label: "Alta", color: "bg-amber-500" },
};

export default function Tarefas() {
  const { addTask, updateTask, deleteTask, isAdding, isUpdating } = useTaskMutations();
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);

  const { data: taskData } = useTasks({ search: searchQuery || undefined, pageSize: 500 });
  const tasks = taskData?.tasks ?? [];
  const { data: clients = [] } = useAllClients();
  const { data: allProjects = [] } = useAllProjects();
  const projects = allProjects;
  const getClient = (id: string) => clients.find((c) => c.id === id);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [_defaultStatus, setDefaultStatus] = useState<Task["status"]>("todo");
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

  const filteredTasks = tasks;

  const availableProjects = useMemo(
    () => formData.clientId ? projects.filter((p) => p.clientId === formData.clientId) : [],
    [formData.clientId, projects],
  );

  const openNewDialog = useCallback((status: Task["status"] = "todo") => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormData({ title: "", description: "", clientId: "", projectId: "", assignees: [], status, priority: "medium", dueDate: "", bu: "kora-dev" });
    setIsDialogOpen(true);
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
    });
    setIsDialogOpen(true);
  }, []);

  const openViewDialog = useCallback((task: Task) => {
    setViewingTask(task);
    setIsViewDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title || !formData.clientId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (editingTask) {
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
      });
    } else {
      addTask({
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        title: formData.title,
        description: formData.description,
        assignees: formData.assignees,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || "A definir",
        bu: formData.bu ? [formData.bu] : undefined,
      });
    }
    setIsDialogOpen(false);
  }, [formData, editingTask, updateTask, addTask]);

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
          <AssigneeAvatar key={i} name={name} size="sm" />
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar tarefas..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <ViewModeToggle modes={["kanban", "list", "grid"]} currentMode={viewMode} onChange={setViewMode} />
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {statusColumns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              const Icon = column.icon;
              return (
                <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Icon className={cn("w-4 h-4", column.id === "done" ? "text-green-500" : "text-muted-foreground")} />
                    <span className="font-semibold text-foreground">{column.label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{columnTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    {columnTasks.map((task, index) => (
                      <div key={task.id} className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer animate-scale-in" style={{ animationDelay: `${index * 50}ms` }} onClick={() => openViewDialog(task)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", priorityConfig[task.priority].color)} />
                            <span className="text-xs text-muted-foreground">{priorityConfig[task.priority].label}</span>
                            {task.bu?.[0] && <BUBadge bu={task.bu[0]} showLabel={false} />}
                          </div>
                          <ActionMenu items={[
                            { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(task) },
                            { label: "Editar", icon: Edit, onClick: () => openEditDialog(task) },
                            { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTaskId(task.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                          ]} />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                            <ClientAvatar client={getClient(task.clientId)} size="xs" />
                            {getClientName(task.clientId)}
                          </span>
                          {getProjectName(task.projectId) && (
                            <span className="px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">{getProjectName(task.projectId)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          {renderDeadlineIndicator(task)}
                          {renderAssignees(task.assignees)}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => openNewDialog(column.id as Task["status"])} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-input hover:border-primary/50 transition-all">
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
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", task.status === "done" ? "bg-green-500/10 text-green-500" : task.status === "in_progress" ? "bg-primary/10 text-primary" : task.status === "review" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground")}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
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
            </div>
            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <MultiSelect
                options={TEAM_OPTIONS}
                value={formData.assignees}
                onChange={(value) => setFormData({ ...formData, assignees: value })}
                placeholder="Adicionar responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bu">BU</Label>
              <BUSelect value={formData.bu} onChange={(bu) => setFormData({ ...formData, bu })} />
            </div>
          </DialogBody>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={isAdding || isUpdating} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes da Tarefa</DialogTitle>
          </DialogHeader>
          {viewingTask && (
            <DialogBody className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", viewingTask.status === "done" ? "bg-green-500/10 text-green-500" : viewingTask.status === "in_progress" ? "bg-primary/10 text-primary" : viewingTask.status === "review" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground")}>
                  {statusColumns.find(s => s.id === viewingTask.status)?.label}
                </span>
                <div className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", priorityConfig[viewingTask.priority].color)} />
                  <span className="text-xs text-muted-foreground">{priorityConfig[viewingTask.priority].label}</span>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{viewingTask.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">{getClientName(viewingTask.clientId)}</span>
                  {getProjectName(viewingTask.projectId) && (
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">{getProjectName(viewingTask.projectId)}</span>
                  )}
                </div>
              </div>
              {viewingTask.description && (
                <p className="text-muted-foreground">{viewingTask.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                  {renderDeadlineIndicator(viewingTask)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Responsáveis</p>
                  {viewingTask.assignees && viewingTask.assignees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingTask.assignees.map((name, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <AssigneeAvatar name={name} size="md" />
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Não atribuído
                    </p>
                  )}
                </div>
              </div>
          </DialogBody>
          )}
          <DialogFooter>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">Fechar</button>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingTask) openEditDialog(viewingTask); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Editar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
