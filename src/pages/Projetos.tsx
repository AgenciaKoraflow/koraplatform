import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Calendar, Clock, Search, Eye, Edit, Trash2, AlertTriangle, CheckCircle, Timer, FolderKanban, ListChecks, ExternalLink, Circle, Ban, UserCheck, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { toast } from "sonner";
import { useProjectMutations } from "@/hooks/mutations/useProjectMutations";
import { Project } from "@/types/data";
import { BU } from "@/types/bu";
import { BUBadge } from "@/components/shared/BUBadge";
import { BUMultiSelect } from "@/components/shared/BUMultiSelect";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useProfileAvatarMap, useTeamOptions } from "@/hooks/useProfile";
import { differenceInDays, isValid } from "date-fns";
import { useProjects } from "@/hooks/useProjects";
import { useProjectTasks } from "@/hooks/useTasks";
import { useAllClients } from "@/hooks/useClients";
import { useDebounce } from "@/hooks/useDebounce";
import { ProjectGantt } from "@/components/shared/ProjectGantt";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateTaskDialog } from "@/components/tarefas/CreateTaskDialog";

const typeConfig = {
  projeto: { label: "Projeto", color: "bg-primary/10 text-primary" },
  sustentacao: { label: "Sustentação", color: "bg-primary/10 text-primary" },
  consultoria: { label: "Consultoria", color: "bg-muted/10 text-muted-foreground" },
};

