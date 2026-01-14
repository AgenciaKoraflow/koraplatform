import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Building2, Mail, Phone, Calendar, Eye, Edit, Trash2, FileText, FolderOpen, ClipboardList, FileSignature, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/shared/CurrencyInput";

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  qualificacao: { label: "Qualificação", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  proposta: { label: "Proposta", color: "bg-primary/10 text-primary border-primary/20" },
  negociacao: { label: "Negociação", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cliente: { label: "Cliente", color: "bg-green-500/10 text-green-500 border-green-500/20" },
};

const stageOrder: (keyof typeof stageConfig)[] = ["prospeccao", "qualificacao", "proposta", "negociacao", "cliente"];

export default function Clientes() {
  const { clients, addClient, updateClient, deleteClient, getProjectsByClient, getProposalsByClient, getContractsByClient, getKnowledgeByClient, getTasksByClient, getTicketsByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stage: "prospeccao" as keyof typeof stageConfig,
    value: "",
    anniversary: "",
    head: "",
  });

  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : null;
  const viewingClient = viewingClientId ? clients.find(c => c.id === viewingClientId) : null;

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !selectedStage || client.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const openNewDialog = () => {
    setEditingClientId(null);
    setFormData({ name: "", company: "", email: "", phone: "", stage: "prospeccao", value: "", anniversary: "", head: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setEditingClientId(clientId);
      setFormData({
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        stage: client.stage,
        value: client.value,
        anniversary: client.anniversary || "",
        head: client.head || "",
      });
      setIsDialogOpen(true);
    }
  };

  const openViewDialog = (clientId: string) => {
    setViewingClientId(clientId);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.company || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingClientId) {
      updateClient(editingClientId, { ...formData, lastContact: "Agora" });
      toast.success("Cliente atualizado com sucesso!");
    } else {
      addClient({ ...formData, lastContact: "Agora" });
      toast.success("Cliente adicionado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingClientId) {
      deleteClient(deletingClientId);
      toast.success("Cliente removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingClientId(null);
    }
  };

  const getClientsByStage = (stage: string) => 
    filteredClients.filter(c => c.stage === stage);

  // Calculate potential value from contracts (sum of values, with recurrence averaged to 12 months)
  const calculateClientPotentialValue = (clientId: string): string => {
    const clientContracts = getContractsByClient(clientId);
    if (clientContracts.length === 0) return "R$ 0,00";
    
    let total = 0;
    clientContracts.forEach(contract => {
      // Parse main contract value
      const mainValue = parseFloat(contract.value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
      total += mainValue;
      
      // For recurring contracts, add 12 months of recurrence
      if (contract.billingType === 'implantacao_recorrencia' && contract.recurrenceValue) {
        const recurrenceValue = parseFloat(contract.recurrenceValue.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
        total += recurrenceValue * 12; // Annual value
      }
    });
    
    return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Get related data for viewing client
  const clientProjects = viewingClientId ? getProjectsByClient(viewingClientId) : [];
  const clientProposals = viewingClientId ? getProposalsByClient(viewingClientId) : [];
  const clientContracts = viewingClientId ? getContractsByClient(viewingClientId) : [];
  const clientKnowledge = viewingClientId ? getKnowledgeByClient(viewingClientId) : [];
  const clientTasks = viewingClientId ? getTasksByClient(viewingClientId) : [];
  const clientTickets = viewingClientId ? getTicketsByClient(viewingClientId) : [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e prospects</p>
          </div>
          <button onClick={openNewDialog} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar clientes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <ViewModeToggle modes={["table", "kanban", "grid"]} currentMode={viewMode} onChange={setViewMode} />
          <div className="flex items-center gap-2">
            {Object.entries(stageConfig).map(([key, config]) => (
              <button key={key} onClick={() => setSelectedStage(selectedStage === key ? null : key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", selectedStage === key ? config.color : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Último Contato</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.map((client, index) => (
                  <tr key={client.id} className="hover:bg-secondary/20 transition-colors animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{client.name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            {client.company}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].color)}>
                        {stageConfig[client.stage].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">{calculateClientPotentialValue(client.id)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {client.lastContact}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu items={[
                        { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(client.id) },
                        { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                        { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageOrder.map((stage) => (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <span className={cn("w-3 h-3 rounded-full", stageConfig[stage].color.split(" ")[0])} />
                  <span className="font-semibold text-foreground">{stageConfig[stage].label}</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{getClientsByStage(stage).length}</span>
                </div>
                <div className="space-y-3">
                  {getClientsByStage(stage).map((client) => (
                    <div key={client.id} className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer" onClick={() => openViewDialog(client.id)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">{client.name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-foreground">{calculateClientPotentialValue(client.id)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{client.lastContact}</p>
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

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, index) => (
              <div key={client.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{client.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <ActionMenu items={[
                    { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(client.id) },
                    { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                    { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                  ]} />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {client.phone}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].color)}>{stageConfig[client.stage].label}</span>
                  <span className="font-bold text-foreground">{calculateClientPotentialValue(client.id)}</span>
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
            <DialogTitle className="text-foreground">{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do contato" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Nome da empresa" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" className="bg-secondary/50 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as keyof typeof stageConfig })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor Potencial</Label>
                <CurrencyInput id="value" value={formData.value} onChange={(value) => setFormData({ ...formData, value })} placeholder="R$ 0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anniversary">Aniversário de Cliente</Label>
                <DatePicker
                  value={formData.anniversary}
                  onChange={(value) => setFormData({ ...formData, anniversary: value })}
                  placeholder="Selecione a data"
                />
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
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog with Related Data */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {viewingClient && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">{viewingClient.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{viewingClient.name}</h3>
                  <p className="text-muted-foreground">{viewingClient.company}</p>
                  <span className={cn("inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium border", stageConfig[viewingClient.stage].color)}>{stageConfig[viewingClient.stage].label}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{viewingClient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{viewingClient.phone}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor Potencial</p>
                  <p className="text-lg font-bold text-foreground">{viewingClient.value}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Último Contato</p>
                  <p className="text-foreground">{viewingClient.lastContact}</p>
                </div>
              </div>

              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
                  <TabsTrigger value="projects" className="text-xs">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    Projetos ({clientProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Tarefas ({clientTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="proposals" className="text-xs">
                    <ClipboardList className="w-3 h-3 mr-1" />
                    Propostas ({clientProposals.length})
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="text-xs">
                    <FileSignature className="w-3 h-3 mr-1" />
                    Contratos ({clientContracts.length})
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Base ({clientKnowledge.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="projects" className="mt-4 space-y-2">
                  {clientProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto vinculado</p>
                  ) : (
                    clientProjects.map(project => (
                      <div key={project.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.status} • {project.progress}% concluído</p>
                      </div>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="tasks" className="mt-4 space-y-2">
                  {clientTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa vinculada</p>
                  ) : (
                    clientTasks.map(task => {
                      const project = clientProjects.find(p => p.id === task.projectId);
                      return (
                        <div key={task.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{task.title}</p>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                              task.status === "done" ? "bg-green-500/10 text-green-500" :
                              task.status === "in_progress" ? "bg-primary/10 text-primary" :
                              task.status === "review" ? "bg-amber-500/10 text-amber-500" :
                              "bg-secondary text-muted-foreground"
                            )}>
                              {task.status === "todo" ? "A Fazer" : 
                               task.status === "in_progress" ? "Em Progresso" :
                               task.status === "review" ? "Em Revisão" : "Concluído"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {project ? `Projeto: ${project.name}` : "Sem projeto"} • Prazo: {task.dueDate}
                          </p>
                        </div>
                      );
                    })
                  )}
                </TabsContent>
                <TabsContent value="proposals" className="mt-4 space-y-2">
                  {clientProposals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma proposta vinculada</p>
                  ) : (
                    clientProposals.map(proposal => (
                      <div key={proposal.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <p className="font-medium text-foreground">{proposal.title}</p>
                        <p className="text-xs text-muted-foreground">{proposal.status} • {proposal.value}</p>
                      </div>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="contracts" className="mt-4 space-y-2">
                  {clientContracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum contrato vinculado</p>
                  ) : (
                    clientContracts.map(contract => (
                      <div key={contract.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <p className="font-medium text-foreground">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">{contract.status} • {contract.value}</p>
                      </div>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="knowledge" className="mt-4 space-y-2">
                  {clientKnowledge.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum item na base de conhecimento</p>
                  ) : (
                    clientKnowledge.map(item => (
                      <div key={item.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingClientId) openEditDialog(viewingClientId); }} className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Todos os projetos, propostas, contratos e itens da base de conhecimento vinculados também serão removidos. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
