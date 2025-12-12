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
import { toast } from "sonner";

interface Proposal {
  id: string;
  title: string;
  client: string;
  value: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  createdAt: string;
  expiresAt: string;
  services: string[];
}

const initialProposals: Proposal[] = [
  { id: "1", title: "Chatbot de Atendimento Premium", client: "TechCorp", value: "R$ 45.000", status: "accepted", createdAt: "10 Dez 2024", expiresAt: "10 Jan 2025", services: ["Chatbot", "Integração", "Treinamento"] },
  { id: "2", title: "Sistema de Recomendação IA", client: "SmartRetail", value: "R$ 120.000", status: "sent", createdAt: "15 Dez 2024", expiresAt: "15 Jan 2025", services: ["ML Model", "API", "Dashboard"] },
  { id: "3", title: "Automação de Processos", client: "InnovateLab", value: "R$ 80.000", status: "viewed", createdAt: "18 Dez 2024", expiresAt: "18 Jan 2025", services: ["RPA", "Integração", "Suporte"] },
  { id: "4", title: "Analytics Dashboard", client: "DataFlow Inc", value: "R$ 35.000", status: "draft", createdAt: "20 Dez 2024", expiresAt: "20 Jan 2025", services: ["Dashboard", "Relatórios"] },
  { id: "5", title: "Modelo Preditivo de Vendas", client: "FinTech Plus", value: "R$ 95.000", status: "rejected", createdAt: "05 Dez 2024", expiresAt: "05 Jan 2025", services: ["ML Model", "API", "Consultoria"] },
];

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-500", icon: FileText },
  sent: { label: "Enviada", color: "bg-blue-500/10 text-blue-500", icon: Send },
  viewed: { label: "Visualizada", color: "bg-amber-500/10 text-amber-500", icon: Eye },
  accepted: { label: "Aceita", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  rejected: { label: "Recusada", color: "bg-red-500/10 text-red-500", icon: XCircle },
};

export default function Propostas() {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
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
    client: "",
    value: "",
    status: "draft" as Proposal["status"],
    expiresAt: "",
    services: "",
  });

  const filteredProposals = proposals.filter((proposal) =>
    proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: proposals.length,
    accepted: proposals.filter(p => p.status === "accepted").length,
    pending: proposals.filter(p => ["sent", "viewed"].includes(p.status)).length,
    value: proposals.filter(p => p.status === "accepted").reduce((acc, p) => acc + parseInt(p.value.replace(/\D/g, "")), 0),
  };

  const openNewDialog = () => {
    setEditingProposal(null);
    setFormData({ title: "", client: "", value: "", status: "draft", expiresAt: "", services: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setFormData({ title: proposal.title, client: proposal.client, value: proposal.value, status: proposal.status, expiresAt: proposal.expiresAt, services: proposal.services.join(", ") });
    setIsDialogOpen(true);
  };

  const openViewDialog = (proposal: Proposal) => {
    setViewingProposal(proposal);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.client || !formData.value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

    if (editingProposal) {
      setProposals(proposals.map(p => p.id === editingProposal.id ? { ...p, ...formData, services: formData.services.split(",").map(s => s.trim()).filter(Boolean) } : p));
      toast.success("Proposta atualizada com sucesso!");
    } else {
      const newProposal: Proposal = {
        id: Date.now().toString(),
        title: formData.title,
        client: formData.client,
        value: formData.value,
        status: formData.status,
        createdAt: today,
        expiresAt: formData.expiresAt || "30 dias",
        services: formData.services.split(",").map(s => s.trim()).filter(Boolean),
      };
      setProposals([...proposals, newProposal]);
      toast.success("Proposta criada com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingProposalId) {
      setProposals(proposals.filter(p => p.id !== deletingProposalId));
      toast.success("Proposta removida com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProposalId(null);
    }
  };

  const handleDuplicate = (proposal: Proposal) => {
    const newProposal: Proposal = {
      ...proposal,
      id: Date.now().toString(),
      title: `${proposal.title} (Cópia)`,
      status: "draft",
      createdAt: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", ""),
    };
    setProposals([...proposals, newProposal]);
    toast.success("Proposta duplicada com sucesso!");
  };

  const handleSendProposal = (proposal: Proposal) => {
    setProposals(proposals.map(p => p.id === proposal.id ? { ...p, status: "sent" } : p));
    toast.success("Proposta enviada para o cliente!");
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
                      <p className="text-sm text-muted-foreground mb-4">{proposal.client}</p>
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
                        <span>Expira: {proposal.expiresAt}</span>
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
                  <p className="text-sm text-muted-foreground mb-3">{proposal.client}</p>
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
                    Expira: {proposal.expiresAt}
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
              <Input id="client" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="Nome do cliente" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor *</Label>
                <Input id="value" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="R$ 0,00" className="bg-secondary/50 border-border" />
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
              <Label htmlFor="expiresAt">Validade</Label>
              <Input id="expiresAt" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} placeholder="DD/MM/AAAA" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="services">Serviços (separados por vírgula)</Label>
              <Textarea id="services" value={formData.services} onChange={(e) => setFormData({ ...formData, services: e.target.value })} placeholder="Chatbot, API, Dashboard" className="bg-secondary/50 border-border" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{editingProposal ? "Salvar" : "Criar"}</button>
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
              <div className="flex items-center gap-3">
                <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[viewingProposal.status].color)}>
                  {statusConfig[viewingProposal.status].label}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{viewingProposal.title}</h3>
                <p className="text-muted-foreground">{viewingProposal.client}</p>
              </div>
              <div className="text-3xl font-bold text-foreground">{viewingProposal.value}</div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Criada em</span><span className="text-foreground">{viewingProposal.createdAt}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Expira em</span><span className="text-foreground">{viewingProposal.expiresAt}</span></div>
                <div>
                  <span className="text-muted-foreground">Serviços incluídos:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingProposal.services.map((service) => (
                      <span key={service} className="px-2 py-1 rounded-md bg-secondary text-sm text-foreground">{service}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingProposal) openEditDialog(viewingProposal); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Excluir Proposta" description="Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} variant="destructive" />
    </AppLayout>
  );
}
