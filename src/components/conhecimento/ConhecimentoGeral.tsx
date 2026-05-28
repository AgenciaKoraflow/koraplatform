import { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeGroupedByClient } from "./KnowledgeGroupedByClient";
import { useAllKnowledgeItems } from "@/hooks/useKnowledgeItems";
import { useAllClients } from "@/hooks/useClients";
import { useKnowledgeMutations } from "@/hooks/mutations/useKnowledgeMutations";
import { useDebounce } from "@/hooks/useDebounce";
import { KnowledgeItem } from "@/types/data";
import { cn } from "@/lib/utils";
import { Key, FileText, Link2, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const categoryConfig = {
  credencial: { label: "Credencial", color: "bg-amber-500/10 text-amber-500", icon: Key },
  documento: { label: "Documento", color: "bg-primary/10 text-primary", icon: FileText },
  link: { label: "Link", color: "bg-green-500/10 text-green-500", icon: Link2 },
};

export function ConhecimentoGeral() {
  const { data: allData } = useAllKnowledgeItems();
  const allItems = allData?.items ?? [];
  const { data: clients = [] } = useAllClients();
  const { getKnowledgePassword } = useKnowledgeMutations();

  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  const getClient = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedClientId !== "all") {
      items = items.filter((i) => i.clientId === selectedClientId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [allItems, selectedClientId, searchQuery]);

  const togglePassword = useCallback(
    async (id: string) => {
      if (showPasswords[id]) {
        setShowPasswords((prev) => ({ ...prev, [id]: false }));
        return;
      }
      if (!revealedPasswords[id]) {
        const pw = await getKnowledgePassword(id);
        if (!pw) return;
        setRevealedPasswords((prev) => ({ ...prev, [id]: pw }));
      }
      setShowPasswords((prev) => ({ ...prev, [id]: true }));
    },
    [showPasswords, revealedPasswords, getKnowledgePassword],
  );

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  }, []);

  const copyCredential = useCallback(
    async (item: KnowledgeItem) => {
      if (item.hasPassword) {
        const pw = revealedPasswords[item.id] ?? (await getKnowledgePassword(item.id));
        if (pw) {
          if (!revealedPasswords[item.id]) setRevealedPasswords((prev) => ({ ...prev, [item.id]: pw }));
          copyToClipboard(pw);
          return;
        }
      }
      if (item.username) { copyToClipboard(item.username); return; }
      if (item.url) copyToClipboard(item.url);
    },
    [revealedPasswords, getKnowledgePassword, copyToClipboard],
  );

  const getClientName = useCallback(
    (clientId?: string) => {
      if (!clientId) return "Sem cliente";
      return clients.find((c) => c.id === clientId)?.company ?? "Cliente não encontrado";
    },
    [clients],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <KnowledgeGroupedByClient
        items={filteredItems}
        clients={clients}
        getClient={getClient}
        onView={(item) => setViewingItem(item)}
        onEdit={() => {}}
        onDelete={() => {}}
        getPassword={getKnowledgePassword}
      />

      {/* View Dialog (read-only) */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Item</DialogTitle>
          </DialogHeader>
          {viewingItem && (() => {
            const ViewIcon = categoryConfig[viewingItem.category].icon;
            return (
              <DialogBody className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", categoryConfig[viewingItem.category].color)}>
                    <ViewIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{viewingItem.title}</h3>
                    <p className="text-muted-foreground">{getClientName(viewingItem.clientId)}</p>
                  </div>
                </div>
                {viewingItem.category === "credencial" && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                    {viewingItem.username && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Usuário:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{viewingItem.username}</span>
                          <button onClick={() => copyToClipboard(viewingItem.username!)} className="p-1 rounded hover:bg-muted">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    {viewingItem.hasPassword && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Senha:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {showPasswords[viewingItem.id] ? (revealedPasswords[viewingItem.id] ?? "••••••••") : "••••••••"}
                          </span>
                          <button onClick={() => togglePassword(viewingItem.id)} className="p-1 rounded hover:bg-muted">
                            {showPasswords[viewingItem.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button onClick={() => copyCredential(viewingItem)} className="p-1 rounded hover:bg-muted">
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
                  <div className="p-4 rounded-lg bg-muted/30">
                    <a href={viewingItem.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                      {viewingItem.url} <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {viewingItem.content && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm">{viewingItem.content}</p>
                  </div>
                )}
                {viewingItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewingItem.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-lg bg-muted text-sm text-foreground">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                  <p>Atualizado em: {viewingItem.updatedAt}</p>
                </div>
              </DialogBody>
            );
          })()}
          <DialogFooter>
            <button onClick={() => setViewingItem(null)} className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
