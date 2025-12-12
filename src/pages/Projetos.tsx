import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Calendar, Clock, Search, Eye, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  client: string;
  status: "planning" | "in_progress" | "review" | "completed";
  progress: number;
  dueDate: string;
  team: string[];
  tasks: { completed: number; total: number };
}

const initialProjects: Project[] = [
  { id: "1", name: "Chatbot de Atendimento", client: "TechCorp", status: "in_progress", progress: 65, dueDate: "15 Jan 2025", team: ["CS", "AM", "PC"], tasks: { completed: 13, total: 20 } },
  { id: "2", name: "Sistema de Recomendação", client: "SmartRetail", status: "planning", progress: 15, dueDate: "28 Jan 2025", team: ["MO", "LM"], tasks: { completed: 3, total: 18 } },
  { id: "3", name: "Automação de Processos", client: "InnovateLab", status: "in_progress", progress: 40, dueDate: "10 Fev 2025", team: ["AS", "JF", "CS"], tasks: { completed: 8, total: 22 } },
  { id: "4", name: "Analytics Dashboard", client: "DataFlow Inc", status: "review", progress: 90, dueDate: "05 Jan 2025", team: ["PC", "AM"], tasks: { completed: 17, total: 19 } },
  { id: "5", name: "Modelo Preditivo", client: "FinTech Plus", status: "completed", progress: 100, dueDate: "20 Dez 2024", team: ["JF", "LM", "MO"], tasks: { completed: 15, total: 15 } },
  { id: "6", name: "Integração API IA", client: "AIStartup", status: "planning", progress: 5, dueDate: "20 Fev 2025", team: ["CS"], tasks: { completed: 1, total: 12 } },
];

const statusConfig = {
  planning: { label: "Planejamento", color: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
  in_progress: { label: "Em Andamento", color: "bg-primary/10 text-primary", dot: "bg-primary" },
  review: { label: "Em Revisão", color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-500", dot: "bg-green-500" },
};

const statusOrder: (keyof typeof statusConfig)[] = ["planning", "in_progress", "review", "completed"];

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
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
    client: "",
    status: "planning" as Project["status"],
    dueDate: "",
    team: "",
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const openNewDialog = () => {
    setEditingProject(null);
    setFormData({ name: "", client: "", status: "planning", dueDate: "", team: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      status: project.status,
      dueDate: project.dueDate,
      team: project.team.join(", "),
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (project: Project) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.client) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingProject) {
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, ...formData, team: formData.team.split(",").map(t => t.trim()).filter(Boolean) }
          : p
      ));
      toast.success("Projeto atualizado com sucesso!");
    } else {
      const newProject: Project = {
        id: Date.now().toString(),
        name: formData.name,
        client: formData.client,
        status: formData.status,
        progress: 0,
        dueDate: formData.dueDate || "A definir",
        team: formData.team.split(",").map(t => t.trim()).filter(Boolean),
        tasks: { completed: 0, total: 0 },
      };
      setProjects([...projects, newProject]);
      toast.success("Projeto criado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingProjectId) {
      setProjects(projects.filter(p => p.id !== deletingProjectId));
      toast.success("Projeto removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProjectId(null);
    }
  };

  const getProjectsByStatus = (status: string) => 
    filteredProjects.filter(p => p.status === status);

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
                <p className="text-sm text-muted-foreground mb-4">{project.client}</p>
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
                      <span>{project.tasks.completed}/{project.tasks.total}</span>
                    </div>
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{member}</span>
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
                      <p className="text-sm text-muted-foreground mb-3">{project.client}</p>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.dueDate}</span>
                        <span>{project.tasks.completed}/{project.tasks.total} tarefas</span>
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
                    <td className="px-6 py-4 text-muted-foreground">{project.client}</td>
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
              <Input id="client" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="Nome do cliente" className="bg-secondary/50 border-border" />
            </div>
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
              <Input id="dueDate" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} placeholder="DD/MM/AAAA" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Equipe (iniciais separadas por vírgula)</Label>
              <Input id="team" value={formData.team} onChange={(e) => setFormData({ ...formData, team: e.target.value })} placeholder="CS, AM, PC" className="bg-secondary/50 border-border" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{editingProject ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Projeto</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{viewingProject.name}</h3>
                <p className="text-muted-foreground">{viewingProject.client}</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[viewingProject.status].color)}>{statusConfig[viewingProject.status].label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Progresso</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${viewingProject.progress}%` }} />
                    </div>
                    <span className="text-foreground">{viewingProject.progress}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo</span>
                  <span className="text-foreground">{viewingProject.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarefas</span>
                  <span className="text-foreground">{viewingProject.tasks.completed}/{viewingProject.tasks.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Equipe</span>
                  <div className="flex -space-x-2">
                    {viewingProject.team.map((member, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingProject) openEditDialog(viewingProject); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Excluir Projeto" description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} variant="destructive" />
    </AppLayout>
  );
}
