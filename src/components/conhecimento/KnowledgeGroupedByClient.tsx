import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Key, FileText, Link2, Copy, ExternalLink, Edit, Trash2, Eye, Building2 } from "lucide-react";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { KnowledgeItem, Client } from "@/types/data";
import { toast } from "sonner";

const categoryConfig = {
  credencial: { label: "Credencial", color: "bg-amber-500/10 text-amber-500", icon: Key },
  documento: { label: "Documento", color: "bg-primary/10 text-primary", icon: FileText },
  link: { label: "Link", color: "bg-green-500/10 text-green-500", icon: Link2 },
};

interface KnowledgeGroupedByClientProps {
  items: KnowledgeItem[];
  clients: Client[];
  getClient: (id: string) => Client | undefined;
  onView: (item: KnowledgeItem) => void;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: string) => void;
  getPassword: (id: string) => Promise<string | null>;
}

export function KnowledgeGroupedByClient({
  items,
  clients,
  getClient,
  onView,
  onEdit,
  onDelete,
  getPassword,
}: KnowledgeGroupedByClientProps) {
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [cachedPasswords, setCachedPasswords] = useState<Record<string, string>>({});

  // Group items by client
  const groupedItems = items.reduce<Record<string, KnowledgeItem[]>>((acc, item) => {
    const key = item.clientId ?? "internal";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Sort clients: internal first, then by client name
  const sortedClientIds = Object.keys(groupedItems).sort((a, b) => {
    if (a === "internal") return -1;
    if (b === "internal") return 1;
    const clientA = getClient(a);
    const clientB = getClient(b);
    return (clientA?.company ?? "").localeCompare(clientB?.company ?? "");
  });

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  /**
   * Copies the password (fetching it from the edge function if not yet cached),
   * or falls back to username → url.
   */
  const copyCredential = async (item: KnowledgeItem) => {
    if (item.hasPassword) {
      const pw = cachedPasswords[item.id] ?? await getPassword(item.id);
      if (pw) {
        if (!cachedPasswords[item.id]) {
          setCachedPasswords(prev => ({ ...prev, [item.id]: pw }));
        }
        navigator.clipboard.writeText(pw);
        toast.success("Copiado para a área de transferência!");
        return;
      }
    }
    const fallback = item.username ?? item.url;
    if (fallback) {
      navigator.clipboard.writeText(fallback);
      toast.success("Copiado para a área de transferência!");
    }
  };

  const getClientName = (clientId: string) => {
    if (clientId === "internal") return "Interno (Agência)";
    const client = getClient(clientId);
    return client?.company ?? "Cliente não encontrado";
  };

  return (
    <div className="space-y-3">
      {sortedClientIds.map((clientId) => {
        const clientItems = groupedItems[clientId];
        const isExpanded = expandedClients[clientId] !== false; // Default to expanded

        return (
          <div
            key={clientId}
            className="bg-card rounded-xl border border-border shadow-soft overflow-hidden"
          >
            {/* Client Header */}
            <button
              onClick={() => toggleClient(clientId)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                clientId === "internal"
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/10 text-accent"
              )}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{getClientName(clientId)}</h3>
                <p className="text-sm text-muted-foreground">
                  {clientItems.length} {clientItems.length === 1 ? "item" : "itens"}
                </p>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Items */}
            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {clientItems.map((item) => {
                  const CategoryIcon = categoryConfig[item.category].icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                        categoryConfig[item.category].color
                      )}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            categoryConfig[item.category].color
                          )}>
                            {categoryConfig[item.category].label}
                          </span>
                          {item.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(item.hasPassword || item.username || item.url) && (
                          <button
                            onClick={() => copyCredential(item)}
                            className="p-2 rounded-xl hover:bg-muted transition-colors"
                            title="Copiar credencial"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        {item.category === "link" && item.url && (
                          <button
                            onClick={() => window.open(item.url, "_blank")}
                            className="p-2 rounded-xl hover:bg-muted transition-colors"
                            title="Abrir"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        <ActionMenu
                          items={[
                            { label: "Visualizar", icon: Eye, onClick: () => onView(item) },
                            { label: "Editar", icon: Edit, onClick: () => onEdit(item) },
                            { label: "Excluir", icon: Trash2, onClick: () => onDelete(item.id), variant: "destructive" },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {sortedClientIds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum item encontrado
        </div>
      )}
    </div>
  );
}
