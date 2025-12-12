import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Calendar, CheckCircle2, Circle, Clock, Eye, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
}

const initialTasks: Task[] = [
  { id: "1", title: "Implementar autenticação OAuth", description: "Adicionar login com Google e Microsoft", project: "TechCorp - Chatbot", assignee: "CS", status: "in_progress", priority: "high", dueDate: "Hoje" },
  { id: "2", title: "Design do dashboard", description: "Criar mockups para o painel de controle", project: "SmartRetail - Recomendação", assignee: "AM", status: "review", priority: "medium", dueDate: "Amanhã" },
  { id: "3", title: "Treinar modelo NLP", description: "Fine-tuning do modelo de linguagem", project: "InnovateLab - Automação", assignee: "PC", status: "todo", priority: "urgent", dueDate: "Hoje" },
  { id: "4", title: "Documentação da API", description: "Escrever docs no Swagger", project: "DataFlow - Analytics", assignee: "MO", status: "done", priority: "low", dueDate: "Ontem" },
  { id: "5", title: "Testes de integração", description: "Testar endpoints de IA", project: "TechCorp - Chatbot", assignee: "LM", status: "in_progress", priority: "high", dueDate: "Amanhã" },
  { id: "6", title: "Setup do ambiente", description: "Configurar Docker e CI/CD", project: "AIStartup - API", assignee: "JF", status: "todo", priority: "medium", dueDate: "3 dias" },
];

const statusColumns = [
  { id: "todo", label: "A Fazer", icon: Circle },
  { id: "in_progress", label: "Em Progresso", icon: Clock },
  { id: "review", label: "Em Revisão", icon: CheckCircle2 },
  { id: "done", label: "Concluído", icon: CheckCircle2 },
];

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500" },
  medium: { label: "Média", color: "bg-blue-500" },
  high: { label: "Alta", color: "bg-amber-500" },
  urgent: { label: "Urgente", color: "bg-red-500" },
};

export default function Tarefas() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<Task["status"]>("todo");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    assignee: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    dueDate: "",
  });

  const getTasksByStatus = (status: string) => 
    tasks.filter(task => 
      task.status === status && 
      (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       task.project.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openNewDialog = (status: Task["status"] = "todo") => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormData({ title: "", description: "", project: "", assignee: "", status, priority: "medium", dueDate: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description, project: task.project, assignee: task.assignee, status: task.status, priority: task.priority, dueDate: task.dueDate });
    setIsDialogOpen(true);
  };

  const openViewDialog = (task: Task) => {
    setViewingTask(task);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.project) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
      toast.success("Tarefa atualizada com sucesso!");
    } else {
      const newTask: Task = { id: Date.now().toString(), ...formData };
      setTasks([...tasks, newTask]);
      toast.success("Tarefa criada com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingTaskId) {
      setTasks(tasks.filter(t => t.id !== deletingTaskId));
      toast.success("Tarefa removida com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingTaskId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
            <p className="text-muted-foreground mt-1">Gerencie as tarefas de todos os projetos</p>
          </div>
          <button onClick={() => openNewDialog()} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar tarefas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{columnTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    {columnTasks.map((task, index) => (
                      <div key={task.id} className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer animate-scale-in" style={{ animationDelay: `${index * 50}ms` }} onClick={() => openViewDialog(task)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", priorityConfig[task.priority].color)} />
                            <span className="text-xs text-muted-foreground">{priorityConfig[task.priority].label}</span>
                          </div>
                          <ActionMenu items={[
                            { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(task) },
                            { label: "Editar", icon: Edit, onClick: () => openEditDialog(task) },
                            { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTaskId(task.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                          ]} />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                        <div className="mb-3">
                          <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{task.project}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{task.assignee}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => openNewDialog(column.id as Task["status"])} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all">
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
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Tarefa</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Projeto</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Prioridade</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Prazo</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{task.project}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", task.status === "done" ? "bg-green-500/10 text-green-500" : task.status === "in_progress" ? "bg-primary/10 text-primary" : task.status === "review" ? "bg-amber-500/10 text-amber-500" : "bg-secondary text-muted-foreground")}>
                        {statusColumns.find(s => s.id === task.status)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", priorityConfig[task.priority].color)} />
                        <span className="text-sm">{priorityConfig[task.priority].label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{task.dueDate}</td>
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
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{task.project}</span>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{task.assignee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título da tarefa" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição da tarefa" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Projeto *</Label>
              <Input id="project" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} placeholder="Nome do projeto" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Task["status"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {statusColumns.map(col => <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task["priority"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(priorityConfig).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Responsável</Label>
                <Input id="assignee" value={formData.assignee} onChange={(e) => setFormData({ ...formData, assignee: e.target.value })} placeholder="Iniciais" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Prazo</Label>
                <Input id="dueDate" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} placeholder="DD/MM/AAAA" className="bg-secondary/50 border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{editingTask ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes da Tarefa</DialogTitle>
          </DialogHeader>
          {viewingTask && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{viewingTask.title}</h3>
                <p className="text-muted-foreground mt-1">{viewingTask.description}</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Projeto</span><span className="text-foreground">{viewingTask.project}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", viewingTask.status === "done" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary")}>{statusColumns.find(s => s.id === viewingTask.status)?.label}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Prioridade</span><div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", priorityConfig[viewingTask.priority].color)} /><span>{priorityConfig[viewingTask.priority].label}</span></div></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Responsável</span><div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-xs font-medium text-primary">{viewingTask.assignee}</span></div></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Prazo</span><span className="text-foreground">{viewingTask.dueDate}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingTask) openEditDialog(viewingTask); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Excluir Tarefa" description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} variant="destructive" />
    </AppLayout>
  );
}
