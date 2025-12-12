import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, FileText, Key, Link2, Eye, EyeOff, Copy, ExternalLink, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { toast } from "sonner";

interface KnowledgeItem {
  id: string;
  title: string;
  type: "credential" | "document" | "link";
  client: string;
  category: string;
  lastUpdated: string;
  description?: string;
  content?: string;
}

const initialItems: KnowledgeItem[] = [
  { id: "1", title: "AWS Credentials", type: "credential", client: "TechCorp", category: "Cloud", lastUpdated: "Há 2 dias", description: "Credenciais de acesso à AWS", content: "AKIAIOSFODNN7EXAMPLE" },
  { id: "2", title: "Documentação API", type: "document", client: "TechCorp", category: "Técnico", lastUpdated: "Há 1 semana", description: "Swagger e guia de integração" },
  { id: "3", title: "Repositório GitHub", type: "link", client: "InnovateLab", category: "Desenvolvimento", lastUpdated: "Hoje", description: "Link do repositório principal", content: "https://github.com/example/repo" },
  { id: "4", title: "Database Credentials", type: "credential", client: "SmartRetail", category: "Database", lastUpdated: "Há 3 dias", description: "Acesso ao PostgreSQL", content: "postgres://user:pass@host:5432/db" },
  { id: "5", title: "Manual de Treinamento", type: "document", client: "DataFlow Inc", category: "Treinamento", lastUpdated: "Há 2 semanas", description: "Guia para equipe do cliente" },
  { id: "6", title: "OpenAI API Key", type: "credential", client: "Interno", category: "IA", lastUpdated: "Há 1 mês", description: "Chave de API compartilhada", content: "sk-xxxxxxxxxxxxxxxxxxxxx" },
  { id: "7", title: "Dashboard Staging", type: "link", client: "FinTech Plus", category: "Ambiente", lastUpdated: "Há 5 dias", description: "Link do ambiente de homologação", content: "https://staging.example.com" },
  { id: "8", title: "Proposta Template", type: "document", client: "Interno", category: "Comercial", lastUpdated: "Há 1 semana", description: "Template padrão de propostas" },
];

const typeConfig = {
  credential: { label: "Credencial", color: "bg-amber-500/10 text-amber-500", icon: Key },
  document: { label: "Documento", color: "bg-blue-500/10 text-blue-500", icon: FileText },
  link: { label: "Link", color: "bg-green-500/10 text-green-500", icon: Link2 },
};

const categories = ["Todos", "Cloud", "Técnico", "Desenvolvimento", "Database", "Treinamento", "IA", "Ambiente", "Comercial"];

export default function Conhecimento() {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "credential" as KnowledgeItem["type"],
    client: "",
    category: "",
    description: "",
    content: "",
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado para a área de transferência!");
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setFormData({ title: "", type: "credential", client: "", category: "", description: "", content: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({ title: item.title, type: item.type, client: item.client, category: item.category, description: item.description || "", content: item.content || "" });
    setIsDialogOpen(true);
  };

  const openViewDialog = (item: KnowledgeItem) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.client || !formData.category) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData, lastUpdated: "Agora" } : i));
      toast.success("Item atualizado com sucesso!");
    } else {
      const newItem: KnowledgeItem = {
        id: Date.now().toString(),
        ...formData,
        lastUpdated: "Agora",
      };
      setItems([...items, newItem]);
      toast.success("Item adicionado com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingItemId) {
      setItems(items.filter(i => i.id !== deletingItemId));
      toast.success("Item removido com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingItemId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
            <p className="text-muted-foreground mt-1">Senhas, documentos e links importantes</p>
          </div>
          <button onClick={openNewDialog} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <ViewModeToggle modes={["grid", "list"]} currentMode={viewMode} onChange={setViewMode} />

          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", selectedCategory === category ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary")}>
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => {
              const TypeIcon = typeConfig[item.type].icon;
              return (
                <div key={item.id} className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeConfig[item.type].color)}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <ActionMenu items={[
                      { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(item) },
                      { label: "Editar", icon: Edit, onClick: () => openEditDialog(item) },
                      { label: "Excluir", icon: Trash2, onClick: () => { setDeletingItemId(item.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                    ]} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{item.client}</span>
                    <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">{item.category}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{item.lastUpdated}</span>
                    <div className="flex items-center gap-1">
                      {item.type === "credential" && (
                        <button onClick={() => togglePassword(item.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title={showPasswords[item.id] ? "Ocultar" : "Mostrar"}>
                          {showPasswords[item.id] ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      )}
                      {item.content && (
                        <button onClick={() => copyToClipboard(item.content!)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Copiar">
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      {item.type === "link" && item.content && (
                        <button onClick={() => window.open(item.content, "_blank")} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Abrir">
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Atualizado</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const TypeIcon = typeConfig[item.type].icon;
                  return (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", typeConfig[item.type].color)}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[item.type].color)}>{typeConfig[item.type].label}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{item.client}</td>
                      <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">{item.lastUpdated}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.content && (
                            <button onClick={() => copyToClipboard(item.content!)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Copiar">
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingItem ? "Editar Item" : "Adicionar Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Nome do item" className="bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as KnowledgeItem["type"] })}>
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
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Input id="client" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="Nome do cliente" className="bg-secondary/50 border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {categories.filter(c => c !== "Todos").map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição do item" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{formData.type === "credential" ? "Senha/Chave" : formData.type === "link" ? "URL" : "Conteúdo"}</Label>
              <Input id="content" type={formData.type === "credential" ? "password" : "text"} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder={formData.type === "credential" ? "Senha ou chave de API" : formData.type === "link" ? "https://..." : "Conteúdo"} className="bg-secondary/50 border-border" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">{editingItem ? "Salvar" : "Adicionar"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Item</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", typeConfig[viewingItem.type].color)}>
                  {(() => { const TypeIcon = typeConfig[viewingItem.type].icon; return <TypeIcon className="w-6 h-6" />; })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewingItem.title}</h3>
                  <p className="text-muted-foreground">{viewingItem.description}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", typeConfig[viewingItem.type].color)}>{typeConfig[viewingItem.type].label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="text-foreground">{viewingItem.client}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{viewingItem.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Atualizado</span><span className="text-foreground">{viewingItem.lastUpdated}</span></div>
                {viewingItem.content && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">{viewingItem.type === "credential" ? "Credencial" : viewingItem.type === "link" ? "URL" : "Conteúdo"}</span>
                      <div className="flex items-center gap-1">
                        {viewingItem.type === "credential" && (
                          <button onClick={() => togglePassword(viewingItem.id)} className="p-1 rounded hover:bg-secondary transition-colors">
                            {showPasswords[viewingItem.id] ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        )}
                        <button onClick={() => copyToClipboard(viewingItem.content!)} className="p-1 rounded hover:bg-secondary transition-colors">
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <code className="block p-2 rounded bg-secondary text-sm text-foreground break-all">
                      {viewingItem.type === "credential" && !showPasswords[viewingItem.id] ? "••••••••••••••" : viewingItem.content}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setIsViewDialogOpen(false); if (viewingItem) openEditDialog(viewingItem); }} className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">Editar</button>
            <button onClick={() => setIsViewDialogOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title="Excluir Item" description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} variant="destructive" />
    </AppLayout>
  );
}
