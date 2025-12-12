import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Building2, Mail, Phone, Calendar, Eye, Edit, Trash2, LayoutGrid, Kanban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "cliente";
  value: string;
  lastContact: string;
}

const initialClients: Client[] = [
  { id: "1", name: "Carlos Silva", company: "TechCorp", email: "carlos@techcorp.com", phone: "(11) 99999-0001", stage: "cliente", value: "R$ 45.000", lastContact: "Há 2 dias" },
  { id: "2", name: "Ana Santos", company: "InnovateLab", email: "ana@innovatelab.com", phone: "(11) 99999-0002", stage: "proposta", value: "R$ 80.000", lastContact: "Há 1 dia" },
  { id: "3", name: "Pedro Costa", company: "DataFlow Inc", email: "pedro@dataflow.com", phone: "(11) 99999-0003", stage: "qualificacao", value: "R$ 35.000", lastContact: "Hoje" },
  { id: "4", name: "Maria Oliveira", company: "SmartRetail", email: "maria@smartretail.com", phone: "(11) 99999-0004", stage: "negociacao", value: "R$ 120.000", lastContact: "Há 3 dias" },
  { id: "5", name: "Lucas Mendes", company: "AIStartup", email: "lucas@aistartup.com", phone: "(11) 99999-0005", stage: "prospeccao", value: "R$ 25.000", lastContact: "Há 1 semana" },
  { id: "6", name: "Juliana Ferreira", company: "FinTech Plus", email: "juliana@fintechplus.com", phone: "(11) 99999-0006", stage: "cliente", value: "R$ 95.000", lastContact: "Há 4 dias" },
];

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  qualificacao: { label: "Qualificação", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  proposta: { label: "Proposta", color: "bg-primary/10 text-primary border-primary/20" },
  negociacao: { label: "Negociação", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cliente: { label: "Cliente", color: "bg-green-500/10 text-green-500 border-green-500/20" },
};

const stageOrder: (keyof typeof stageConfig)[] = ["prospeccao", "qualificacao", "proposta", "negociacao", "cliente"];

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stage: "prospeccao" as Client["stage"],
    value: "",
  });

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !selectedStage || client.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const openNewDialog = () => {
    setEditingClient(null);
    setFormData({ name: "", company: "", email: "", phone: "", stage: "prospeccao", value: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      stage: client.stage,
      value: client.value,
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (client: Client) => {
    setViewingClient(client);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.company || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingClient) {
      setClients(clients.map(c => 
        c.id === editingClient.id 
          ? { ...c, ...formData, lastContact: "Agora" }
          : c
      ));
      toast.success("Cliente atualizado com sucesso!");
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        ...formData,
        lastContact: "Agora",
      };
      setClients([...clients, newClient]);
      toast.success("Cliente adicionado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingClientId) {
      setClients(clients.filter(c => c.id !== deletingClientId));
      toast.success("Cliente removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingClientId(null);
    }
  };

  const getClientsByStage = (stage: string) => 
    filteredClients.filter(c => c.stage === stage);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e prospects</p>
          </div>
          <button 
            onClick={openNewDialog}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <ViewModeToggle 
            modes={["table", "kanban", "grid"]} 
            currentMode={viewMode} 
            onChange={setViewMode} 
          />

          <div className="flex items-center gap-2">
            {Object.entries(stageConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStage(selectedStage === key ? null : key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  selectedStage === key
                    ? config.color
                    : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                )}
              >
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
                  <tr
                    key={client.id}
                    className="hover:bg-secondary/20 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {client.name.split(" ").map(n => n[0]).join("")}
                          </span>
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
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border",
                        stageConfig[client.stage].color
                      )}>
                        {stageConfig[client.stage].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">{client.value}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {client.lastContact}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        items={[
                          { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(client) },
                          { label: "Editar", icon: Edit, onClick: () => openEditDialog(client) },
                          { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                        ]}
                      />
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
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
                    {getClientsByStage(stage).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {getClientsByStage(stage).map((client) => (
                    <div
                      key={client.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
                      onClick={() => openViewDialog(client)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {client.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-foreground">{client.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{client.lastContact}</p>
                    </div>
                  ))}
                  <button 
                    onClick={openNewDialog}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all"
                  >
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
              <div
                key={client.id}
                className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {client.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <ActionMenu
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(client) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(client) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]}
                  />
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
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].color)}>
                    {stageConfig[client.stage].label}
                  </span>
                  <span className="font-bold text-foreground">{client.value}</span>
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
            <DialogTitle className="text-foreground">
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nome da empresa"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-0000"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Estágio</Label>
              <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as Client["stage"] })}>
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
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="R$ 0,00"
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {editingClient ? "Salvar" : "Adicionar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {viewingClient && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {viewingClient.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewingClient.name}</h3>
                  <p className="text-muted-foreground">{viewingClient.company}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{viewingClient.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone</span>
                  <span className="text-foreground">{viewingClient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estágio</span>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[viewingClient.stage].color)}>
                    {stageConfig[viewingClient.stage].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-foreground">{viewingClient.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último Contato</span>
                  <span className="text-foreground">{viewingClient.lastContact}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => { setIsViewDialogOpen(false); if (viewingClient) openEditDialog(viewingClient); }}
              className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => setIsViewDialogOpen(false)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
