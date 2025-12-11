import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Folder, FileText, Key, Link2, MoreHorizontal, Eye, EyeOff, Copy, ExternalLink } from "lucide-react";

interface KnowledgeItem {
  id: string;
  title: string;
  type: "credential" | "document" | "link";
  client: string;
  category: string;
  lastUpdated: string;
  description?: string;
}

const items: KnowledgeItem[] = [
  { id: "1", title: "AWS Credentials", type: "credential", client: "TechCorp", category: "Cloud", lastUpdated: "Há 2 dias", description: "Credenciais de acesso à AWS" },
  { id: "2", title: "Documentação API", type: "document", client: "TechCorp", category: "Técnico", lastUpdated: "Há 1 semana", description: "Swagger e guia de integração" },
  { id: "3", title: "Repositório GitHub", type: "link", client: "InnovateLab", category: "Desenvolvimento", lastUpdated: "Hoje", description: "Link do repositório principal" },
  { id: "4", title: "Database Credentials", type: "credential", client: "SmartRetail", category: "Database", lastUpdated: "Há 3 dias", description: "Acesso ao PostgreSQL" },
  { id: "5", title: "Manual de Treinamento", type: "document", client: "DataFlow Inc", category: "Treinamento", lastUpdated: "Há 2 semanas", description: "Guia para equipe do cliente" },
  { id: "6", title: "OpenAI API Key", type: "credential", client: "Interno", category: "IA", lastUpdated: "Há 1 mês", description: "Chave de API compartilhada" },
  { id: "7", title: "Dashboard Staging", type: "link", client: "FinTech Plus", category: "Ambiente", lastUpdated: "Há 5 dias", description: "Link do ambiente de homologação" },
  { id: "8", title: "Proposta Template", type: "document", client: "Interno", category: "Comercial", lastUpdated: "Há 1 semana", description: "Template padrão de propostas" },
];

const typeConfig = {
  credential: { label: "Credencial", color: "bg-amber-500/10 text-amber-500", icon: Key },
  document: { label: "Documento", color: "bg-blue-500/10 text-blue-500", icon: FileText },
  link: { label: "Link", color: "bg-green-500/10 text-green-500", icon: Link2 },
};

const categories = ["Todos", "Cloud", "Técnico", "Desenvolvimento", "Database", "Treinamento", "IA", "Ambiente", "Comercial"];

export default function Conhecimento() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-glow">
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  selectedCategory === category
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => {
            const TypeIcon = typeConfig[item.type].icon;
            
            return (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    typeConfig[item.type].color
                  )}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                    {item.client}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                    {item.category}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{item.lastUpdated}</span>
                  
                  <div className="flex items-center gap-1">
                    {item.type === "credential" && (
                      <button
                        onClick={() => togglePassword(item.id)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title={showPasswords[item.id] ? "Ocultar" : "Mostrar"}
                      >
                        {showPasswords[item.id] ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Copiar">
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {item.type === "link" && (
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Abrir">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