const statusConfig = {
  planning: { label: "Planejamento", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  in_progress: { label: "Em Andamento", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  review: { label: "Em Validação Interna", color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-500", dot: "bg-green-500" },
  on_hold: { label: "Em Espera", color: "bg-slate-500/10 text-slate-500", dot: "bg-slate-500" },
};

const statusOrder: (keyof typeof statusConfig)[] = ["planning", "in_progress", "review", "completed", "on_hold"];

const taskStatusConfig = {
  todo: { label: "A Fazer", color: "text-slate-400", dot: "bg-slate-400", bg: "bg-slate-500/10" },
  in_progress: { label: "Em Andamento", color: "text-primary", dot: "bg-primary", bg: "bg-primary/10" },
  blocked: { label: "Impedimento", color: "text-red-400", dot: "bg-red-400", bg: "bg-red-500/10" },
  review: { label: "Em Validação Interna", color: "text-amber-400", dot: "bg-amber-400", bg: "bg-amber-500/10" },
  client_review: { label: "Em Cliente", color: "text-purple-400", dot: "bg-purple-400", bg: "bg-purple-500/10" },
  done: { label: "Concluído", color: "text-green-400", dot: "bg-green-400", bg: "bg-green-500/10" },
};

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getMonthKey(dueDate: string): string {
  if (!dueDate || dueDate === "A definir") return "Sem data";
  const m = dueDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${MONTHS_PT[+m[2] - 1]} ${m[3]}`;
  const d = new Date(dueDate);
  if (!isNaN(d.getTime())) return `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
  return "Sem data";
}

function parseTaskDate(d: string): number {
  if (!d || d === "A definir") return Infinity;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  const ts = new Date(d).getTime();
  return isNaN(ts) ? Infinity : ts;
}

const PAGE_SIZE = 50;

export default function Projetos() {
  const { addProject, updateProject, deleteProject, isAdding, isUpdating } = useProjectMutations();
  const getAvatarForName = useProfileAvatarMap();
  const teamOptions = useTeamOptions();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedBU, setSelectedBU] = useState<BU | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedHead, setSelectedHead] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const searchQuery = useDebounce(searchInput, 300);

  const { data: projectData } = useProjects({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery || undefined,
    status: selectedStatus || undefined,
    clientId: selectedClientId || undefined,
  });
  const { data: allClients = [] } = useAllClients();

  const rawProjects = projectData?.projects ?? [];

  // BU filter applied client-side (not in server-side filter list yet)
  const projects = selectedBU
    ? rawProjects.filter((p) =>
      Array.isArray(p.bu) ? p.bu.includes(selectedBU) : p.bu === selectedBU,
    )
    : rawProjects;

  const getClient = (id: string) => allClients.find((c) => c.id === id);
  const clients = allClients;

  // Tasks for viewing project (loaded on-demand when view dialog opens)
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const { data: viewingProjectTasks = [] } = useProjectTasks(viewingProject?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [viewDialogTab, setViewDialogTab] = useState<"resumo" | "gantt">("resumo");
  const [showNoDueDateTasks, setShowNoDueDateTasks] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    description: "",
    status: "planning" as Project["status"],
    dueDate: "",
    team: "",
    head: "",
    value: "",
    billingType: "projeto" as "projeto" | "implantacao_recorrencia",
    type: "projeto" as "projeto" | "sustentacao" | "consultoria",
    recurrenceValue: "",
    recurrenceStartDate: "",
    bu: [] as BU[],
  });

  const availableHeads = useMemo(() => {
    const heads = rawProjects.map((p) => p.head).filter((h): h is string => !!h);
    return [...new Set(heads)].sort();
  }, [rawProjects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedType && p.type !== selectedType) return false;
      if (selectedHead && p.head !== selectedHead) return false;
      return true;
    });
  }, [projects, selectedType, selectedHead]);

  const handleSearchChange = useCallback((v: string) => { setSearchInput(v); setPage(0); }, []);

  const openNewDialog = useCallback(() => {
    setEditingProject(null);
    setFormData({ name: "", clientId: "", description: "", status: "planning", dueDate: "", team: "", head: "", value: "", billingType: "projeto", type: "projeto", recurrenceValue: "", recurrenceStartDate: "", bu: [] });
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientId: project.clientId,
      description: project.description,
      status: project.status,
      dueDate: project.dueDate,
      team: project.team.join(", "),
      head: project.head || "",
      value: project.value || "",
      billingType: project.billingType || "projeto",
      type: project.type || "projeto",
      recurrenceValue: project.recurrenceValue || "",
      recurrenceStartDate: project.recurrenceStartDate || "",
      bu: (Array.isArray(project.bu) ? project.bu : (project.bu ? [project.bu] : [])) as BU[],
    });
    setIsDialogOpen(true);
  }, []);

  const openViewDialog = useCallback((project: Project) => {
    setViewingProject(project);
    setViewDialogTab("resumo");
    setShowNoDueDateTasks(false);
    setIsViewDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name || !formData.clientId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (!formData.value) {
      toast.error("Informe o valor do projeto");
      return;
    }
    if (formData.billingType === "implantacao_recorrencia" && !formData.recurrenceValue) {
      toast.error("Informe o valor da recorrência");
      return;
    }
    if (!formData.dueDate) {
      toast.error("Informe o prazo do projeto");
      return;
    }
    const teamArray = formData.team.split(",").map(t => t.trim()).filter(Boolean);
    if (editingProject) {
      updateProject(editingProject.id, {
        name: formData.name,
        clientId: formData.clientId,
        description: formData.description,
        status: formData.status,
        dueDate: formData.dueDate || "A definir",
        team: teamArray,
        head: formData.head || undefined,
        value: formData.value || undefined,
        billingType: formData.billingType,
        type: formData.type,
        recurrenceValue: formData.recurrenceValue || undefined,
        recurrenceStartDate: formData.recurrenceStartDate || undefined,
        bu: formData.bu,
      });
    } else {
      addProject({
        clientId: formData.clientId,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        progress: 0,
        dueDate: formData.dueDate || "A definir",
        team: teamArray,
        tasks: 0,
        completedTasks: 0,
        head: formData.head || undefined,
        value: formData.value || undefined,
        billingType: formData.billingType,
        type: formData.type,
        recurrenceValue: formData.recurrenceValue || undefined,
        recurrenceStartDate: formData.recurrenceStartDate || undefined,
        bu: formData.bu,
      });
    }
    setIsDialogOpen(false);
  }, [formData, editingProject, updateProject, addProject]);

  const handleDelete = useCallback(() => {
    if (deletingProjectId) {
      deleteProject(deletingProjectId);
      setIsDeleteDialogOpen(false);
      setDeletingProjectId(null);
    }
  }, [deletingProjectId, deleteProject]);

  const projectsByStatus = useMemo(() => {
    const map: Record<string, typeof filteredProjects> = {};
    for (const p of filteredProjects) (map[p.status] ??= []).push(p);
    return map;
  }, [filteredProjects]);

  const getProjectsByStatus = useCallback(
    (status: string) => projectsByStatus[status] ?? [],
    [projectsByStatus],
  );

  const getClientName = useCallback((clientId: string) => {
    const client = allClients.find((c) => c.id === clientId);
    return client?.company || "Cliente não encontrado";
  }, [allClients]);

  // Calculate deadline status for visual indicator
  const getDeadlineStatus = (dueDate: string, progress: number, projectStatus?: Project["status"]): {
    daysRemaining: number | null;
    isOverdue: boolean;
    isAtRisk: boolean;
    isOnTrack: boolean;
    status: 'overdue' | 'at_risk' | 'on_track' | 'completed' | 'no_date';
  } => {
    // Project explicitly marked as completed — never show overdue
    if (projectStatus === "completed" || progress >= 100) {
      return { daysRemaining: null, isOverdue: false, isAtRisk: false, isOnTrack: true, status: 'completed' };
    }

    if (!dueDate || dueDate === "A definir") {
      return { daysRemaining: null, isOverdue: false, isAtRisk: false, isOnTrack: false, status: 'no_date' };
    }

    // Parse date in DD/MM/YYYY format
    const ddmmyyyy = dueDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    let deadline: Date;

    if (ddmmyyyy) {
      deadline = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    } else {
      deadline = new Date(dueDate);
    }

    if (!isValid(deadline)) {
      return { daysRemaining: null, isOverdue: false, isAtRisk: false, isOnTrack: false, status: 'no_date' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const daysRemaining = differenceInDays(deadline, today);

    // Calculate expected progress based on time elapsed (assuming project started 30 days ago or use creation date)
    // For simplicity, we'll use a basic heuristic
    const isOverdue = daysRemaining < 0;
    const isAtRisk = daysRemaining >= 0 && daysRemaining <= 7 && progress < 80;
    const isOnTrack = !isOverdue && !isAtRisk;

    return {
      daysRemaining,
      isOverdue,
      isAtRisk,
      isOnTrack,
      status: isOverdue ? 'overdue' : isAtRisk ? 'at_risk' : 'on_track'
    };
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={FolderKanban}
          title="Projetos"
          subtitle="Acompanhe o progresso de todos os projetos"
          actions={
            <button
              onClick={openNewDialog}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow"
            >
              <Plus className="w-4 h-4" />
              Novo Projeto
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <ViewModeToggle
            modes={["grid", "kanban", "list"]}
            currentMode={viewMode}
            onChange={setViewMode}
          />

          <div className="flex items-center gap-2 overflow-x-auto">
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = projects.filter(p => p.status === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedStatus(selectedStatus === key ? null : key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    selectedStatus === key
                      ? config.color + " border-current"
                      : "bg-input hover:bg-muted border-border"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", config.dot)} />
                  <span className="text-foreground">{config.label}</span>
                  <span className="text-muted-foreground">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Filters - Cliente e BU */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Cliente Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Cliente:</span>
            <select
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company}
                </option>
              ))}
            </select>
          </div>

          {/* BU Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">BU:</span>
            <select
              value={selectedBU || ""}
              onChange={(e) => setSelectedBU((e.target.value as BU) || null)}
              className="px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todas</option>
              <option value="kora-agents">Kora Agents</option>
              <option value="kora-dev">Kora Dev</option>
              <option value="kora-studio">Kora Studio</option>
              <option value="kora-corp">Kora Corp</option>
            </select>
          </div>

          {/* Tipo Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Tipo:</span>
            <select
              value={selectedType || ""}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos</option>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Head Filter */}
          {availableHeads.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Head:</span>
              <select
                value={selectedHead || ""}
                onChange={(e) => setSelectedHead(e.target.value || null)}
                className="px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todos</option>
                {availableHeads.map((head) => (
                  <option key={head} value={head}>{head}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => {
              const deadlineStatus = getDeadlineStatus(project.dueDate, project.progress, project.status);

              return (
                <div
                  key={project.id}
                  onClick={() => openViewDialog(project)}
                  className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[project.status].color)}>
                        {statusConfig[project.status].label}
                      </span>
                      {project.bu?.[0] && <BUBadge bu={project.bu[0]} />}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        items={[
                          { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(project) },
                          { label: "Editar", icon: Edit, onClick: () => openEditDialog(project) },
                          { label: "Excluir", icon: Trash2, onClick: () => { setDeletingProjectId(project.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                        ]}
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
                  <div className="flex items-center gap-1.5 mb-3">
                    <ClientAvatar client={getClient(project.clientId)} size="xs" />
                    <p className="text-sm text-muted-foreground">{getClientName(project.clientId)}</p>
                  </div>

                  {/* Head do projeto */}
                  {project.head && (
                    <div className="flex items-center gap-2 mb-3">
                      <UserAvatar name={project.head} src={getAvatarForName(project.head)} size="xs" />
                      <span className="text-xs text-muted-foreground">Head: <span className="font-medium text-foreground">{project.head}</span></span>
                    </div>
                  )}

                  {/* Deadline status indicator */}
                  {deadlineStatus.status !== 'no_date' && deadlineStatus.status !== 'completed' && (
                    <div className={cn(
                      "flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md text-xs font-medium",
                      deadlineStatus.isOverdue
                        ? "bg-red-500/10 text-red-500"
                        : deadlineStatus.isAtRisk
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-green-500/10 text-green-500"
                    )}>
                      {deadlineStatus.isOverdue ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Atrasado {Math.abs(deadlineStatus.daysRemaining || 0)} dias</span>
                        </>
                      ) : deadlineStatus.isAtRisk ? (
                        <>
                          <Timer className="w-3 h-3" />
                          <span>{deadlineStatus.daysRemaining} dias restantes</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>{deadlineStatus.daysRemaining} dias restantes</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium text-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          deadlineStatus.isOverdue ? "bg-red-500" : deadlineStatus.isAtRisk ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{project.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{project.completedTasks}/{project.tasks}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member, i) => (
                          <UserAvatar key={i} name={member} src={getAvatarForName(member)} size="sm" />
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">+{project.team.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statusOrder.map((status) => (
              <div key={status} className="flex-shrink-0 w-80">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className={cn("w-2 h-2 rounded-full", statusConfig[status].dot)} />
                  <span className="font-semibold text-foreground">{statusConfig[status].label}</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                    {getProjectsByStatus(status).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {getProjectsByStatus(status).map((project) => {
                    const deadlineStatus = getDeadlineStatus(project.dueDate, project.progress, project.status);

                    return (
                      <div
                        key={project.id}
                        onClick={() => openViewDialog(project)}
                        className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
                      >
                        <h4 className="font-medium text-foreground mb-1">{project.name}</h4>
                        <div className="flex items-center gap-1.5 mb-2">
                          <ClientAvatar client={getClient(project.clientId)} size="xs" />
                          <p className="text-sm text-muted-foreground">{getClientName(project.clientId)}</p>
                        </div>

                        {/* Head do projeto */}
                        {project.head && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <UserAvatar name={project.head} src={getAvatarForName(project.head)} size="xs" />
                            <span className="text-xs text-muted-foreground">{project.head}</span>
                          </div>
                        )}

                        {/* Deadline status */}
                        {deadlineStatus.status !== 'no_date' && deadlineStatus.status !== 'completed' && (
                          <div className={cn(
                            "flex items-center gap-1 mb-2 text-xs font-medium",
                            deadlineStatus.isOverdue ? "text-red-500" : deadlineStatus.isAtRisk ? "text-amber-500" : "text-green-500"
                          )}>
                            {deadlineStatus.isOverdue ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Atrasado {Math.abs(deadlineStatus.daysRemaining || 0)}d</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>{deadlineStatus.daysRemaining}d</span>
                              </>
                            )}
                          </div>
                        )}

                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              deadlineStatus.isOverdue ? "bg-red-500" : deadlineStatus.isAtRisk ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project.dueDate}</span>
                          <span>{project.completedTasks}/{project.tasks} tarefas</span>
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={openNewDialog} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-input hover:border-primary/50 transition-all">
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Projeto</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Head</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Progresso</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Prazo</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((project) => {
                  const deadlineStatus = getDeadlineStatus(project.dueDate, project.progress, project.status);

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => openViewDialog(project)}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">{project.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ClientAvatar client={getClient(project.clientId)} size="xs" />
                          <span className="text-muted-foreground text-sm">{getClientName(project.clientId)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {project.head ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={project.head} src={getAvatarForName(project.head)} size="sm" />
                            <span className="text-sm text-foreground">{project.head}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[project.status].color)}>
                          {statusConfig[project.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                deadlineStatus.isOverdue ? "bg-red-500" : deadlineStatus.isAtRisk ? "bg-amber-500" : "bg-primary"
                              )}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">{project.dueDate}</span>
                          {deadlineStatus.status !== 'no_date' && deadlineStatus.status !== 'completed' && (
                            <span className={cn(
                              "text-xs font-medium",
                              deadlineStatus.isOverdue ? "text-red-500" : deadlineStatus.isAtRisk ? "text-amber-500" : "text-green-500"
                            )}>
                              {deadlineStatus.isOverdue
                                ? `Atrasado ${Math.abs(deadlineStatus.daysRemaining || 0)} dias`
                                : `${deadlineStatus.daysRemaining} dias restantes`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          items={[
                            { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(project) },
                            { label: "Editar", icon: Edit, onClick: () => openEditDialog(project) },
                            { label: "Excluir", icon: Trash2, onClick: () => { setDeletingProjectId(project.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
            <DialogDescription>
              {editingProject ? "Atualize as informações do projeto" : "Preencha os dados para criar um novo projeto"}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do projeto" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.company} - {client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição do projeto" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor do Projeto *</Label>
              <CurrencyInput id="value" value={formData.value} onChange={(value) => setFormData({ ...formData, value })} placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingType">Tipo de Faturamento</Label>
              <Select value={formData.billingType} onValueChange={(value) => setFormData({ ...formData, billingType: value as typeof formData.billingType })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="projeto">Projeto</SelectItem>
                  <SelectItem value="implantacao_recorrencia">Implantação + Recorrência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.billingType === "implantacao_recorrencia" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceValue">Valor da Recorrência Mensal</Label>
                  <CurrencyInput id="recurrenceValue" value={formData.recurrenceValue} onChange={(value) => setFormData({ ...formData, recurrenceValue: value })} placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrenceStartDate">Data de Início da Recorrência</Label>
                  <DatePicker
                    value={formData.recurrenceStartDate}
                    onChange={(value) => setFormData({ ...formData, recurrenceStartDate: value })}
                    placeholder="Selecione a data"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Projeto</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bu">BU</Label>
              <BUMultiSelect value={formData.bu} onChange={(bu) => setFormData({ ...formData, bu })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Project["status"] })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Prazo</Label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(value) => setFormData({ ...formData, dueDate: value })}
                  placeholder="Selecione o prazo"
                />
                {formData.dueDate && (() => {
                  const ds = getDeadlineStatus(formData.dueDate, editingProject?.progress || 0, formData.status);
                  if (ds.status === "no_date" || ds.status === "completed") return null;
                  const label = ds.isOverdue
                    ? `Atrasado ${Math.abs(ds.daysRemaining || 0)} dias`
                    : `${ds.daysRemaining} dias restantes`;
                  const color = ds.isOverdue ? "text-red-500" : ds.isAtRisk ? "text-amber-500" : "text-green-500";
                  return <p className={cn("text-xs", color)}>{label}</p>;
                })()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team">Equipe</Label>
                <Select value="none" onValueChange={(value) => {
                  if (value !== "none") {
                    const currentTeam = formData.team.split(",").map(t => t.trim()).filter(Boolean);
                    if (!currentTeam.includes(value)) {
                      setFormData({ ...formData, team: [...currentTeam, value].join(", ") });
                    }
                  }
                }}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Adicionar membro" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Selecione para adicionar</SelectItem>
                    {teamOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.team && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.team.split(",").map(t => t.trim()).filter(Boolean).map((member, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                        {member}
                        <button type="button" onClick={() => {
                          const newTeam = formData.team.split(",").map(t => t.trim()).filter(t => t !== member).join(", ");
                          setFormData({ ...formData, team: newTeam });
                        }} className="hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="head">Head</Label>
                <Select value={formData.head || "none"} onValueChange={(value) => setFormData({ ...formData, head: value === "none" ? "" : value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione o Head" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {teamOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
        <DialogContent className="bg-card border-border sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Projeto</DialogTitle>
            <DialogDescription>
              Visualize todas as informações do projeto
            </DialogDescription>
          </DialogHeader>
          {viewingProject && (
            <DialogBody className="py-2 min-h-[65vh]">
              {/* Header: status + name always visible above tabs */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium", statusConfig[viewingProject.status].color)}>
                    {statusConfig[viewingProject.status].label}
                  </span>
                  <span className="text-sm text-muted-foreground">{viewingProject.dueDate}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewingProject.name}</h3>
                  <p className="text-muted-foreground">{getClientName(viewingProject.clientId)}</p>
                </div>
              </div>

              <Tabs value={viewDialogTab} onValueChange={(v) => setViewDialogTab(v as "resumo" | "gantt")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="gantt">Gantt</TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="space-y-4 mt-0">
                  {viewingProject.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{viewingProject.description}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{viewingProject.progress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${viewingProject.progress}%` }} />
                    </div>
                  </div>
                  {/* Task breakdown */}
                  {viewingProjectTasks.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5" />
                          Tarefas ({viewingProjectTasks.length})
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsCreateTaskDialogOpen(true)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Nova Tarefa
                          </button>
                          <button
                            onClick={() => { setIsViewDialogOpen(false); navigate(`/tarefas?project=${viewingProject.id}`); }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Ver todas <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { key: "todo", label: "A Fazer", icon: Circle, color: "text-slate-400 bg-slate-500/10" },
                          { key: "in_progress", label: "Em Andamento", icon: Clock, color: "text-primary bg-primary/10" },
                          { key: "blocked", label: "Impedimento", icon: Ban, color: "text-red-400 bg-red-500/10" },
                          { key: "review", label: "Em Validação Interna", icon: Eye, color: "text-amber-400 bg-amber-500/10" },
                          { key: "client_review", label: "Em Cliente", icon: UserCheck, color: "text-purple-400 bg-purple-500/10" },
                          { key: "done", label: "Concluído", icon: CheckCircle2, color: "text-green-400 bg-green-500/10" },
                        ].map(({ key, label, icon: Icon, color }) => {
                          const count = viewingProjectTasks.filter((t) => t.status === key).length;
                          if (count === 0) return null;
                          return (
                            <div key={key} className={cn("rounded-lg p-2", color)}>
                              <Icon className="w-4 h-4 mx-auto mb-0.5" />
                              <p className="text-lg font-bold">{count}</p>
                              <p className="text-xs opacity-80">{label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Roadmap */}
                  {viewingProjectTasks.length > 0 && (() => {
                    const sorted = [...viewingProjectTasks].sort((a, b) => parseTaskDate(a.dueDate) - parseTaskDate(b.dueDate));
                    const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, task) => {
                      const key = getMonthKey(task.dueDate);
                      (acc[key] ??= []).push(task);
                      return acc;
                    }, {});
                    const noDueDateTasks = grouped["Sem data"] ?? [];
                    const monthEntries = Object.entries(grouped).filter(([month]) => month !== "Sem data");

                    const renderTaskRow = (task: (typeof sorted)[0]) => {
                      const cfg = taskStatusConfig[task.status];
                      return (
                        <div key={task.id} className="flex items-start gap-3">
                          <div className={cn("w-3.5 h-3.5 rounded-full border-2 border-card mt-0.5 shrink-0 z-10", cfg.dot)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                              <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium", cfg.bg, cfg.color)}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              {task.dueDate && task.dueDate !== "A definir" && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {task.dueDate}
                                </span>
                              )}
                              {task.assignees.length > 0 && (
                                <span>
                                  {task.assignees.slice(0, 2).join(", ")}
                                  {task.assignees.length > 2 ? ` +${task.assignees.length - 2}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Roadmap
                        </p>

                        {noDueDateTasks.length > 0 && (
                          <div className="mb-4">
                            <button
                              onClick={() => setShowNoDueDateTasks(v => !v)}
                              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{noDueDateTasks.length} tarefa{noDueDateTasks.length > 1 ? "s" : ""} sem prazo definido</span>
                              {showNoDueDateTasks ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                            {showNoDueDateTasks && (
                              <div className="mt-2.5 ml-2 pl-3 border-l-2 border-amber-500/30 space-y-2.5">
                                {noDueDateTasks.map(renderTaskRow)}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="relative">
                          <div className="absolute left-[6px] top-2 bottom-2 w-px bg-border" />
                          {monthEntries.map(([month, tasks]) => (
                            <div key={month} className="mb-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 ml-6">{month}</p>
                              <div className="space-y-2.5">
                                {tasks.map(renderTaskRow)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Equipe</p>
                      <div className="flex -space-x-2">
                        {viewingProject.team.map((member, i) => (
                          <UserAvatar key={i} name={member} src={getAvatarForName(member)} size="md" />
                        ))}
                      </div>
                    </div>
                    {viewingProject.value && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Valor</p>
                        <p className="font-semibold text-foreground">{viewingProject.value}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="gantt" className="mt-0">
                  <ProjectGantt project={viewingProject} tasks={viewingProjectTasks} />
                </TabsContent>
              </Tabs>
            </DialogBody>
          )}
          <DialogFooter>
            <button
              onClick={() => setIsCreateTaskDialogOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors mr-auto"
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">Fechar</button>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingProject) openEditDialog(viewingProject); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Editar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog (pre-linked to current project) */}
      {viewingProject && (
        <CreateTaskDialog
          open={isCreateTaskDialogOpen}
          onOpenChange={setIsCreateTaskDialogOpen}
          defaultClientId={viewingProject.clientId}
          defaultProjectId={viewingProject.id}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e todas as tarefas associadas serão removidas."
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
