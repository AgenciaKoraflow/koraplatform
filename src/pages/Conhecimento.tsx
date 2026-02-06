import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, FileText, Key, Link2, Eye, EyeOff, Copy, ExternalLink, Edit, Trash2, Users, Lightbulb, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { KnowledgeGroupedByClient } from "@/components/conhecimento/KnowledgeGroupedByClient";
import { InsightsManager } from "@/components/insights/InsightsManager";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { KnowledgeItem } from "@/types/data";

const categoryConfig = {
  credencial: { label: "Credencial", color: "bg-amber-500/10 text-amber-500", icon: Key },
  documento: { label: "Documento", color: "bg-blue-500/10 text-blue-500", icon: FileText },
  link: { label: "Link", color: "bg-green-500/10 text-green-500", icon: Link2 },
};

const tagCategories = ["Cloud", "Técnico", "Desenvolvimento", "Database", "Treinamento", "IA", "Ambiente", "Comercial"];

export default function Conhecimento() {
  const { knowledgeItems, clients, projects, addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getClient, getProjectsByClient } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [groupByClient, setGroupByClient] = useState(false);
  const [activeTab, setActiveTab] = useState("base");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "credencial" as KnowledgeItem["category"],
    clientId: "",
    projectId: "",
    content: "",
    username: "",
    password: "",
    url: "",
    tags: "",
  });

  const filteredItems = knowledgeItems.filter((item) => {
    const client = item.clientId ? getClient(item.clientId) : null;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || item.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const availableProjects = formData.clientId ? getProjectsByClient(formData.clientId) : [];

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado para a área de transferência!");
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData({ title: "", category: "credencial", clientId: "", projectId: "", content: "", username: "", password: "", url: "", tags: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      clientId: item.clientId || "",
      projectId: item.projectId || "",
      content: item.content,
      username: item.username || "",
      password: item.password || "",
      url: item.url || "",
      tags: item.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (item: KnowledgeItem) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const now = new Date().toISOString().split("T")[0];

    if (editingItem) {
      updateKnowledgeItem(editingItem.id, {
        title: formData.title,
        category: formData.category,
        clientId: formData.clientId || undefined,
        projectId: formData.projectId || undefined,
        content: formData.content,
        username: formData.username || undefined,
        password: formData.password || undefined,
        url: formData.url || undefined,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        updatedAt: now,
      });
      toast.success("Item atualizado com sucesso!");
    } else {
      addKnowledgeItem({
        clientId: formData.clientId || undefined,
        projectId: formData.projectId || undefined,
        title: formData.title,
        category: formData.category,
        content: formData.content,
        username: formData.username || undefined,
        password: formData.password || undefined,
        url: formData.url || undefined,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        createdAt: now,
        updatedAt: now,
      });
      toast.success("Item adicionado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingItemId) {
      deleteKnowledgeItem(deletingItemId);
      toast.success("Item removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingItemId(null);
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return "Interno";
    const client = getClient(clientId);
    return client?.company || "Cliente não encontrado";
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name;
  };

  const allTags = Array.from(new Set(knowledgeItems.flatMap(item => item.tags)));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
            <p className="text-muted-foreground mt-1">Senhas, documentos, links e ideias</p>
          </div>
          {activeTab === "base" && (
            <button onClick={openNewDialog} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
              <Plus className="w-4 h-4" />
              Adicionar Item
            </button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="base" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="mt-6 space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div className="flex items-center gap-2">
                <ViewModeToggle modes={["grid", "list"]} currentMode={viewMode} onChange={setViewMode} />
                
                {/* Group by Client Toggle */}
                <button
                  onClick={() => setGroupByClient(!groupByClient)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                    groupByClient
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Por Cliente</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setSelectedTag(null)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", !selectedTag ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
                  Todos
                </button>
                {allTags.slice(0, 6).map((tag) => (
                  <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", selectedTag === tag ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Grouped by Client View */}
            {groupByClient ? (
              <KnowledgeGroupedByClient
                items={filteredItems}
                clients={clients}
                getClient={getClient}
                onView={openViewDialog}
                onEdit={openEditDialog}
                onDelete={(id) => {
                  setDeletingItemId(id);
                  setIsDeleteDialogOpen(true);
                }}
              />
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item, index) => {
                      const CategoryIcon = categoryConfig[item.category].icon;
                      return (
                        <div key={item.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <div className="flex items-start justify-between mb-4">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", categoryConfig[item.category].color)}>
                              <CategoryIcon className="w-5 h-5" />
                            </div>
                            <ActionMenu items={[
                              { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(item) },
                              { label: "Editar", icon: Edit, onClick: () => openEditDialog(item) },
                              { label: "Excluir", icon: Trash2, onClick: () => { setDeletingItemId(item.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                            ]} />
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{getClientName(item.clientId)}</p>
                          {getProjectName(item.projectId) && (
                            <p className="text-xs text-primary mb-3">{getProjectName(item.projectId)}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">{item.updatedAt}</span>
                            <div className="flex items-center gap-1">
                              {item.category === "credencial" && item.password && (
                                <button onClick={() => togglePassword(item.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title={showPasswords[item.id] ? "Ocultar" : "Mostrar"}>
                                  {showPasswords[item.id] ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                                </button>
                              )}
                              {(item.password || item.username || item.url) && (
                                <button onClick={() => copyToClipboard(item.password || item.username || item.url || "")} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Copiar">
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                              {item.category === "link" && item.url && (
                                <button onClick={() => window.open(item.url, "_blank")} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Abrir">
                                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Item</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Tags</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Atualizado</th>
                          <th className="text-right px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredItems.map((item) => {
                          const CategoryIcon = categoryConfig[item.category].icon;
                          return (
                            <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", categoryConfig[item.category].color)}>
                                    <CategoryIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{item.title}</p>
                                    {getProjectName(item.projectId) && (
                                      <p className="text-xs text-primary">{getProjectName(item.projectId)}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", categoryConfig[item.category].color)}>{categoryConfig[item.category].label}</span>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">{getClientName(item.clientId)}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-foreground">{tag}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">{item.updatedAt}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {(item.password || item.username || item.url) && (
                                    <button onClick={() => copyToClipboard(item.password || item.username || item.url || "")} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Copiar">
                                      <Copy className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  )}
                                  <ActionMenu items={[
                                    { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(item) },
                                    { label: "Editar", icon: Edit, onClick: () => openEditDialog(item) },
                                    { label: "Excluir", icon: Trash2, onClick: () => { setDeletingItemId(item.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
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
              </>
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingItem ? "Editar Item" : "Adicionar Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Nome do item" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Tipo</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as KnowledgeItem["category"] })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={formData.clientId || "internal"} onValueChange={(value) => setFormData({ ...formData, clientId: value === "internal" ? "" : value, projectId: "" })}>
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Interno" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="internal">Interno</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            {formData.category === "credencial" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Nome de usuário" className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Senha" className="bg-secondary/50 border-border" />
                </div>
              </>
            )}
            {(formData.category === "link" || formData.category === "credencial") && (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." className="bg-secondary/50 border-border" />
              </div>
            )}
            {formData.category === "documento" && (
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Descrição ou conteúdo do documento" className="bg-secondary/50 border-border" rows={4} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="servidor, produção, aws" className="bg-secondary/50 border-border" />
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
            <DialogTitle className="text-foreground">Detalhes do Item</DialogTitle>
          </DialogHeader>
          {viewingItem && (() => {
            const ViewIcon = categoryConfig[viewingItem.category].icon;
            return (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", categoryConfig[viewingItem.category].color)}>
                    <ViewIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{viewingItem.title}</h3>
                    <p className="text-muted-foreground">{getClientName(viewingItem.clientId)}</p>
                    {getProjectName(viewingItem.projectId) && (
                      <p className="text-sm text-primary">{getProjectName(viewingItem.projectId)}</p>
                    )}
                  </div>
                </div>
                {viewingItem.category === "credencial" && (
                  <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
                    {viewingItem.username && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Usuário:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{viewingItem.username}</span>
                          <button onClick={() => copyToClipboard(viewingItem.username!)} className="p-1 rounded hover:bg-secondary">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    {viewingItem.password && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Senha:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{showPasswords[viewingItem.id] ? viewingItem.password : "••••••••"}</span>
                          <button onClick={() => togglePassword(viewingItem.id)} className="p-1 rounded hover:bg-secondary">
                            {showPasswords[viewingItem.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button onClick={() => copyToClipboard(viewingItem.password!)} className="p-1 rounded hover:bg-secondary">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    {viewingItem.url && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">URL:</span>
                        <a href={viewingItem.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          Abrir <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {viewingItem.category === "link" && viewingItem.url && (
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <a href={viewingItem.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                      {viewingItem.url} <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {viewingItem.content && (
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-sm">{viewingItem.content}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {viewingItem.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-secondary text-sm text-foreground">{tag}</span>
                  ))}
                </div>
                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                  <p>Criado em: {viewingItem.createdAt}</p>
                  <p>Atualizado em: {viewingItem.updatedAt}</p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Fechar</button>
            <button onClick={() => { setIsViewDialogOpen(false); viewingItem && openEditDialog(viewingItem); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Editar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Item"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
