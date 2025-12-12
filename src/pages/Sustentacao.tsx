import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Plus, Search, MessageSquare, AlertCircle, CheckCircle, Clock, Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";

interface Ticket {
  id: string;
  title: string;
  description?: string;
  client: string;
  project: string;
  status: "open" | "in_progress" | "waiting" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  lastUpdate: string;
  assignee: string;
}

const initialTickets: Ticket[] = [
  { id: "TK-001", title: "Erro no processamento de dados", description: "O sistema apresenta erro ao processar grandes volumes de dados", client: "TechCorp", project: "Chatbot", status: "in_progress", priority: "high", createdAt: "Hoje, 09:30", lastUpdate: "Há 2h", assignee: "CS" },
  { id: "TK-002", title: "Lentidão no dashboard", description: "Dashboard demora mais de 10s para carregar", client: "SmartRetail", project: "Recomendação", status: "open", priority: "medium", createdAt: "Hoje, 11:00", lastUpdate: "Há 30min", assignee: "AM" },
  { id: "TK-003", title: "Integração API falhando", description: "Erro 500 ao chamar endpoint de autenticação", client: "InnovateLab", project: "Automação", status: "waiting", priority: "critical", createdAt: "Ontem, 16:45", lastUpdate: "Há 5h", assignee: "PC" },
  { id: "TK-004", title: "Atualização de modelo ML", description: "Atualizar modelo para nova versão", client: "DataFlow Inc", project: "Analytics", status: "resolved", priority: "low", createdAt: "Há 2 dias", lastUpdate: "Há 1 dia", assignee: "MO" },
  { id: "TK-005", title: "Bug na autenticação", description: "Usuários não conseguem fazer login via SSO", client: "FinTech Plus", project: "Modelo Preditivo", status: "in_progress", priority: "high", createdAt: "Hoje, 08:15", lastUpdate: "Há 3h", assignee: "LM" },
  { id: "TK-006", title: "Requisição de nova feature", description: "Cliente solicita nova funcionalidade de exportação", client: "TechCorp", project: "Chatbot", status: "open", priority: "low", createdAt: "Há 3 dias", lastUpdate: "Há 2 dias", assignee: "JF" },
];

const statusConfig = {
  open: { label: "Aberto", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: MessageSquare },
  in_progress: { label: "Em Andamento", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  waiting: { label: "Aguardando", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: AlertCircle },
  resolved: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-500" },
  medium: { label: "Média", color: "bg-blue-500" },
  high: { label: "Alta", color: "bg-amber-500" },
  critical: { label: "Crítica", color: "bg-red-500" },
};

export default function Sustentacao() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client: "",
    project: "",
    status: "open" as Ticket["status"],
    priority: "medium" as Ticket["priority"],
    assignee: "",
  });

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  const generateTicketId = () => {
    const num = tickets.length + 1;
    return `TK-${num.toString().padStart(3, "0")}`;
  };

  const openNewDialog = () => {
    setEditingTicket(null);
    setFormData({ title: "", description: "", client: "", project: "", status: "open", priority: "medium", assignee: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({ title: ticket.title, description: ticket.description || "", client: ticket.client, project: ticket.project, status: ticket.status, priority: ticket.priority, assignee: ticket.assignee });
    setIsDialogOpen(true);
  };

  const openViewDialog = (ticket: Ticket) => {
    setViewingTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.client || !formData.project) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingTicket) {
      setTickets(tickets.map(t => t.id === editingTicket.id ? { ...t, ...formData, lastUpdate: "Agora" } : t));
      toast.success("Ticket atualizado com sucesso!");
    } else {
      const newTicket: Ticket = {
        id: generateTicketId(),
        ...formData,
        createdAt: "Agora",
        lastUpdate: "Agora",
      };
      setTickets([...tickets, newTicket]);
      toast.success("Ticket criado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingTicketId) {
      setTickets(tickets.filter(t => t.id !== deletingTicketId));
      toast.success("Ticket removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingTicketId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sustentação</h1>
            <p className="text-muted-foreground mt-1">Suporte e acompanhamento pós-venda</p>
          </div>
          <button onClick={openNewDialog} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
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
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-purple-500" />
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
            <input type="text" placeholder="Buscar tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <ViewModeToggle modes={["table", "kanban", "grid"]} currentMode={viewMode} onChange={setViewMode} />

          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedStatus(null)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", !selectedStatus ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
              Todos
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button key={key} onClick={() => setSelectedStatus(selectedStatus === key ? null : key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", selectedStatus === key ? config.color : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
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
                <tr className="border-b border-border bg-secondary/30">
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
                    <tr key={ticket.id} className="hover:bg-secondary/20 transition-colors animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-xs text-primary mb-1">{ticket.id}</p>
                          <p className="font-medium text-foreground">{ticket.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{ticket.client}</p>
                        <p className="text-sm text-muted-foreground">{ticket.project}</p>
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
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{ticket.assignee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{ticket.lastUpdate}</td>
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
            {Object.entries(statusConfig).map(([statusKey, config]) => {
              const statusTickets = filteredTickets.filter(t => t.status === statusKey);
              const StatusIcon = config.icon;
              return (
                <div key={statusKey} className="flex-shrink-0 w-80">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <StatusIcon className={cn("w-4 h-4", config.color.split(" ")[1])} />
                    <span className="font-semibold text-foreground">{config.label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{statusTickets.length}</span>
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
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{ticket.client}</span>
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{ticket.assignee}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={openNewDialog} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all">
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
                <div key={ticket.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs text-primary">{ticket.id}</span>
                    <ActionMenu items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(ticket) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(ticket) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingTicketId(ticket.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{ticket.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", statusConfig[ticket.status].color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[ticket.status].label}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", priorityConfig[ticket.priority].color)} />
                      <span className="text-xs text-muted-foreground">{priorityConfig[ticket.priority].label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{ticket.client} • {ticket.project}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{ticket.lastUpdate}</span>
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{ticket.assignee}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingTicket ? "Editar Ticket" : "Novo Ticket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título do ticket" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva o problema ou solicitação" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Input id="client" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="Nome do cliente" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Projeto *</Label>
                <Input id="project" value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} placeholder="Nome do projeto" className="bg-secondary/50 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Ticket["status"] })}>
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
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Ticket["priority"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
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
              <Label htmlFor="assignee">Responsável (iniciais)</Label>
              <Input id="assignee" value={formData.assignee} onChange={(e) => setFormData({ ...formData, assignee: e.target.value })} placeholder="Ex: CS" className="bg-secondary/50 border-border" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{editingTicket ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Ticket</DialogTitle>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-primary">{viewingTicket.id}</span>
                <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", statusConfig[viewingTicket.status].color)}>
                  {statusConfig[viewingTicket.status].label}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{viewingTicket.title}</h3>
                {viewingTicket.description && <p className="text-muted-foreground mt-1">{viewingTicket.description}</p>}
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="text-foreground">{viewingTicket.client}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Projeto</span><span className="text-foreground">{viewingTicket.project}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Prioridade</span><div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", priorityConfig[viewingTicket.priority].color)} /><span>{priorityConfig[viewingTicket.priority].label}</span></div></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Responsável</span><div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-xs font-medium text-primary">{viewingTicket.assignee}</span></div></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Criado em</span><span className="text-foreground">{viewingTicket.createdAt}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Última atualização</span><span className="text-foreground">{viewingTicket.lastUpdate}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingTicket) openEditDialog(viewingTicket); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Excluir Ticket" description="Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} variant="destructive" />
    </AppLayout>
  );
}
