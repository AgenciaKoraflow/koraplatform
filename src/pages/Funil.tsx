import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { parseCurrencyToNumber } from "@/lib/currency";
import { Plus, Search, Building2, Mail, Phone, Calendar, Eye, Edit, Trash2, TrendingUp, Users, DollarSign, Target, ChevronRight, FileText, Clock, AlertTriangle, CheckCircle, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { useData } from "@/contexts/DataContext";
import type { Client } from "@/types/data";
import { BU } from "@/types/bu";
import { BUBadge } from "@/components/shared/BUBadge";
import { BUSelect } from "@/components/shared/BUSelect";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-primary", bgColor: "bg-primary/10", textColor: "text-primary", borderColor: "border-primary/20" },
  qualificacao: { label: "Qualificação", color: "bg-primary", bgColor: "bg-primary/10", textColor: "text-primary", borderColor: "border-primary/20" },
  proposta: { label: "Proposta", color: "bg-primary", bgColor: "bg-primary/10", textColor: "text-primary", borderColor: "border-primary/20" },
  negociacao: { label: "Negociação", color: "bg-primary", bgColor: "bg-primary/10", textColor: "text-primary", borderColor: "border-primary/20" },
  cliente: { label: "Cliente", color: "bg-green-500", bgColor: "bg-green-500/10", textColor: "text-green-500", borderColor: "border-green-500/20" },
  cancelado: { label: "Cancelado", color: "bg-red-500", bgColor: "bg-red-500/10", textColor: "text-red-500", borderColor: "border-red-500/20" },
};

const stageOrder: (keyof typeof stageConfig)[] = ["prospeccao", "qualificacao", "proposta", "negociacao", "cliente", "cancelado"];

