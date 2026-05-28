import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Mail, Phone, Calendar, Edit,
  MessageSquare, FileText, Gift, Clock, CheckCircle2, Users,
  Video, CalendarDays, StickyNote, Heart, CheckSquare, Circle, AlertCircle, HeartHandshake,
  Pencil, Trash2, MoreVertical
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useAllContracts } from "@/hooks/useContracts";
import { useAllTickets } from "@/hooks/useTickets";
import { useAllTasks } from "@/hooks/useTasks";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { ProjectGantt } from "@/components/shared/ProjectGantt";
import { Project } from "@/types/data";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Type for interaction/activity
interface ClientInteraction {
  id: string;
  clientId: string;
  type: "meeting" | "delivery" | "adjustment" | "comment" | "note";
  title: string;
  description: string;
  date: string;
  createdBy?: string;
}

// No mock data - using real data from database
const mockInteractions: ClientInteraction[] = []; // Empty - will be populated from database if available

const interactionTypeConfig = {
  meeting: { label: "Reunião", icon: Video, color: "bg-primary/10 text-primary border-blue-500/20" },
  delivery: { label: "Entrega", icon: CheckCircle2, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  adjustment: { label: "Ajuste", icon: Edit, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  comment: { label: "Comentário", icon: MessageSquare, color: "bg-muted/10 text-muted-foreground border-purple-500/20" },
  note: { label: "Anotação", icon: StickyNote, color: "bg-muted/10 text-muted-foreground border-cyan-500/20" },
};

export default function ClientesAtivos() {
  const [searchParams] = useSearchParams();
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const { data: contracts = [] } = useAllContracts();
  const { data: tickets = [] } = useAllTickets();
  const { data: tasks = [] } = useAllTasks();
  const getProjectsByClient = (clientId: string) => projects.filter(p => p.clientId === clientId);
  const getContractsByClient = (clientId: string) => contracts.filter(c => c.clientId === clientId);
  const _getTicketsByClient = (clientId: string) => tickets.filter(t => t.clientId === clientId);
  const getTasksByClient = (clientId: string) => tasks.filter(t => t.clientId === clientId);
  const getTasksByProject = (projectId: string) => tasks.filter(t => t.projectId === projectId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHead, setSelectedHead] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Open specific client from notification deep-link (?client=<id>)
  useEffect(() => {
    const clientId = searchParams.get("client");
    if (!clientId || clients.length === 0) return;
    const exists = clients.find((c) => c.id === clientId);
    if (exists) setSelectedClientId(clientId);
  }, [searchParams, clients]);
  const [ganttProject, setGanttProject] = useState<Project | null>(null);
  const [showAnniversaryDialog, setShowAnniversaryDialog] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<ClientInteraction | null>(null);
  const [interactions, setInteractions] = useState<ClientInteraction[]>(mockInteractions);
  const [interactionForm, setInteractionForm] = useState({
    type: "meeting" as ClientInteraction["type"],
    title: "",
    description: "",
    date: "",
  });

  // Filter only active clients (stage === "cliente")
  const activeClients = clients.filter((client) => client.stage === "cliente");

  const availableHeads = [...new Set(
    activeClients.map((c) => c.head).filter((h): h is string => !!h)
  )].sort();

  const filteredClients = activeClients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHead = !selectedHead || client.head === selectedHead;
    return matchesSearch && matchesHead;
  });

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
  const clientInteractions = selectedClientId
    ? interactions.filter(i => i.clientId === selectedClientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const clientProjects = selectedClientId ? getProjectsByClient(selectedClientId) : [];
  const clientContracts = selectedClientId ? getContractsByClient(selectedClientId) : [];
  const clientTasks = selectedClientId ? getTasksByClient(selectedClientId) : [];

  const handleAddInteraction = () => {
    if (!selectedClientId || !interactionForm.title || !interactionForm.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const newInteraction: ClientInteraction = {
      id: Date.now().toString(),
      clientId: selectedClientId,
      ...interactionForm,
      createdBy: "Usuário Atual",
    };

    setInteractions([...interactions, newInteraction]);
    setIsInteractionDialogOpen(false);
    setInteractionForm({ type: "meeting", title: "", description: "", date: "" });
    toast.success("Interação adicionada com sucesso!");
  };

  const handleOpenEditInteraction = (interaction: ClientInteraction) => {
    setEditingInteraction(interaction);
    setInteractionForm({
      type: interaction.type,
      title: interaction.title,
      description: interaction.description,
      date: interaction.date,
    });
    setIsInteractionDialogOpen(true);
  };

  const handleSaveInteraction = () => {
    if (!interactionForm.title || !interactionForm.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingInteraction) {
      setInteractions(interactions.map(i =>
        i.id === editingInteraction.id
          ? { ...i, ...interactionForm }
          : i
      ));
      toast.success("Interação atualizada com sucesso!");
    } else {
      handleAddInteraction();
      return;
    }

    setIsInteractionDialogOpen(false);
    setEditingInteraction(null);
    setInteractionForm({ type: "meeting", title: "", description: "", date: "" });
  };

  const handleDeleteInteraction = (interactionId: string) => {
    setInteractions(interactions.filter(i => i.id !== interactionId));
    toast.success("Interação removida com sucesso!");
  };

  const calculateContractAnniversary = (clientId: string): string | null => {
    const contracts = getContractsByClient(clientId);
    if (contracts.length === 0) return null;

    const signedContract = contracts.find(c => c.signedAt);
    if (signedContract?.signedAt) {
      return signedContract.signedAt;
    }
    return null;
  };

  const getDaysUntilAnniversary = (anniversaryDate: string): number => {
    const today = new Date();
    const anniversary = new Date(anniversaryDate);
    anniversary.setFullYear(today.getFullYear());

    if (anniversary < today) {
      anniversary.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = anniversary.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate upcoming birthdays
  const getUpcomingBirthdays = (days: number = 30) => {
    return activeClients
      .map(client => {
        if (!client.anniversary) return null;
        const daysUntil = getDaysUntilAnniversary(client.anniversary);
        if (daysUntil <= days) {
          return { client, daysUntil };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.daysUntil - b!.daysUntil);
  };

  const upcomingBirthdays = getUpcomingBirthdays(30);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={HeartHandshake}
          title="Clientes Ativos"
          subtitle="Gerencie relacionamentos e acompanhe interações com seus clientes"
          kpi={{
            label: "Ativos",
            value: activeClients.length,
            icon: Users,
          }}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Clientes Ativos</p>
                  <p className="text-xl font-bold text-foreground mt-1">{activeClients.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Interações este Mês</p>
                  <p className="text-xl font-bold text-foreground mt-1">{interactions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={() => setShowAnniversaryDialog(true)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Aniversários Próximos</p>
                  <p className="text-xl font-bold text-foreground mt-1">{upcomingBirthdays.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa de Retenção</p>
                  <p className="text-xl font-bold text-foreground mt-1">94%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar clientes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          {availableHeads.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Head:</span>
              <select
                value={selectedHead || ""}
                onChange={(e) => setSelectedHead(e.target.value || null)}
                className="px-3 py-2 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todos</option>
                {availableHeads.map((head) => (
                  <option key={head} value={head}>{head}</option>
                ))}
              </select>
            </div>
          )}
          <ViewModeToggle modes={["grid", "list"]} currentMode={viewMode} onChange={setViewMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <div className={cn("space-y-4", selectedClientId ? "lg:col-span-1" : "lg:col-span-3")}>
            {viewMode === "grid" ? (
              <div className={cn(
                "grid gap-4",
                selectedClientId ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {filteredClients.map((client) => {
                  const anniversary = calculateContractAnniversary(client.id);
                  const daysUntil = anniversary ? getDaysUntilAnniversary(anniversary) : null;

                  return (
                    <Card
                      key={client.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-medium",
                        selectedClientId === client.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <ClientAvatar client={client} size="lg" />
                            <div>
                              <p className="font-semibold text-foreground">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.company}</p>
                            </div>
                          </div>
                          {daysUntil && daysUntil <= 30 && (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                              <Gift className="w-3 h-3 mr-1" />
                              {daysUntil}d
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="w-3 h-3" />
                              {getProjectsByClient(client.id).length} projetos
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {client.lastContact}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className={cn(
                          "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors",
                          selectedClientId === client.id && "bg-primary/5"
                        )}
                        onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                      >
                        <div className="flex items-center gap-4">
                          <ClientAvatar client={client} size="md" />
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            {getProjectsByClient(client.id).length} projetos
                          </Badge>
                          <span className="text-sm text-muted-foreground">{client.lastContact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Client Details Panel */}
          {selectedClient && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <ClientAvatar client={selectedClient} size="xl" className="rounded-xl" />
                      <div>
                        <CardTitle className="text-xl">{selectedClient.name}</CardTitle>
                        <p className="text-muted-foreground">{selectedClient.company}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedClient.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedClient.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setIsInteractionDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Interação
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{clientProjects.length}</p>
                    <p className="text-xs text-muted-foreground">Projetos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{clientContracts.length}</p>
                    <p className="text-xs text-muted-foreground">Contratos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{clientInteractions.length}</p>
                    <p className="text-xs text-muted-foreground">Interações</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for Client Details */}
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList className="bg-input">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                  <TabsTrigger value="projects">Projetos</TabsTrigger>
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
                  <TabsTrigger value="notes">Anotações</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                  <Card>
                    <CardContent className="p-6">
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="relative space-y-6">
                          {/* Timeline line */}
                          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />

                          {clientInteractions.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                              <p className="text-muted-foreground">Nenhuma interação registrada</p>
                              <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsInteractionDialogOpen(true)}>
                                Adicionar primeira interação
                              </Button>
                            </div>
                          ) : (
                            clientInteractions.map((interaction) => {
                              const config = interactionTypeConfig[interaction.type];
                              const Icon = config.icon;

                              return (
                                <div key={interaction.id} className="relative flex gap-4 pl-2">
                                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-background", config.color)}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 pb-6">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground">{interaction.title}</span>
                                        <Badge variant="secondary" className={cn("text-xs", config.color)}>
                                          {config.label}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(interaction.date).toLocaleDateString('pt-BR')}
                                        </span>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                              <MoreVertical className="w-3.5 h-3.5" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenEditInteraction(interaction)}>
                                              <Pencil className="w-4 h-4 mr-2" />
                                              Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() => handleDeleteInteraction(interaction.id)}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Excluir
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{interaction.description}</p>
                                    {interaction.createdBy && (
                                      <p className="text-xs text-muted-foreground mt-2">Por: {interaction.createdBy}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks">
                  <Card>
                    <CardContent className="p-6">
                      {clientTasks.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-none">
                          {clientTasks.map((task) => {
                            const StatusIcon = task.status === "done" ? CheckSquare : (task.status === "in_progress" ? Clock : (task.status === "review" ? AlertCircle : Circle));
                            const project = clientProjects.find(p => p.id === task.projectId);

                            return (
                              <div key={task.id} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                                <div className={cn(
                                  "w-2 h-2 rounded-full mt-2",
                                  task.priority === "high" ? "bg-red-500" :
                                    task.priority === "medium" ? "bg-amber-500" : "bg-green-500"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className={cn("font-medium", task.status === "done" ? "line-through text-muted-foreground" : "text-foreground")}>
                                      {task.title}
                                    </p>
                                    <Badge className={cn(
                                      task.status === "done" ? "bg-green-500/10 text-green-500" :
                                        task.status === "in_progress" ? "bg-primary/10 text-primary" :
                                          task.status === "review" ? "bg-amber-500/10 text-amber-500" :
                                            "bg-slate-500/10 text-slate-500"
                                    )}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {task.status === "todo" ? "A Fazer" :
                                        task.status === "in_progress" ? "Em Andamento" :
                                          task.status === "review" ? "Em Validação Interna" : "Concluído"}
                                    </Badge>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {project && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {project.name}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {task.dueDate}
                                    </span>
                                    {task.assignees && task.assignees.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {task.assignees.join(", ")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects">
                  <Card>
                    <CardContent className="p-6">
                      {clientProjects.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
                        </div>
                      ) : ganttProject ? (
                        <div>
                          <div className="flex items-center gap-3 mb-5">
                            <button
                              onClick={() => setGanttProject(null)}
                              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                              Projetos
                            </button>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-sm font-semibold text-foreground">{ganttProject.name}</span>
                          </div>
                          <ProjectGantt
                            project={ganttProject}
                            tasks={getTasksByProject(ganttProject.id)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {clientProjects.map((project) => {
                            const tasks = getTasksByProject(project.id);
                            const done = tasks.filter(t => t.status === "done").length;
                            const statusColors: Record<string, string> = {
                              planning: "bg-slate-500/10 text-slate-500",
                              in_progress: "bg-blue-500/10 text-blue-500",
                              review: "bg-amber-500/10 text-amber-500",
                              completed: "bg-emerald-500/10 text-emerald-500",
                              on_hold: "bg-slate-400/10 text-slate-400",
                            };
                            return (
                              <button
                                key={project.id}
                                onClick={() => setGanttProject(project)}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-border transition-all text-left group"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-foreground truncate">{project.name}</p>
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0", statusColors[project.status] ?? "bg-muted text-muted-foreground")}>
                                      {project.status.replace("_", " ")}
                                    </span>
                                  </div>
                                  {project.description && (
                                    <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                                  )}
                                  {tasks.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">{done}/{tasks.length} tarefas</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                  <span className="text-[10px] text-muted-foreground">{project.dueDate}</span>
                                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contracts">
                  <Card>
                    <CardContent className="p-6">
                      {clientContracts.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">Nenhum contrato encontrado</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {clientContracts.map((contract) => (
                            <div key={contract.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                              <div>
                                <p className="font-medium">{contract.title}</p>
                                <p className="text-sm text-muted-foreground">Valor: {contract.value}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge>{contract.status}</Badge>
                                {contract.signedAt && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    Assinado em {contract.signedAt}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {clientInteractions.filter(i => i.type === "note" || i.type === "comment").length === 0 ? (
                          <div className="text-center py-8">
                            <StickyNote className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">Nenhuma anotação encontrada</p>
                          </div>
                        ) : (
                          clientInteractions.filter(i => i.type === "note" || i.type === "comment").map((note) => (
                            <div key={note.id} className="p-4 rounded-lg bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">{note.title}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{note.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Interaction Dialog */}
      <Dialog open={isInteractionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingInteraction(null);
          setInteractionForm({ type: "meeting", title: "", description: "", date: "" });
        }
        setIsInteractionDialogOpen(open);
      }}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingInteraction ? "Editar Interação" : "Nova Interação"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Interação</Label>
              <Select value={interactionForm.type} onValueChange={(value: ClientInteraction["type"]) => setInteractionForm({ ...interactionForm, type: value })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(interactionTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={interactionForm.title}
                onChange={(e) => setInteractionForm({ ...interactionForm, title: e.target.value })}
                placeholder="Ex: Reunião de alinhamento"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                type="date"
                id="date"
                value={interactionForm.date}
                onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={interactionForm.description}
                onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
                placeholder="Descreva os detalhes da interação..."
                className="bg-input border-border min-h-[100px]"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInteractionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={editingInteraction ? handleSaveInteraction : handleAddInteraction}>
              {editingInteraction ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Birthday Dialog */}
      <Dialog open={showAnniversaryDialog} onOpenChange={setShowAnniversaryDialog}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              Aniversários Próximos
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="py-4">
            {upcomingBirthdays.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum aniversário nos próximos 30 dias
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map(({ client, daysUntil }) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setShowAnniversaryDialog(false);
                      setSelectedClientId(client.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-amber-600">
                          {client.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        {daysUntil === 0 ? "Hoje! 🎉" : daysUntil === 1 ? "Amanhã" : `${daysUntil} dias`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
