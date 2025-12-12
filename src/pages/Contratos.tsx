import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, FileSignature, CheckCircle, Clock, AlertCircle, Send, Download, Eye, Edit, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";

interface Contract {
  id: string;
  title: string;
  client: string;
  value: string;
  status: "draft" | "pending_signature" | "signed" | "expired";
  type: "projeto" | "sustentacao" | "consultoria";
  createdAt: string;
  signedAt?: string;
  expiresAt: string;
}

const initialContracts: Contract[] = [
  { id: "1", title: "Contrato de Desenvolvimento - Chatbot", client: "TechCorp", value: "R$ 45.000", status: "signed", type: "projeto", createdAt: "01 Dez 2024", signedAt: "05 Dez 2024", expiresAt: "01 Dez 2025" },
  { id: "2", title: "Contrato de Sustentação Mensal", client: "SmartRetail", value: "R$ 8.000/mês", status: "signed", type: "sustentacao", createdAt: "15 Nov 2024", signedAt: "18 Nov 2024", expiresAt: "15 Nov 2025" },
  { id: "3", title: "Contrato de Automação", client: "InnovateLab", value: "R$ 80.000", status: "pending_signature", type: "projeto", createdAt: "18 Dez 2024", expiresAt: "18 Dez 2025" },
  { id: "4", title: "Contrato de Consultoria IA", client: "DataFlow Inc", value: "R$ 15.000", status: "draft", type: "consultoria", createdAt: "20 Dez 2024", expiresAt: "20 Dez 2025" },
  { id: "5", title: "Contrato de Desenvolvimento ML", client: "FinTech Plus", value: "R$ 95.000", status: "expired", type: "projeto", createdAt: "01 Jun 2024", signedAt: "05 Jun 2024", expiresAt: "01 Dez 2024" },
];

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: FileSignature },
  pending_signature: { label: "Aguardando Assinatura", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  signed: { label: "Assinado", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  expired: { label: "Expirado", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertCircle },
};

const typeConfig = {
  projeto: { label: "Projeto", color: "bg-primary/10 text-primary" },
  sustentacao: { label: "Sustentação", color: "bg-blue-500/10 text-blue-500" },
  consultoria: { label: "Consultoria", color: "bg-purple-500/10 text-purple-500" },
};

export default function Contratos() {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    value: "",
    status: "draft" as Contract["status"],
    type: "projeto" as Contract["type"],
    expiresAt: "",
  });

  const filteredContracts = contracts.filter((contract) =>
    contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openNewDialog = () => {
    setEditingContract(null);
    setFormData({ title: "", client: "", value: "", status: "draft", type: "projeto", expiresAt: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({ title: contract.title, client: contract.client, value: contract.value, status: contract.status, type: contract.type, expiresAt: contract.expiresAt });
    setIsDialogOpen(true);
  };

  const openViewDialog = (contract: Contract) => {
    setViewingContract(contract);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.client || !formData.value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

    if (editingContract) {
      setContracts(contracts.map(c => c.id === editingContract.id ? { ...c, ...formData } : c));
      toast.success("Contrato atualizado com sucesso!");
    } else {
      const newContract: Contract = {
        id: Date.now().toString(),
        ...formData,
        createdAt: today,
      };
      setContracts([...contracts, newContract]);
      toast.success("Contrato criado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingContractId) {
      setContracts(contracts.filter(c => c.id !== deletingContractId));
      toast.success("Contrato removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingContractId(null);
    }
  };

  const handleSendForSignature = (contract: Contract) => {
    setContracts(contracts.map(c => c.id === contract.id ? { ...c, status: "pending_signature" } : c));
    toast.success("Contrato enviado para assinatura!");
  };

  const handleSign = () => {
    if (signingContract) {
      const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
      setContracts(contracts.map(c => c.id === signingContract.id ? { ...c, status: "signed", signedAt: today } : c));
      toast.success("Contrato assinado com sucesso!");
      setIsSignDialogOpen(false);
      setSigningContract(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
            <p className="text-muted-foreground mt-1">Gerencie contratos e assinaturas digitais</p>
          </div>
          <button onClick={openNewDialog} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Novo Contrato
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = contracts.filter(c => c.status === key).length;
            const Icon = config.icon;
            return (
              <div key={key} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color.split(" ")[0])}>
                    <Icon className={cn("w-5 h-5", config.color.split(" ")[1])} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar contratos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <ViewModeToggle modes={["table", "grid"]} currentMode={viewMode} onChange={setViewMode} />
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contrato</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Validade</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredContracts.map((contract, index) => {
                  const StatusIcon = statusConfig[contract.status].icon;
                  return (
                    <tr key={contract.id} className="hover:bg-secondary/20 transition-colors animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileSignature className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{contract.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{contract.client}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[contract.type].color)}>
                          {typeConfig[contract.type].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit border", statusConfig[contract.status].color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[contract.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{contract.value}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{contract.expiresAt}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {contract.status === "draft" && (
                            <button onClick={() => handleSendForSignature(contract)} className="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Enviar para assinatura">
                              <Send className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          {contract.status === "pending_signature" && (
                            <button onClick={() => { setSigningContract(contract); setIsSignDialogOpen(true); }} className="p-2 rounded-lg hover:bg-green-500/10 transition-colors" title="Assinar">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button onClick={() => openViewDialog(contract)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Visualizar">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Download">
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <ActionMenu items={[
                            { label: "Editar", icon: Edit, onClick: () => openEditDialog(contract) },
                            { label: "Excluir", icon: Trash2, onClick: () => { setDeletingContractId(contract.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract, index) => {
              const StatusIcon = statusConfig[contract.status].icon;
              return (
                <div key={contract.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSignature className="w-5 h-5 text-primary" />
                    </div>
                    <ActionMenu items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(contract) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(contract) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingContractId(contract.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{contract.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{contract.client}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[contract.type].color)}>{typeConfig[contract.type].label}</span>
                    <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", statusConfig[contract.status].color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[contract.status].label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground mb-3">{contract.value}</p>
                  <div className="pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                    <span>Validade: {contract.expiresAt}</span>
                    {contract.signedAt && <span>Assinado: {contract.signedAt}</span>}
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
            <DialogTitle className="text-foreground">{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título do contrato" className="bg-secondary/50 border-border" />
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
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Contract["type"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Contract["status"] })}>
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
                <Label htmlFor="expiresAt">Validade</Label>
                <Input id="expiresAt" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} placeholder="DD/MM/AAAA" className="bg-secondary/50 border-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{editingContract ? "Salvar" : "Criar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {viewingContract && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileSignature className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewingContract.title}</h3>
                  <p className="text-muted-foreground">{viewingContract.client}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[viewingContract.type].color)}>{typeConfig[viewingContract.type].label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", statusConfig[viewingContract.status].color)}>{statusConfig[viewingContract.status].label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="font-bold text-foreground">{viewingContract.value}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Criado em</span><span className="text-foreground">{viewingContract.createdAt}</span></div>
                {viewingContract.signedAt && <div className="flex justify-between"><span className="text-muted-foreground">Assinado em</span><span className="text-foreground">{viewingContract.signedAt}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Validade</span><span className="text-foreground">{viewingContract.expiresAt}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingContract) openEditDialog(viewingContract); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Assinar Contrato</DialogTitle>
          </DialogHeader>
          {signingContract && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">Você está prestes a assinar digitalmente o contrato:</p>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h4 className="font-semibold text-foreground">{signingContract.title}</h4>
                <p className="text-sm text-muted-foreground">{signingContract.client}</p>
                <p className="text-lg font-bold text-foreground mt-2">{signingContract.value}</p>
              </div>
              <p className="text-sm text-muted-foreground">Ao clicar em "Assinar", você concorda com os termos do contrato.</p>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setIsSignDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSign} className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">Assinar Digitalmente</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Excluir Contrato" description="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} variant="destructive" />
    </AppLayout>
  );
}
