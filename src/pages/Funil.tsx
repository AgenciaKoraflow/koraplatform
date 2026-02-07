import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { parseCurrencyToNumber } from "@/lib/currency";
import { Plus, Search, Building2, Mail, Phone, Calendar, Eye, Edit, Trash2, TrendingUp, Users, DollarSign, Target, ChevronRight } from "lucide-react";
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
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-blue-500", bgColor: "bg-blue-500/10", textColor: "text-blue-500", borderColor: "border-blue-500/20" },
  qualificacao: { label: "Qualificação", color: "bg-cyan-500", bgColor: "bg-cyan-500/10", textColor: "text-cyan-500", borderColor: "border-cyan-500/20" },
  proposta: { label: "Proposta", color: "bg-primary", bgColor: "bg-primary/10", textColor: "text-primary", borderColor: "border-primary/20" },
  negociacao: { label: "Negociação", color: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-500", borderColor: "border-amber-500/20" },
  cliente: { label: "Cliente", color: "bg-green-500", bgColor: "bg-green-500/10", textColor: "text-green-500", borderColor: "border-green-500/20" },
};

const stageOrder: (keyof typeof stageConfig)[] = ["prospeccao", "qualificacao", "proposta", "negociacao", "cliente"];

export default function Funil() {
  const { clients, addClient, updateClient, deleteClient, getContractsByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
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

  const handleSave = () => {
    if (!formData.name || !formData.company || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingClientId) {
      updateClient(editingClientId, { ...formData, lastContact: "Agora" });
      toast.success("Lead atualizado com sucesso!");
    } else {
      addClient({ ...formData, lastContact: "Agora" });
      toast.success("Lead adicionado com sucesso!");
    }
    setIsDialogOpen(false);
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

    let total = 0;
    clientContracts.forEach(contract => {
      const mainValue = parseCurrencyToNumber(contract.value);
      total += mainValue;

      if (contract.billingType === 'implantacao_recorrencia' && contract.recurrenceValue) {
        const recurrenceValue = parseCurrencyToNumber(contract.recurrenceValue);
        total += recurrenceValue * 12;
      }
    });

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
  };

  const calculateStageValue = (stage: string): number => {
    return getClientsByStage(stage).reduce((acc, client) => {
      const contracts = getContractsByClient(client.id);
      return acc + contracts.reduce((sum, c) => sum + parseCurrencyToNumber(c.value), 0);
    }, 0);
  };

  const totalPipelineValue = stageOrder.reduce((acc, stage) => acc + calculateStageValue(stage), 0);
  const totalLeads = filteredClients.length;
  const conversionRate = totalLeads > 0 
    ? Math.round((getClientsByStage('cliente').length / totalLeads) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funil de Vendas</h1>
            <p className="text-muted-foreground mt-1">Visualize e gerencie seu pipeline comercial</p>
          </div>
          <Button onClick={openNewDialog} className="shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total de Leads</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalLeads}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{conversionRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Em Negociação</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{getClientsByStage('negociacao').length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <ViewModeToggle modes={["kanban", "table", "grid", "list"]} currentMode={viewMode} onChange={setViewMode} />
          <div className="flex items-center gap-2">
            {Object.entries(stageConfig).map(([key, config]) => (
              <button key={key} onClick={() => setSelectedStage(selectedStage === key ? null : key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", selectedStage === key ? `${config.bgColor} ${config.textColor} ${config.borderColor}` : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
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
                        {stageClients.map((client) => (
                          <div 
                            key={client.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-card/80 hover:bg-card transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {client.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{client.name}</p>
                                <p className="text-sm text-muted-foreground">{client.company}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold">{calculateClientPotentialValue(client.id)}</span>
                              <ActionMenu items={[
                                { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                                { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                              ]} />
                            </div>
                          </div>
                        ))}
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
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageOrder.map((stage) => (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className={cn("flex items-center justify-between mb-4 px-3 py-2 rounded-lg", stageConfig[stage].bgColor)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full", stageConfig[stage].color)} />
                    <span className={cn("font-semibold", stageConfig[stage].textColor)}>{stageConfig[stage].label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-background text-xs font-medium">{getClientsByStage(stage).length}</span>
                </div>
                <div className="space-y-3">
                  {getClientsByStage(stage).map((client) => (
                    <Card key={client.id} className="hover:shadow-medium transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{client.name.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{client.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                            </div>
                          </div>
                          <ActionMenu items={[
                            { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                            { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                          ]} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-foreground">{calculateClientPotentialValue(client.id)}</p>
                          <p className="text-xs text-muted-foreground">{client.lastContact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <button onClick={openNewDialog} className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all">
                    <Plus className="w-4 h-4 mx-auto" />
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
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
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
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].bgColor, stageConfig[client.stage].textColor, stageConfig[client.stage].borderColor)}>
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

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, index) => (
              <Card key={client.id} className="hover:shadow-medium transition-all animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
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
                    <ActionMenu items={[
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
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].bgColor, stageConfig[client.stage].textColor, stageConfig[client.stage].borderColor)}>{stageConfig[client.stage].label}</span>
                    <span className="font-bold text-foreground">{calculateClientPotentialValue(client.id)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingClient ? "Editar Lead" : "Novo Lead"}</DialogTitle>
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
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" className="bg-secondary/50 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select value={formData.stage} onValueChange={(value: keyof typeof stageConfig) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
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
                <CurrencyInput value={formData.value} onChange={(value) => setFormData({ ...formData, value })} placeholder="R$ 0,00" className="bg-secondary/50 border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="head">Responsável</Label>
              <Input id="head" value={formData.head} onChange={(e) => setFormData({ ...formData, head: e.target.value })} placeholder="Nome do responsável" className="bg-secondary/50 border-border" />
            </div>
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
