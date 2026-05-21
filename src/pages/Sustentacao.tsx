import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Plus, Search, MessageSquare, AlertCircle, CheckCircle, Clock, Eye, Edit, Trash2, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";
import { useTicketMutations } from "@/hooks/mutations/useTicketMutations";
import { useTickets } from "@/hooks/useTickets";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useDebounce } from "@/hooks/useDebounce";
import { SupportTicket } from "@/types/data";

const statusConfig = {
  open: { label: "Aberto", color: "bg-primary/10 text-primary border-blue-500/20", icon: MessageSquare },
  in_progress: { label: "Em Andamento", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  waiting: { label: "Aguardando", color: "bg-muted/10 text-muted-foreground border-purple-500/20", icon: AlertCircle },
  resolved: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  closed: { label: "Fechado", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: CheckCircle },
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500" },
  medium: { label: "Média", color: "bg-primary" },
  high: { label: "Alta", color: "bg-amber-500" },
  critical: { label: "Crítica", color: "bg-red-500" },
};

export default function Sustentacao() {
  const { addTicket, updateTicket, deleteTicket, isAdding, isUpdating } = useTicketMutations();
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const { data: ticketData } = useTickets({ search: searchQuery || undefined, pageSize: 500 });
  const tickets = ticketData?.tickets ?? [];
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: "",
    projectId: "",
    status: "open" as SupportTicket["status"],
    priority: "medium" as SupportTicket["priority"],
    assignee: "",
  });

  const filteredTickets = useMemo(
    () => tickets.filter((ticket) => !selectedStatus || ticket.status === selectedStatus),
    [tickets, selectedStatus],
  );

  const availableProjects = useMemo(
    () => formData.clientId ? projects.filter((p) => p.clientId === formData.clientId) : [],
    [formData.clientId, projects],
  );

  const stats = useMemo(() => ({
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  }), [tickets]);

  const openNewDialog = useCallback(() => {
    setEditingTicket(null);
    setFormData({ title: "", description: "", clientId: "", projectId: "", status: "open", priority: "medium", assignee: "" });
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((ticket: SupportTicket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      clientId: ticket.clientId,
      projectId: ticket.projectIds?.[0] || "",
      status: ticket.status,
      priority: ticket.priority,
      assignee: ticket.assignee || "",
    });
    setIsDialogOpen(true);
  }, []);

  const openViewDialog = useCallback((ticket: SupportTicket) => {
    setViewingTicket(ticket);
    setIsViewDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title || !formData.clientId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    if (editingTicket) {
      updateTicket(editingTicket.id, {
        title: formData.title,
        description: formData.description,
        clientId: formData.clientId,
        projectIds: formData.projectId ? [formData.projectId] : [],
        status: formData.status,
        priority: formData.priority,
        assignee: formData.assignee || undefined,
        updatedAt: now,
      });
    } else {
      addTicket({
        clientId: formData.clientId,
        projectIds: formData.projectId ? [formData.projectId] : [],
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignee: formData.assignee || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
    setIsDialogOpen(false);
  }, [formData, editingTicket, updateTicket, addTicket]);

  const handleDelete = useCallback(() => {
    if (deletingTicketId) {
      deleteTicket(deletingTicketId);
      setIsDeleteDialogOpen(false);
      setDeletingTicketId(null);
    }
  }, [deletingTicketId, deleteTicket]);

  const getClientName = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company || "Cliente não encontrado";
  }, [clients]);

  const getProjectName = useCallback((projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name;
  }, [projects]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={LifeBuoy}
          title="Sustentação"
          subtitle="Suporte e acompanhamento pós-venda"
          actions={
            <button onClick={openNewDialog} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow">
              <Plus className="w-4 h-4" />
              Novo Ticket
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.open}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.waiting}</p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Resolvidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar tickets..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <ViewModeToggle modes={["table", "kanban", "grid"]} currentMode={viewMode} onChange={setViewMode} />

          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedStatus(null)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", !selectedStatus ? "bg-primary/10 text-primary border-primary/20" : "bg-input text-muted-foreground border-border hover:bg-muted")}>
              Todos
            </button>
            {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => (
              <button key={key} onClick={() => setSelectedStatus(selectedStatus === key ? null : key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", selectedStatus === key ? config.color : "bg-input text-muted-foreground border-border hover:bg-muted")}>
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente / Projeto</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Última Atualização</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket, index) => {
                  const StatusIcon = statusConfig[ticket.status].icon;
                  return (
                    <tr key={ticket.id} className="hover:bg-muted/20 transition-colors animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-xs text-primary mb-1">{ticket.id}</p>
                          <p className="font-medium text-foreground">{ticket.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{getClientName(ticket.clientId)}</p>
                        {getProjectName(ticket.projectIds?.[0]) && (
                          <p className="text-sm text-primary">{getProjectName(ticket.projectIds?.[0])}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit border", statusConfig[ticket.status].color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[ticket.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", priorityConfig[ticket.priority].color)} />
                          <span className="text-sm text-foreground">{priorityConfig[ticket.priority].label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.assignee ? (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{ticket.assignee.substring(0, 2)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{ticket.updatedAt}</td>
                      <td className="px-6 py-4 text-right">
                        <ActionMenu items={[
                          { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(ticket) },
                          { label: "Editar", icon: Edit, onClick: () => openEditDialog(ticket) },
                          { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTicketId(ticket.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(statusConfig).slice(0, 4).map(([statusKey, config]) => {
              const statusTickets = filteredTickets.filter(t => t.status === statusKey);
              const StatusIcon = config.icon;
              return (
                <div key={statusKey} className="flex-shrink-0 w-80">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <StatusIcon className={cn("w-4 h-4", config.color.split(" ")[1])} />
                    <span className="font-semibold text-foreground">{config.label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{statusTickets.length}</span>
                  </div>
                  <div className="space-y-3">
                    {statusTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer" onClick={() => openViewDialog(ticket)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-primary">{ticket.id}</span>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", priorityConfig[ticket.priority].color)} />
                            <span className="text-xs text-muted-foreground">{priorityConfig[ticket.priority].label}</span>
                          </div>
                        </div>
                        <h4 className="font-medium text-foreground mb-2">{ticket.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{getClientName(ticket.clientId)}</p>
                        {getProjectName(ticket.projectIds?.[0]) && (
                          <p className="text-xs text-primary mb-2">{getProjectName(ticket.projectIds?.[0])}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{ticket.updatedAt}</span>
                          {ticket.assignee && (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">{ticket.assignee.substring(0, 2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={openNewDialog} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-input hover:border-primary/50 transition-all">
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket, index) => {
              const StatusIcon = statusConfig[ticket.status].icon;
              return (
                <div key={ticket.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer animate-scale-in" style={{ animationDelay: `${index * 50}ms` }} onClick={() => openViewDialog(ticket)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-primary">{ticket.id}</span>
                    <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border", statusConfig[ticket.status].color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[ticket.status].label}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{ticket.title}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{getClientName(ticket.clientId)}</p>
                  {getProjectName(ticket.projectIds?.[0]) && (
                    <p className="text-xs text-primary mb-3">{getProjectName(ticket.projectIds?.[0])}</p>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-2 h-2 rounded-full", priorityConfig[ticket.priority].color)} />
                    <span className="text-xs text-muted-foreground">{priorityConfig[ticket.priority].label}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{ticket.updatedAt}</span>
                    {ticket.assignee && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{ticket.assignee.substring(0, 2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingTicket ? "Editar Ticket" : "Novo Ticket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título do ticket" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição do problema" className="bg-input border-border" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, projectId: "" })}>
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
            {formData.clientId && availableProjects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project">Projeto (opcional)</Label>
                <Select value={formData.projectId || "none"} onValueChange={(value) => setFormData({ ...formData, projectId: value === "none" ? "" : value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
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
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as SupportTicket["status"] })}>
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
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as SupportTicket["priority"] })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Responsável</Label>
              <Select value={formData.assignee || "none"} onValueChange={(value) => setFormData({ ...formData, assignee: value === "none" ? "" : value })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione o responsável" />
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
            <DialogTitle className="text-foreground">Detalhes do Ticket</DialogTitle>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-primary">{viewingTicket.id}</span>
                <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border", statusConfig[viewingTicket.status].color)}>
                  {statusConfig[viewingTicket.status].label}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{viewingTicket.title}</h3>
                <p className="text-muted-foreground">{getClientName(viewingTicket.clientId)}</p>
                {getProjectName(viewingTicket.projectIds?.[0]) && (
                  <p className="text-sm text-primary mt-1">{getProjectName(viewingTicket.projectIds?.[0])}</p>
                )}
              </div>
              {viewingTicket.description && (
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm">{viewingTicket.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", priorityConfig[viewingTicket.priority].color)} />
                    <span className="font-medium">{priorityConfig[viewingTicket.priority].label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                  <p className="font-medium">{viewingTicket.assignee || "Não atribuído"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                  <p className="font-medium">{viewingTicket.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última atualização</p>
                  <p className="font-medium">{viewingTicket.updatedAt}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">Fechar</button>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingTicket) openEditDialog(viewingTicket); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Editar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Ticket"
        description="Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
