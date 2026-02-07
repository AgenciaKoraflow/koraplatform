import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Plus, Search, Building2, Mail, Phone, Calendar, Eye, Edit, Trash2, 
  MessageSquare, FileText, Gift, Clock, CheckCircle2, Users,
  Video, CalendarDays, StickyNote, TrendingUp, Heart, Star
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

// Mock data for interactions
const mockInteractions: ClientInteraction[] = [
  { id: "1", clientId: "1", type: "meeting", title: "Reunião de Kickoff", description: "Reunião inicial para alinhamento de expectativas e cronograma do projeto.", date: "2024-01-15", createdBy: "João Silva" },
  { id: "2", clientId: "1", type: "delivery", title: "Entrega Sprint 1", description: "Entrega dos primeiros módulos do sistema conforme planejado.", date: "2024-01-22", createdBy: "Maria Santos" },
  { id: "3", clientId: "1", type: "adjustment", title: "Ajuste de Layout", description: "Correções no layout da página inicial conforme feedback do cliente.", date: "2024-01-25", createdBy: "Pedro Costa" },
  { id: "4", clientId: "2", type: "meeting", title: "Review Mensal", description: "Revisão mensal de resultados e próximos passos.", date: "2024-02-01", createdBy: "Ana Lima" },
  { id: "5", clientId: "2", type: "note", title: "Observação Importante", description: "Cliente mencionou interesse em expandir o contrato para incluir mais módulos.", date: "2024-02-05", createdBy: "João Silva" },
];

const interactionTypeConfig = {
  meeting: { label: "Reunião", icon: Video, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  delivery: { label: "Entrega", icon: CheckCircle2, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  adjustment: { label: "Ajuste", icon: Edit, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  comment: { label: "Comentário", icon: MessageSquare, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  note: { label: "Anotação", icon: StickyNote, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
};

export default function ClientesAtivos() {
  const { clients, getProjectsByClient, getContractsByClient, getTicketsByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [interactions, setInteractions] = useState<ClientInteraction[]>(mockInteractions);
  const [interactionForm, setInteractionForm] = useState({
    type: "meeting" as ClientInteraction["type"],
    title: "",
    description: "",
    date: "",
  });

  // Filter only active clients (stage === "cliente")
  const activeClients = clients.filter((client) => client.stage === "cliente");

  const filteredClients = activeClients.filter((client) => {
    return client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
  const clientInteractions = selectedClientId 
    ? interactions.filter(i => i.clientId === selectedClientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const clientProjects = selectedClientId ? getProjectsByClient(selectedClientId) : [];
  const clientContracts = selectedClientId ? getContractsByClient(selectedClientId) : [];
  const clientTickets = selectedClientId ? getTicketsByClient(selectedClientId) : [];

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

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes Ativos</h1>
            <p className="text-muted-foreground mt-1">Gerencie relacionamentos e acompanhe interações com seus clientes</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{activeClients.length}</p>
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
                  <p className="text-3xl font-bold text-foreground mt-1">{interactions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Aniversários Próximos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">3</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Taxa de Retenção</p>
                  <p className="text-3xl font-bold text-foreground mt-1">94%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar clientes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
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
                {filteredClients.map((client, index) => {
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
                          "flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors",
                          selectedClientId === client.id && "bg-primary/5"
                        )}
                        onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                      >
                        <div className="flex items-center gap-4">
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
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {selectedClient.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
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
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
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
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(interaction.date).toLocaleDateString('pt-BR')}
                                      </span>
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

                <TabsContent value="projects">
                  <Card>
                    <CardContent className="p-6">
                      {clientProjects.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {clientProjects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                              <div>
                                <p className="font-medium">{project.name}</p>
                                <p className="text-sm text-muted-foreground">{project.description}</p>
                              </div>
                              <Badge>{project.status}</Badge>
                            </div>
                          ))}
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
                            <div key={contract.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
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
                            <div key={note.id} className="p-4 rounded-lg bg-secondary/30">
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

      {/* Add Interaction Dialog */}
      <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Interação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Interação</Label>
              <Select value={interactionForm.type} onValueChange={(value: ClientInteraction["type"]) => setInteractionForm({ ...interactionForm, type: value })}>
                <SelectTrigger className="bg-secondary/50 border-border">
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
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                type="date"
                id="date"
                value={interactionForm.date}
                onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={interactionForm.description}
                onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
                placeholder="Descreva os detalhes da interação..."
                className="bg-secondary/50 border-border min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInteractionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddInteraction}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
