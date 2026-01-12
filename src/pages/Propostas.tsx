import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, FileText, Send, CheckCircle, XCircle, Clock, Eye, Download, Copy, Edit, Trash2, Search } from "lucide-react";
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
import { Proposal } from "@/types/data";
import { CurrencyInput } from "@/components/shared/CurrencyInput";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-500", icon: FileText },
  sent: { label: "Enviada", color: "bg-blue-500/10 text-blue-500", icon: Send },
  viewed: { label: "Visualizada", color: "bg-amber-500/10 text-amber-500", icon: Eye },
  accepted: { label: "Aceita", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  rejected: { label: "Recusada", color: "bg-red-500/10 text-red-500", icon: XCircle },
};

export default function Propostas() {
  const { proposals, clients, projects, addProposal, updateProposal, deleteProposal, getClient, getProjectsByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [deletingProposalId, setDeletingProposalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    projectId: "",
    value: "",
    status: "draft" as Proposal["status"],
    validUntil: "",
    services: "",
  });

  const filteredProposals = proposals.filter((proposal) => {
    const client = getClient(proposal.clientId);
    return proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.company.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const availableProjects = formData.clientId ? getProjectsByClient(formData.clientId) : [];

  const stats = {
    total: proposals.length,
    accepted: proposals.filter(p => p.status === "accepted").length,
    pending: proposals.filter(p => ["sent", "viewed"].includes(p.status)).length,
    value: proposals.filter(p => p.status === "accepted").reduce((acc, p) => acc + parseInt(p.value.replace(/\D/g, "")), 0),
  };

  const openNewDialog = () => {
    setEditingProposal(null);
    setFormData({ title: "", clientId: "", projectId: "", value: "", status: "draft", validUntil: "", services: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setFormData({
      title: proposal.title,
      clientId: proposal.clientId,
      projectId: proposal.projectId || "",
      value: proposal.value,
      status: proposal.status,
      validUntil: proposal.validUntil,
      services: proposal.services.join(", "),
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (proposal: Proposal) => {
    setViewingProposal(proposal);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.clientId || !formData.value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

    if (editingProposal) {
      updateProposal(editingProposal.id, {
        title: formData.title,
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        value: formData.value,
        status: formData.status,
        validUntil: formData.validUntil || "30 dias",
        services: formData.services.split(",").map(s => s.trim()).filter(Boolean),
      });
      toast.success("Proposta atualizada com sucesso!");
    } else {
      addProposal({
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        title: formData.title,
        value: formData.value,
        status: formData.status,
        services: formData.services.split(",").map(s => s.trim()).filter(Boolean),
        createdAt: today,
        validUntil: formData.validUntil || "30 dias",
      });
      toast.success("Proposta criada com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingProposalId) {
      deleteProposal(deletingProposalId);
      toast.success("Proposta removida com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProposalId(null);
    }
  };

  const handleDuplicate = (proposal: Proposal) => {
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
    addProposal({
      ...proposal,
      title: `${proposal.title} (Cópia)`,
      status: "draft",
      createdAt: today,
    });
    toast.success("Proposta duplicada com sucesso!");
  };

  const handleSendProposal = (proposal: Proposal) => {
    updateProposal(proposal.id, { status: "sent" });
    toast.success("Proposta enviada para o cliente!");
  };

  const getClientName = (clientId: string) => {
    const client = getClient(clientId);
    return client?.company || "Cliente não encontrado";
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Propostas</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas propostas comerciais</p>
          </div>
          <button onClick={openNewDialog} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Nova Proposta
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Total de Propostas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Aceitas</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{stats.accepted}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Valor Fechado</p>
            <p className="text-2xl font-bold text-foreground mt-1">R$ {stats.value.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar propostas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <ViewModeToggle modes={["list", "grid"]} currentMode={viewMode} onChange={setViewMode} />
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredProposals.map((proposal, index) => {
              const StatusIcon = statusConfig[proposal.status].icon;
              return (
                <div key={proposal.id} className="p-6 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[proposal.status].color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[proposal.status].label}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{proposal.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{getClientName(proposal.clientId)}</p>
                      {getProjectName(proposal.projectId) && (
                        <p className="text-sm text-primary mb-4">Projeto: {getProjectName(proposal.projectId)}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {proposal.services.map((service) => (
                          <span key={service} className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{service}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{proposal.value}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        <span>Expira: {proposal.validUntil}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Criada em {proposal.createdAt}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openViewDialog(proposal)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Visualizar">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDuplicate(proposal)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Duplicar">
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Download">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <ActionMenu items={[
                        { label: "Editar", icon: Edit, onClick: () => openEditDialog(proposal) },
                        { label: "Enviar", icon: Send, onClick: () => handleSendProposal(proposal), show: proposal.status === "draft" },
                        { label: "Excluir", icon: Trash2, onClick: () => { setDeletingProposalId(proposal.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                      ]} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProposals.map((proposal, index) => {
              const StatusIcon = statusConfig[proposal.status].icon;
              return (
                <div key={proposal.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[proposal.status].color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[proposal.status].label}
                    </span>
                    <ActionMenu items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(proposal) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(proposal) },
                      { label: "Duplicar", icon: Copy, onClick: () => handleDuplicate(proposal) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingProposalId(proposal.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{proposal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{getClientName(proposal.clientId)}</p>
                  {getProjectName(proposal.projectId) && (
                    <p className="text-xs text-primary mb-3">{getProjectName(proposal.projectId)}</p>
                  )}
                  <p className="text-xl font-bold text-foreground mb-3">{proposal.value}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {proposal.services.slice(0, 2).map((service) => (
                      <span key={service} className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-foreground">{service}</span>
                    ))}
                    {proposal.services.length > 2 && (
                      <span className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-foreground">+{proposal.services.length - 2}</span>
                    )}
                  </div>
                  <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                    Expira: {proposal.validUntil}
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
            <DialogTitle className="text-foreground">{editingProposal ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título da proposta" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, projectId: "" })}>
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
            {formData.clientId && availableProjects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="project">Projeto (opcional)</Label>
                <Select value={formData.projectId || "none"} onValueChange={(value) => setFormData({ ...formData, projectId: value === "none" ? "" : value })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
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
                <Label htmlFor="value">Valor *</Label>
                <CurrencyInput id="value" value={formData.value} onChange={(value) => setFormData({ ...formData, value })} placeholder="R$ 0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Proposal["status"] })}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Validade</Label>
              <DatePicker
                value={formData.validUntil}
                onChange={(value) => setFormData({ ...formData, validUntil: value })}
                placeholder="Selecione a validade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="services">Serviços (separados por vírgula)</Label>
              <Textarea id="services" value={formData.services} onChange={(e) => setFormData({ ...formData, services: e.target.value })} placeholder="Chatbot, API, Dashboard" className="bg-secondary/50 border-border" />
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
            <DialogTitle className="text-foreground">Detalhes da Proposta</DialogTitle>
          </DialogHeader>
          {viewingProposal && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium", statusConfig[viewingProposal.status].color)}>
                  {statusConfig[viewingProposal.status].label}
                </span>
                <span className="text-2xl font-bold">{viewingProposal.value}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{viewingProposal.title}</h3>
                <p className="text-muted-foreground">{getClientName(viewingProposal.clientId)}</p>
                {getProjectName(viewingProposal.projectId) && (
                  <p className="text-sm text-primary mt-1">Projeto: {getProjectName(viewingProposal.projectId)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Serviços incluídos:</p>
                <div className="flex flex-wrap gap-2">
                  {viewingProposal.services.map((service) => (
                    <span key={service} className="px-3 py-1 rounded-lg bg-secondary text-sm text-foreground">{service}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Criada em</p>
                  <p className="font-medium">{viewingProposal.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Válida até</p>
                  <p className="font-medium">{viewingProposal.validUntil}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Fechar</button>
            <button onClick={() => { setIsViewDialogOpen(false); viewingProposal && openEditDialog(viewingProposal); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Editar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Proposta"
        description="Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
