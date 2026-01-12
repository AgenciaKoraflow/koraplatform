import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Calendar, Clock, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { Project } from "@/types/data";

const statusConfig = {
  planning: { label: "Planejamento", color: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
  in_progress: { label: "Em Andamento", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  review: { label: "Em Revisão", color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-500", dot: "bg-green-500" },
  on_hold: { label: "Em Espera", color: "bg-slate-500/10 text-slate-500", dot: "bg-slate-500" },
};

const statusOrder: (keyof typeof statusConfig)[] = ["planning", "in_progress", "review", "completed", "on_hold"];

export default function Projetos() {
  const { projects, clients, addProject, updateProject, deleteProject, getClient, getTasksByProject } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    description: "",
    status: "planning" as Project["status"],
    dueDate: "",
    team: "",
    head: "",
  });

  const filteredProjects = projects.filter((project) => {
    const client = getClient(project.clientId);
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const openNewDialog = () => {
    setEditingProject(null);
    setFormData({ name: "", clientId: "", description: "", status: "planning", dueDate: "", team: "", head: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientId: project.clientId,
      description: project.description,
      status: project.status,
      dueDate: project.dueDate,
      team: project.team.join(", "),
      head: project.head || "",
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (project: Project) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.clientId) {
      toast.error("Preencha os campos obrigatórios");
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
      });
      toast.success("Projeto atualizado com sucesso!");
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
      });
      toast.success("Projeto criado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingProjectId) {
      deleteProject(deletingProjectId);
      toast.success("Projeto removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProjectId(null);
    }
  };

  const getProjectsByStatus = (status: string) => 
    filteredProjects.filter(p => p.status === status);

  const getClientName = (clientId: string) => {
    const client = getClient(clientId);
    return client?.company || "Cliente não encontrado";
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground mt-1">Acompanhe o progresso de todos os projetos</p>
          </div>
          <button 
            onClick={openNewDialog}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      : "bg-secondary/50 hover:bg-secondary border-border"
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

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[project.status].color)}>
                    {statusConfig[project.status].label}
                  </span>
                  <ActionMenu
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(project) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(project) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingProjectId(project.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]}
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{getClientName(project.clientId)}</p>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
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
                        <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{member.substring(0, 2)}</span>
                        </div>
                      ))}
                      {project.team.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">+{project.team.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
                    {getProjectsByStatus(status).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {getProjectsByStatus(status).map((project) => (
                    <div
                      key={project.id}
                      onClick={() => openViewDialog(project)}
                      className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
                    >
                      <h4 className="font-medium text-foreground mb-1">{project.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{getClientName(project.clientId)}</p>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.dueDate}</span>
                        <span>{project.completedTasks}/{project.tasks} tarefas</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={openNewDialog} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all">
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
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Projeto</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Progresso</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Prazo</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{project.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{getClientName(project.clientId)}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[project.status].color)}>
                        {statusConfig[project.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{project.dueDate}</td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        items={[
                          { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(project) },
                          { label: "Editar", icon: Edit, onClick: () => openEditDialog(project) },
                          { label: "Excluir", icon: Trash2, onClick: () => { setDeletingProjectId(project.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do projeto" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger className="bg-secondary/50 border-border">
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
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição do projeto" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Project["status"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
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
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Adicionar membro" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Selecione para adicionar</SelectItem>
                    <SelectItem value="James">James</SelectItem>
                    <SelectItem value="João">João</SelectItem>
                    <SelectItem value="Edson">Edson</SelectItem>
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
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Selecione o Head" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="James">James</SelectItem>
                    <SelectItem value="João">João</SelectItem>
                    <SelectItem value="Edson">Edson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Projeto</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-4 py-4">
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
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${viewingProject.progress}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tarefas</p>
                  <p className="font-semibold">{viewingProject.completedTasks} / {viewingProject.tasks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Equipe</p>
                  <div className="flex -space-x-2">
                    {viewingProject.team.map((member, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{member.substring(0, 2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Fechar</button>
            <button onClick={() => { setIsViewDialogOpen(false); viewingProject && openEditDialog(viewingProject); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Editar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
