import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { parseCurrencyToNumber } from "@/lib/currency";
import { parseISO, isToday, isTomorrow, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Building2, Mail, Phone, Calendar, Eye, Edit, Trash2, FileText, FolderOpen, ClipboardList, FileSignature, CheckSquare, Circle, Clock, AlertCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { TableRowSkeleton, CardSkeleton, KanbanCardSkeleton } from "@/components/shared/ListSkeleton";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useClientMutations } from "@/hooks/mutations/useClientMutations";
import { useClients } from "@/hooks/useClients";
import { useClientProjects } from "@/hooks/useProjects";
import { useClientContracts } from "@/hooks/useContracts";
import { useClientTasks } from "@/hooks/useTasks";
import { useClientTickets } from "@/hooks/useTickets";
import { useClientKnowledge } from "@/hooks/useKnowledgeItems";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/shared/CurrencyInput";

const PAGE_SIZE = 50;

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-primary/10 text-primary border-blue-500/20" },
  qualificacao: { label: "Qualificação", color: "bg-muted/10 text-muted-foreground border-cyan-500/20" },
  proposta: { label: "Proposta", color: "bg-primary/10 text-primary border-primary/20" },
  negociacao: { label: "Negociação", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cliente: { label: "Cliente", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const taskStatusConfig = {
  todo: { label: "A Fazer", color: "bg-slate-500/10 text-slate-500", icon: Circle },
  in_progress: { label: "Em Progresso", color: "bg-primary/10 text-primary", icon: Clock },
  review: { label: "Em Revisão", color: "bg-amber-500/10 text-amber-500", icon: AlertCircle },
  done: { label: "Concluído", color: "bg-green-500/10 text-green-500", icon: CheckSquare },
};

const stageOrder: (keyof typeof stageConfig)[] = ["prospeccao", "qualificacao", "proposta", "negociacao", "cliente"];

export default function Clientes() {
  const { addClient, updateClient, deleteClient, isAdding, isUpdating } = useClientMutations();

  // ── Pagination + filter state ────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const search = useDebounce(searchInput, 300);

  // For kanban, we need all items per stage — no page cap when filtering by stage
  const isKanban = viewMode === "kanban";

  const { data: pageData, isLoading, isFetching } = useClients({
    page: isKanban ? 0 : page,
    pageSize: isKanban ? 500 : PAGE_SIZE,
    search,
    stage: selectedStage || undefined,
  });

  const clients = pageData?.clients ?? [];
  const total = pageData?.total ?? 0;

  const handleSearch = useCallback((v: string) => { setSearchInput(v); setPage(0); }, []);
  const handleStageFilter = useCallback((s: string | null) => { setSelectedStage(s); setPage(0); }, []);

  // ── Dialog state ─────────────────────────────────────────────────────────
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

  // ── Detail modal — per-client data loaded on-demand ──────────────────────
  const { data: clientProjects = [] } = useClientProjects(viewingClientId);
  const { data: clientContracts = [] } = useClientContracts(viewingClientId);
  const { data: clientKnowledge = [] } = useClientKnowledge(viewingClientId);
  const { data: clientTasks = [] } = useClientTasks(viewingClientId);
  const { data: clientTickets = [] } = useClientTickets(viewingClientId);

  const editingClient = editingClientId ? clients.find((c) => c.id === editingClientId) : null;
  const viewingClient = viewingClientId ? clients.find((c) => c.id === viewingClientId) : null;

  // ── Kanban grouping (client-side, from already-fetched page) ────────────
  const getClientsByStage = useMemo(() => {
    const map: Record<string, typeof clients> = {};
    for (const c of clients) {
      (map[c.stage] ??= []).push(c);
    }
    return (stage: string) => map[stage] ?? [];
  }, [clients]);

  // ── Potential value from contracts ────────────────────────────────────────
  const calculateClientPotentialValue = (clientId: string): string => {
    const cc = clientContracts.filter((c) => c.clientId === clientId);
    if (cc.length === 0) return "R$ 0,00";
    let total = 0;
    cc.forEach((contract) => {
      total += parseCurrencyToNumber(contract.value);
      if (contract.billingType === "implantacao_recorrencia" && contract.recurrenceValue) {
        total += parseCurrencyToNumber(contract.recurrenceValue) * 12;
      }
    });
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total);
  };

  const openNewDialog = useCallback(() => {
    setEditingClientId(null);
    setFormData({ name: "", company: "", email: "", phone: "", stage: "prospeccao", value: "", anniversary: "", head: "" });
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
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
  }, [clients]);

  const openViewDialog = useCallback((clientId: string) => {
    setViewingClientId(clientId);
    setIsViewDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name || !formData.company || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (editingClientId) {
      const updated = await updateClient(editingClientId, { ...formData, lastContact: "Agora" });
      if (updated) setIsDialogOpen(false);
    } else {
      const created = await addClient({ ...formData, lastContact: "Agora" });
      if (created) setIsDialogOpen(false);
    }
  }, [formData, editingClientId, updateClient, addClient]);

  const handleDelete = useCallback(() => {
    if (deletingClientId) {
      deleteClient(deletingClientId);
      setIsDeleteDialogOpen(false);
      setDeletingClientId(null);
    }
  }, [deletingClientId, deleteClient]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={Users}
          title="Clientes"
          subtitle="Gerencie sua base de clientes e prospects"
          actions={
            <button onClick={openNewDialog} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <ViewModeToggle modes={["table", "kanban", "grid"]} currentMode={viewMode} onChange={setViewMode} />
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(stageConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleStageFilter(selectedStage === key ? null : key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  selectedStage === key
                    ? config.color
                    : "bg-input text-muted-foreground border-border hover:bg-muted",
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
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Último Contato</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <TableRowSkeleton columns={5} rows={8} />
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  clients.map((client, index) => (
                    <tr
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => openViewDialog(client.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {client.name.split(" ").map((n) => n[0]).join("")}
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
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].color)}>
                          {stageConfig[client.stage].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {client.lastContact}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu items={[
                          { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(client.id) },
                          { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                          { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                        ]} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {!isLoading && (
              <div className="px-6 py-3 border-t border-border">
                <PaginationControls
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                  isFetching={isFetching}
                />
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageOrder.map((stage) => {
              const stageClients = getClientsByStage(stage);
              return (
                <div key={stage} className="flex-shrink-0 w-72">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <span className={cn("w-3 h-3 rounded-full", stageConfig[stage].color.split(" ")[0])} />
                    <span className="font-semibold text-foreground">{stageConfig[stage].label}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                      {stageClients.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {isLoading ? (
                      <KanbanCardSkeleton count={3} />
                    ) : (
                      stageClients.map((client) => (
                        <div
                          key={client.id}
                          className="p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
                          onClick={() => openViewDialog(client.id)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {client.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{client.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{client.lastContact}</p>
                        </div>
                      ))
                    )}
                    <button
                      onClick={openNewDialog}
                      className="w-full p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-input hover:border-primary/50 transition-all"
                    >
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <CardSkeleton count={6} />
              ) : clients.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
                  Nenhum cliente encontrado
                </div>
              ) : (
                clients.map((client, index) => (
                  <div
                    key={client.id}
                    className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-lg hover:border-primary/50 transition-all animate-scale-in cursor-pointer"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => openViewDialog(client.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {client.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ActionMenu items={[
                          { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(client.id) },
                          { label: "Editar", icon: Edit, onClick: () => openEditDialog(client.id) },
                          { label: "Excluir", icon: Trash2, onClick: () => { setDeletingClientId(client.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                        ]} />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />{client.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />{client.phone}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", stageConfig[client.stage].color)}>
                        {stageConfig[client.stage].label}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {!isLoading && viewMode === "grid" && (
              <PaginationControls
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                isFetching={isFetching}
              />
            )}
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
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
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" className="bg-input border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as keyof typeof stageConfig })}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
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
                <DatePicker value={formData.anniversary} onChange={(value) => setFormData({ ...formData, anniversary: value })} placeholder="Selecione a data" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head">Head</Label>
                <Select value={formData.head || "none"} onValueChange={(value) => setFormData({ ...formData, head: value === "none" ? "" : value })}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Selecione o Head" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="James">James</SelectItem>
                    <SelectItem value="João">João</SelectItem>
                    <SelectItem value="Edson">Edson</SelectItem>
                    <SelectItem value="Ryan">Ryan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={isAdding || isUpdating} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog with Related Data */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {viewingClient && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {viewingClient.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{viewingClient.name}</h3>
                  <p className="text-muted-foreground">{viewingClient.company}</p>
                  <span className={cn("inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium border", stageConfig[viewingClient.stage].color)}>
                    {stageConfig[viewingClient.stage].label}
                  </span>
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
                  <p className="text-xs text-muted-foreground mb-1">Último Contato</p>
                  <p className="text-foreground">{viewingClient.lastContact}</p>
                </div>
              </div>

              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-input">
                  <TabsTrigger value="projects" className="text-xs">
                    <FolderOpen className="w-3 h-3 mr-1" />Projetos ({clientProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">
                    <CheckSquare className="w-3 h-3 mr-1" />Tarefas ({clientTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="text-xs">
                    <FileSignature className="w-3 h-3 mr-1" />Contratos ({clientContracts.length})
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />Base ({clientKnowledge.length})
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="text-xs">
                    <ClipboardList className="w-3 h-3 mr-1" />Tickets ({clientTickets.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="mt-4 space-y-2">
                  {clientProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto vinculado</p>
                  ) : (
                    clientProjects.map((project) => (
                      <div key={project.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.status} • {project.progress}% concluído</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="mt-4 space-y-3">
                  {clientTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa vinculada</p>
                  ) : (
                    clientTasks.map((task) => {
                      const StatusIcon = taskStatusConfig[task.status]?.icon || Circle;
                      const project = clientProjects.find((p) => p.id === task.projectId);

                      const parseDate = (dateString: string) => {
                        if (!dateString) return null;
                        try { return parseISO(dateString); } catch {
                          const m = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                          if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
                          const d = new Date(dateString);
                          return !isNaN(d.getTime()) ? d : null;
                        }
                      };

                      const formatDueDate = (dateString: string) => {
                        const date = parseDate(dateString);
                        if (!date) return "Sem data";
                        if (isToday(date)) return "Hoje";
                        if (isTomorrow(date)) return "Amanhã";
                        const diff = differenceInDays(date, new Date());
                        if (diff < 7 && diff > 0) return format(date, "EEEE", { locale: ptBR });
                        return dateString;
                      };

                      return (
                        <div key={task.id} className="p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-all">
                          <div className="flex items-start gap-3">
                            <div className={cn("w-2 h-2 rounded-full mt-2", priorityColors[task.priority] || "bg-slate-500")} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-medium text-foreground truncate">{task.title}</p>
                                <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", taskStatusConfig[task.status]?.color || "bg-slate-500/10 text-slate-500")}>
                                  <StatusIcon className="w-3 h-3" />
                                  {taskStatusConfig[task.status]?.label || task.status}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {project && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="w-3 h-3" />{project.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatDueDate(task.dueDate)}
                                </span>
                                {task.assignees && task.assignees.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Circle className="w-3 h-3" />{task.assignees.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="contracts" className="mt-4 space-y-2">
                  {clientContracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum contrato vinculado</p>
                  ) : (
                    clientContracts.map((contract) => (
                      <div key={contract.id} className="p-3 rounded-lg bg-muted/30 border border-border">
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
                    clientKnowledge.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="tickets" className="mt-4 space-y-2">
                  {clientTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum ticket vinculado</p>
                  ) : (
                    clientTickets.map((ticket) => (
                      <div key={ticket.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="font-medium text-foreground">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">{ticket.status} • {ticket.priority}</p>
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
