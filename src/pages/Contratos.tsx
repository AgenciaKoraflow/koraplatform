import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Plus, FileSignature, CheckCircle, Clock, AlertCircle, Send, Download, Eye, Edit, Trash2, Search, Upload, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

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
  const { contracts, clients, projects, proposals, addContract, updateContract, deleteContract, getClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{ name: string; data: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    projectId: "",
    proposalId: "",
    value: "",
    status: "draft" as "draft" | "pending_signature" | "signed" | "expired",
    type: "projeto" as "projeto" | "sustentacao" | "consultoria",
    expiresAt: "",
    documentName: "",
    documentData: "",
    documentType: "",
  });

  const editingContract = editingContractId ? contracts.find(c => c.id === editingContractId) : null;
  const viewingContract = viewingContractId ? contracts.find(c => c.id === viewingContractId) : null;
  const signingContract = signingContractId ? contracts.find(c => c.id === signingContractId) : null;

  const filteredContracts = contracts.filter((contract) => {
    const client = getClient(contract.clientId);
    return contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client?.company || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openNewDialog = () => {
    setEditingContractId(null);
    setFormData({ title: "", clientId: "", projectId: "", proposalId: "", value: "", status: "draft", type: "projeto", expiresAt: "", documentName: "", documentData: "", documentType: "" });
    setDocumentPreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setEditingContractId(contractId);
      setFormData({
        title: contract.title,
        clientId: contract.clientId,
        projectId: contract.projectId || "",
        proposalId: contract.proposalId || "",
        value: contract.value,
        status: contract.status,
        type: contract.type,
        expiresAt: contract.expiresAt,
        documentName: contract.documentName || "",
        documentData: contract.documentData || "",
        documentType: contract.documentType || "",
      });
      setDocumentPreview(contract.documentName ? { name: contract.documentName, data: contract.documentData || "", type: contract.documentType || "" } : null);
      setIsDialogOpen(true);
    }
  };

  const openViewDialog = (contractId: string) => {
    setViewingContractId(contractId);
    setIsViewDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData(prev => ({
          ...prev,
          documentName: file.name,
          documentData: result,
          documentType: file.type,
        }));
        setDocumentPreview({ name: file.name, data: result, type: file.type });
        toast.success("Documento anexado com sucesso!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = () => {
    setFormData(prev => ({ ...prev, documentName: "", documentData: "", documentType: "" }));
    setDocumentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openDocumentViewer = (contract: typeof contracts[0]) => {
    if (contract.documentData) {
      setDocumentPreview({ name: contract.documentName || "Documento", data: contract.documentData, type: contract.documentType || "" });
      setIsDocumentViewerOpen(true);
    }
  };

  const downloadDocument = (contract: typeof contracts[0]) => {
    if (contract.documentData) {
      const link = document.createElement("a");
      link.href = contract.documentData;
      link.download = contract.documentName || "contrato";
      link.click();
      toast.success("Download iniciado!");
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.clientId || !formData.value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

    if (editingContractId) {
      updateContract(editingContractId, {
        title: formData.title,
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        proposalId: formData.proposalId || undefined,
        value: formData.value,
        status: formData.status,
        type: formData.type,
        expiresAt: formData.expiresAt,
        documentName: formData.documentName || undefined,
        documentData: formData.documentData || undefined,
        documentType: formData.documentType || undefined,
      });
      toast.success("Contrato atualizado com sucesso!");
    } else {
      addContract({
        title: formData.title,
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        proposalId: formData.proposalId || undefined,
        value: formData.value,
        status: formData.status,
        type: formData.type,
        createdAt: today,
        expiresAt: formData.expiresAt,
        documentName: formData.documentName || undefined,
        documentData: formData.documentData || undefined,
        documentType: formData.documentType || undefined,
      });
      toast.success("Contrato criado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingContractId) {
      deleteContract(deletingContractId);
      toast.success("Contrato removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingContractId(null);
    }
  };

  const handleSendForSignature = (contractId: string) => {
    updateContract(contractId, { status: "pending_signature" });
    toast.success("Contrato enviado para assinatura!");
  };

  const handleSign = () => {
    if (signingContractId) {
      const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
      updateContract(signingContractId, { status: "signed", signedAt: today });
      toast.success("Contrato assinado com sucesso!");
      setIsSignDialogOpen(false);
      setSigningContractId(null);
    }
  };

  const clientProjects = formData.clientId ? projects.filter(p => p.clientId === formData.clientId) : [];
  const clientProposals = formData.clientId ? proposals.filter(p => p.clientId === formData.clientId) : [];

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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredContracts.map((contract, index) => {
                  const StatusIcon = statusConfig[contract.status].icon;
                  const client = getClient(contract.clientId);
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
                      <td className="px-6 py-4 text-foreground">{client?.company || "—"}</td>
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
                      <td className="px-6 py-4">
                        {contract.documentName ? (
                          <button onClick={() => openDocumentViewer(contract)} className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <FileText className="w-4 h-4" />
                            {contract.documentName.length > 20 ? contract.documentName.substring(0, 20) + "..." : contract.documentName}
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem documento</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {contract.status === "draft" && (
                            <button onClick={() => handleSendForSignature(contract.id)} className="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Enviar para assinatura">
                              <Send className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          {contract.status === "pending_signature" && (
                            <button onClick={() => { setSigningContractId(contract.id); setIsSignDialogOpen(true); }} className="p-2 rounded-lg hover:bg-green-500/10 transition-colors" title="Assinar">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button onClick={() => openViewDialog(contract.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Visualizar">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {contract.documentName && (
                            <button onClick={() => downloadDocument(contract)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Download">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                          <ActionMenu items={[
                            { label: "Editar", icon: Edit, onClick: () => openEditDialog(contract.id) },
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
              const client = getClient(contract.clientId);
              return (
                <div key={contract.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSignature className="w-5 h-5 text-primary" />
                    </div>
                    <ActionMenu items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(contract.id) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(contract.id) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingContractId(contract.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{contract.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{client?.company || "—"}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[contract.type].color)}>{typeConfig[contract.type].label}</span>
                    <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", statusConfig[contract.status].color)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[contract.status].label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground mb-3">{contract.value}</p>
                  {contract.documentName && (
                    <button onClick={() => openDocumentViewer(contract)} className="flex items-center gap-2 text-sm text-primary hover:underline mb-3">
                      <FileText className="w-4 h-4" />
                      Ver documento
                    </button>
                  )}
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
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título do contrato" className="bg-secondary/50 border-border" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, projectId: "", proposalId: "" })}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.company} - {client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.clientId && clientProjects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="projectId">Projeto (opcional)</Label>
                <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Vincular a um projeto" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="">Nenhum</SelectItem>
                    {clientProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.clientId && clientProposals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="proposalId">Proposta (opcional)</Label>
                <Select value={formData.proposalId} onValueChange={(value) => setFormData({ ...formData, proposalId: value })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Vincular a uma proposta" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="">Nenhuma</SelectItem>
                    {clientProposals.map((proposal) => (
                      <SelectItem key={proposal.id} value={proposal.id}>{proposal.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor *</Label>
                <Input id="value" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="R$ 0,00" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}>
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
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}>
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
                <DatePicker
                  value={formData.expiresAt}
                  onChange={(value) => setFormData({ ...formData, expiresAt: value })}
                  placeholder="Selecione a validade"
                />
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label>Documento do Contrato</Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
              {documentPreview ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{documentPreview.name}</p>
                    <p className="text-xs text-muted-foreground">Documento anexado</p>
                  </div>
                  <button onClick={removeDocument} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 transition-all flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para anexar documento</span>
                  <span className="text-xs text-muted-foreground">PDF, DOC, DOCX, PNG, JPG (máx. 10MB)</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileSignature className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{viewingContract.title}</h3>
                  <p className="text-sm text-muted-foreground">{getClient(viewingContract.clientId)?.company || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[viewingContract.type].color)}>{typeConfig[viewingContract.type].label}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit border", statusConfig[viewingContract.status].color)}>
                    {statusConfig[viewingContract.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Valor</p>
                  <p className="text-lg font-bold text-foreground">{viewingContract.value}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Validade</p>
                  <p className="text-foreground">{viewingContract.expiresAt}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                  <p className="text-foreground">{viewingContract.createdAt}</p>
                </div>
                {viewingContract.signedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assinado em</p>
                    <p className="text-foreground">{viewingContract.signedAt}</p>
                  </div>
                )}
              </div>
              {viewingContract.documentName && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Documento Anexado</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openDocumentViewer(viewingContract)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Visualizar</span>
                    </button>
                    <button onClick={() => downloadDocument(viewingContract)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingContractId) openEditDialog(viewingContractId); }} className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="bg-card border-border sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">{documentPreview?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {documentPreview?.type.includes("pdf") ? (
              <iframe src={documentPreview.data} className="w-full h-[60vh] rounded-lg border border-border" />
            ) : documentPreview?.type.includes("image") ? (
              <img src={documentPreview.data} alt={documentPreview.name} className="w-full max-h-[60vh] object-contain rounded-lg" />
            ) : (
              <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                <FileText className="w-16 h-16 mb-4" />
                <p>Pré-visualização não disponível para este tipo de arquivo.</p>
                <p className="text-sm">Faça o download para visualizar.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setIsDocumentViewerOpen(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Fechar</button>
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
            <div className="py-4">
              <p className="text-muted-foreground mb-4">Você está prestes a assinar digitalmente o contrato:</p>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border mb-4">
                <p className="font-semibold text-foreground">{signingContract.title}</p>
                <p className="text-sm text-muted-foreground">{getClient(signingContract.clientId)?.company}</p>
                <p className="text-lg font-bold text-primary mt-2">{signingContract.value}</p>
              </div>
              <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setIsSignDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleSign} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">Assinar Digitalmente</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Contrato"
        description="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