export default function Funil() {
  const { clients, projects, addClient, updateClient, deleteClient, getContractsByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    setDraggedClientId(clientId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', clientId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedClientId) {
      const client = clients.find(c => c.id === draggedClientId);
      if (client && client.stage !== targetStage) {
        // Update client stage
        await updateClient(draggedClientId, { 
          stage: targetStage as keyof typeof stageConfig,
          lastContact: "Agora"
        });
        toast.success(`${client.name} movido para ${stageConfig[targetStage as keyof typeof stageConfig].label}`);
      }
    }
    setDraggedClientId(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedClientId(null);
    setDragOverStage(null);
  };
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stage: "prospeccao" as keyof typeof stageConfig,
    value: "",
    anniversary: "",
    head: "",
    briefing: "",
    proposalSentDate: "",
    bu: "kora-agents" as BU,
  });

  // Função para calcular status da proposta (30 dias para expirar)
  const getProposalStatus = (proposalSentDate: string | undefined): { daysRemaining: number; isExpired: boolean; isExpiring: boolean } | null => {
    if (!proposalSentDate) return null;
    
    // Parse date from DD/MM/YYYY format
    let sentDate: Date;
    const ddmmyyyy = proposalSentDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      sentDate = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    } else {
      // Try ISO format or other formats
      sentDate = new Date(proposalSentDate);
    }
    
    // Check if date is valid
    if (isNaN(sentDate.getTime())) return null;
    
    const expirationDate = new Date(sentDate);
    expirationDate.setDate(expirationDate.getDate() + 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = expirationDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      daysRemaining,
      isExpired: daysRemaining < 0,
      isExpiring: daysRemaining >= 0 && daysRemaining <= 7
    };
  };

  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : null;

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !selectedStage || client.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const openNewDialog = () => {
    setEditingClientId(null);
    setFormData({ name: "", company: "", email: "", phone: "", stage: "prospeccao", value: "", anniversary: "", head: "", briefing: "", proposalSentDate: "", bu: "kora-agents" });
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
        briefing: (client as any).briefing || "",
        proposalSentDate: client.proposalSentDate || "",
        bu: client.bu || "kora-agents",
      });
      setIsDialogOpen(true);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.company) {
      toast.error("Preencha os campos obrigatórios (Nome e Empresa)");
      return;
    }

    if (editingClientId) {
      // Only pass fields that have values to avoid overwriting with empty strings
      const updateData: Partial<Client> = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        stage: formData.stage,
        lastContact: "Agora",
      };

      // Only include optional fields if they have values
      if (formData.value) updateData.value = formData.value;
      if (formData.anniversary) updateData.anniversary = formData.anniversary;
      if (formData.head) updateData.head = formData.head;
      if (formData.briefing) updateData.briefing = formData.briefing;
      if (formData.proposalSentDate) updateData.proposalSentDate = formData.proposalSentDate;
      if (formData.bu) updateData.bu = formData.bu;

      const updated = await updateClient(editingClientId, updateData);
      if (updated) setIsDialogOpen(false);
    } else {
      const created = await addClient({ ...formData, lastContact: "Agora" });
      if (created) setIsDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (deletingClientId) {
      deleteClient(deletingClientId);
      toast.success("Lead removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingClientId(null);
    }
  };

  const getClientsByStage = (stage: string) => 
    filteredClients.filter(c => c.stage === stage);

  const calculateClientPotentialValue = (clientId: string): string => {
    const clientContracts = getContractsByClient(clientId);
    if (clientContracts.length === 0) return "R$ 0,00";

    // Calculate total from contract projects (no recurrence)
    let total = 0;
    clientContracts.forEach(contract => {
      if (contract.projectIds && contract.projectIds.length > 0) {
        // Sum project values
        contract.projectIds.forEach(pid => {
          const proj = projects.find(p => p.id === pid);
          if (proj?.value) {
            total += parseCurrencyToNumber(proj.value);
          }
        });
      } else {
        // Use contract value if no projects
        total += parseCurrencyToNumber(contract.value);
      }
    });

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
  };

  const calculateStageValue = (stage: string): number => {
    return getClientsByStage(stage).reduce((acc, client) => {
      const contracts = getContractsByClient(client.id);
      return acc + contracts.reduce((sum, contract) => {
        // Calculate from contract projects (no recurrence)
        if (contract.projectIds && contract.projectIds.length > 0) {
          return sum + contract.projectIds.reduce((pSum, pid) => {
            const proj = projects.find(p => p.id === pid);
            return pSum + (proj?.value ? parseCurrencyToNumber(proj.value) : 0);
          }, 0);
        }
        return sum + parseCurrencyToNumber(contract.value);
      }, 0);
    }, 0);
  };

  const totalPipelineValue = stageOrder.reduce((acc, stage) => {
    // Exclude cancelled stage from pipeline value
    if (stage === 'cancelado') return acc;
    return acc + calculateStageValue(stage);
  }, 0);
  const totalLeads = filteredClients.length;
  const conversionRate = totalLeads > 0 
    ? Math.round((getClientsByStage('cliente').length / totalLeads) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={GitBranch}
          title="Funil de Vendas"
          subtitle="Visualize e gerencie seu pipeline comercial"
          kpi={{
            label: "Pipeline",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalPipelineValue),
            icon: TrendingUp,
          }}
          actions={
            <button
              onClick={openNewDialog}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow"
            >
              <Plus className="w-4 h-4" />
              Novo Lead
            </button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Valor Total Pipeline</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPipelineValue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total de Leads</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalLeads}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{conversionRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Em Negociação</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{getClientsByStage('negociacao').length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 pl-10 pr-4 rounded-md bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" />
          </div>
          <ViewModeToggle modes={["kanban", "table", "grid", "list"]} currentMode={viewMode} onChange={setViewMode} />
          <div className="flex items-center gap-2">
            {Object.entries(stageConfig).map(([key, config]) => (
              <button key={key} onClick={() => setSelectedStage(selectedStage === key ? null : key)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium border transition-all", selectedStage === key ? `${config.bgColor} ${config.textColor} ${config.borderColor}` : "bg-input text-muted-foreground border-border hover:bg-muted")}>
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Funnel View - New visualization */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {stageOrder.map((stage, index) => {
              const stageClients = getClientsByStage(stage);
              const stageValue = calculateStageValue(stage);
              const maxWidth = 100 - (index * 15);
              
              return (
                <div 
                  key={stage} 
                  className="relative group"
                  style={{ marginLeft: `${index * 2}%`, marginRight: `${index * 2}%` }}
                >
                  <div 
                    className={cn(
                      "rounded-xl p-4 transition-all cursor-pointer hover:shadow-medium border",
                      stageConfig[stage].bgColor,
                      stageConfig[stage].borderColor
                    )}
                    onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-4 h-4 rounded-full", stageConfig[stage].color)} />
                        <div>
                          <h3 className={cn("font-semibold text-lg", stageConfig[stage].textColor)}>
                            {stageConfig[stage].label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {stageClients.length} {stageClients.length === 1 ? 'lead' : 'leads'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stageValue)}
                          </p>
                          <p className="text-xs text-muted-foreground">valor potencial</p>
                        </div>
                        <ChevronRight className={cn("w-5 h-5 transition-transform", selectedStage === stage && "rotate-90")} />
                      </div>
                    </div>

                    {/* Expanded Clients List */}
                    {selectedStage === stage && stageClients.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                        {stageClients.map((client) => {
                          const proposalStatus = client.stage === "proposta" ? getProposalStatus(client.proposalSentDate) : null;
                          
                          return (
                          <div 
                            key={client.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-card/80 hover:bg-card transition-colors cursor-pointer"
                            onClick={() => openEditDialog(client.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {client.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{client.name}</p>
                                  {client.bu && <BUBadge bu={client.bu} showLabel={false} />}
                                </div>
                                <p className="text-sm text-muted-foreground">{client.company}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {proposalStatus && (
                                <span className={cn(
                                  "flex items-center gap-1 text-xs font-medium",
                                  proposalStatus.isExpired 
                                    ? "text-red-500" 
                                    : proposalStatus.isExpiring 
                                      ? "text-amber-500"
                                      : "text-green-500"
                                )}>
                                  {proposalStatus.isExpired ? (
                                    <>
                                      <AlertTriangle className="w-3 h-3" />
                                      Expirada
                                    </>
                                  ) : proposalStatus.isExpiring ? (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      {proposalStatus.daysRemaining}d
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      {proposalStatus.daysRemaining}d
                                    </>
                                  )}
                                </span>
                              )}
                              <span className="font-semibold">{calculateClientPotentialValue(client.id)}</span>
                              <div onClick={(e) => e.stopPropagation()}>
                                <ActionMenu items={[
                                  { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                                  { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                                ]} />
                              </div>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
            {stageOrder.map((stage) => (
              <div 
                key={stage} 
                className={cn(
                  "flex-shrink-0 w-64 transition-all duration-200 rounded-lg p-2",
                  dragOverStage === stage && stageConfig[stage].bgColor
                )}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className={cn("flex items-center justify-between mb-3 px-2 py-1.5 rounded-lg", stageConfig[stage].bgColor)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full", stageConfig[stage].color)} />
                    <span className={cn("font-semibold", stageConfig[stage].textColor)}>{stageConfig[stage].label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-background text-xs font-medium">{getClientsByStage(stage).length}</span>
                </div>
                <div className="space-y-3">
                  {getClientsByStage(stage).map((client) => {
                    const proposalStatus = client.stage === "proposta" ? getProposalStatus(client.proposalSentDate) : null;
                    
                    return (
                    <Card 
                      key={client.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "hover:shadow-medium transition-all cursor-grab active:cursor-grabbing group mb-2",
                        draggedClientId === client.id && "opacity-50 scale-95"
                      )}
                      onClick={() => openEditDialog(client.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary">{client.name.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <p className="font-medium text-foreground text-sm truncate">{client.name}</p>
                                {client.bu && <BUBadge bu={client.bu} showLabel={false} />}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <ActionMenu items={[
                              { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                              { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                            ]} />
                          </div>
                        </div>
                        {/* Indicador de expiração da proposta */}
                        {proposalStatus && (
                          <div className={cn(
                            "flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded text-xs font-medium",
                            proposalStatus.isExpired 
                              ? "bg-red-500/10 text-red-500" 
                              : proposalStatus.isExpiring 
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-green-500/10 text-green-500"
                          )}>
                            {proposalStatus.isExpired ? (
                              <>
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{Math.abs(proposalStatus.daysRemaining)}d</span>
                              </>
                            ) : proposalStatus.isExpiring ? (
                              <>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{proposalStatus.daysRemaining}d</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{proposalStatus.daysRemaining}d</span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground">{calculateClientPotentialValue(client.id)}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[60px]">{client.lastContact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )})}
                  <button onClick={openNewDialog} className="w-full p-2 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-input hover:border-primary/50 transition-all">
                    <Plus className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Último Contato</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.map((client, index) => {
                  const proposalStatus = client.stage === "proposta" ? getProposalStatus(client.proposalSentDate) : null;
                  
                  return (
                  <tr 
                    key={client.id} 
                    className="hover:bg-muted/20 transition-colors animate-slide-up cursor-pointer" 
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => openEditDialog(client.id)}
                  >
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("px-3 py-1 rounded-full text-xs font-medium border w-fit", stageConfig[client.stage].bgColor, stageConfig[client.stage].textColor, stageConfig[client.stage].borderColor)}>
                            {stageConfig[client.stage].label}
                          </span>
                          {client.bu && <BUBadge bu={client.bu} />}
                        </div>
                        {proposalStatus && (
                          <span className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            proposalStatus.isExpired 
                              ? "text-red-500" 
                              : proposalStatus.isExpiring 
                                ? "text-amber-500"
                                : "text-green-500"
                          )}>
                            {proposalStatus.isExpired ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                Expirada
                              </>
                            ) : proposalStatus.isExpiring ? (
                              <>
                                <Clock className="w-3 h-3" />
                                {proposalStatus.daysRemaining} dias
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                {proposalStatus.daysRemaining} dias
                              </>
                            )}
                          </span>
                        )}
                      </div>
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
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={[
                        { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                        { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                      ]} />
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, index) => {
              const proposalStatus = client.stage === "proposta" ? getProposalStatus(client.proposalSentDate) : null;
              
              return (
              <Card 
                key={client.id} 
                className="hover:shadow-medium transition-all animate-scale-in cursor-pointer" 
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => openEditDialog(client.id)}
              >
                <CardContent className="p-5">
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={[
                        { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                        { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                      ]} />
                    </div>
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
                  {/* Indicador de expiração da proposta */}
                  {proposalStatus && (
                    <div className={cn(
                      "flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md text-xs font-medium",
                      proposalStatus.isExpired 
                        ? "bg-red-500/10 text-red-500" 
                        : proposalStatus.isExpiring 
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-green-500/10 text-green-500"
                    )}>
                      {proposalStatus.isExpired ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Expirada há {Math.abs(proposalStatus.daysRemaining)} dias</span>
                        </>
                      ) : proposalStatus.isExpiring ? (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Expira em {proposalStatus.daysRemaining} dias</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>{proposalStatus.daysRemaining} dias restantes</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].bgColor, stageConfig[client.stage].textColor, stageConfig[client.stage].borderColor)}>{stageConfig[client.stage].label}</span>
                    <span className="font-bold text-foreground">{calculateClientPotentialValue(client.id)}</span>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingClient ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do contato" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Nome da empresa" className="bg-input border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" className="bg-input border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="briefing">Briefing</Label>
              <Textarea id="briefing" value={formData.briefing} onChange={(e) => setFormData({ ...formData, briefing: e.target.value })} placeholder="Descreva a necessidade e o que o cliente busca..." className="bg-input border-border min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select value={formData.stage} onValueChange={(value: keyof typeof stageConfig) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor Estimado</Label>
                <CurrencyInput value={formData.value} onChange={(value) => setFormData({ ...formData, value })} placeholder="R$ 0,00" className="bg-input border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="head">Responsável</Label>
                <Input id="head" value={formData.head} onChange={(e) => setFormData({ ...formData, head: e.target.value })} placeholder="Nome do responsável" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bu">BU</Label>
                <BUSelect value={formData.bu} onChange={(bu) => setFormData({ ...formData, bu })} />
              </div>
            </div>
            {/* Campo de data de envio da proposta - visível apenas quando estágio é "proposta" */}
            {formData.stage === "proposta" && (
              <div className="space-y-2">
                <Label htmlFor="proposalSentDate">Data de Envio da Proposta</Label>
                <DatePicker
                  value={formData.proposalSentDate}
                  onChange={(date) => setFormData({ ...formData, proposalSentDate: date })}
                  placeholder="Selecione a data de envio"
                />
                {formData.proposalSentDate && (
                  <p className="text-xs text-muted-foreground">
                    A proposta expira em 30 dias após o envio.
                    {getProposalStatus(formData.proposalSentDate) && (
                      <span className={cn(
                        "ml-1 font-medium",
                        getProposalStatus(formData.proposalSentDate)?.isExpired ? "text-red-500" :
                        getProposalStatus(formData.proposalSentDate)?.isExpiring ? "text-amber-500" : "text-green-500"
                      )}>
                        {getProposalStatus(formData.proposalSentDate)?.isExpired 
                          ? " (Expirada há " + Math.abs(getProposalStatus(formData.proposalSentDate)!.daysRemaining) + " dias)"
                          : " (" + getProposalStatus(formData.proposalSentDate)!.daysRemaining + " dias restantes)"}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingClient ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Lead"
        description="Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita e todos os dados relacionados serão removidos."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
