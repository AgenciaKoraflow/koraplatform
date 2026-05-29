import { useState, useMemo } from "react";
import { Plus, Key, Eye, EyeOff, Copy, Link2, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useKnowledgeItems } from "@/hooks/useKnowledgeItems";
import { useKnowledgeMutations } from "@/hooks/mutations/useKnowledgeMutations";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
import { KnowledgeItem } from "@/types/data";
import { toast } from "sonner";

type FormData = {
  title: string;
  clientId: string;
  projectId: string;
  username: string;
  password: string;
  url: string;
  content: string;
  tags: string;
};

const EMPTY_FORM: FormData = {
  title: "",
  clientId: "",
  projectId: "",
  username: "",
  password: "",
  url: "",
  content: "",
  tags: "",
};

export function ConhecimentoSenhas() {
  const { isAdmin } = usePermissions();
  const { data: knowledgeData } = useKnowledgeItems({ category: "credencial", pageSize: 500 });
  const items = knowledgeData?.items ?? [];
  const { addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getKnowledgePassword, isAdding, isUpdating } =
    useKnowledgeMutations();
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStoragePath, setDeleteStoragePath] = useState<string | undefined>(undefined);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>("all");

  const availableProjects = useMemo(
    () => (formData.clientId ? projects.filter((p) => p.clientId === formData.clientId) : []),
    [formData.clientId, projects],
  );

  const filtered = useMemo(
    () => (clientFilter === "all" ? items : items.filter((i) => i.clientId === clientFilter)),
    [items, clientFilter],
  );

  const getClientName = (clientId?: string) => {
    if (!clientId) return "Sem cliente";
    return clients.find((c) => c.id === clientId)?.company ?? "Cliente não encontrado";
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      clientId: item.clientId ?? "",
      projectId: item.projectIds?.[0] ?? "",
      username: item.username ?? "",
      password: "",
      url: item.url ?? "",
      content: item.content ?? "",
      tags: item.tags.join(", "),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    if (!formData.clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (editingItem) {
      updateKnowledgeItem(editingItem.id, {
        title: formData.title,
        clientId: formData.clientId,
        projectIds: formData.projectId ? [formData.projectId] : [],
        username: formData.username || undefined,
        password: formData.password || undefined,
        url: formData.url || undefined,
        content: formData.content || "",
        tags,
      });
    } else {
      await addKnowledgeItem({
        title: formData.title,
        category: "credencial",
        clientId: formData.clientId,
        projectIds: formData.projectId ? [formData.projectId] : [],
        username: formData.username || undefined,
        password: formData.password || undefined,
        url: formData.url || undefined,
        content: formData.content || "",
        tags,
        createdAt: "",
        updatedAt: "",
      });
    }
    setDialogOpen(false);
  };

  const handleRevealPassword = async (item: KnowledgeItem) => {
    if (revealedPasswords[item.id]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }
    setRevealingId(item.id);
    const pw = await getKnowledgePassword(item.id);
    setRevealingId(null);
    if (pw) setRevealedPasswords((prev) => ({ ...prev, [item.id]: pw }));
  };

  const handleCopy = async (item: KnowledgeItem) => {
    const pw = revealedPasswords[item.id] ?? (item.hasPassword ? await getKnowledgePassword(item.id) : null);
    const value = pw ?? item.username ?? item.url;
    if (value) {
      navigator.clipboard.writeText(value);
      toast.success("Copiado!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={clientFilter} onValueChange={setClientFilter}>
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
        {isAdmin && (
          <div className="ml-auto">
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Credencial
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhuma credencial cadastrada</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item) => {
          const isRevealed = !!revealedPasswords[item.id];
          const isRevealing = revealingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/10">
                <Key className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">{getClientName(item.clientId)}</span>
                  {item.username && <span className="truncate">{item.username}</span>}
                  {item.url && (
                    <a
                      href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary truncate flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3" />
                      {item.url}
                    </a>
                  )}
                </div>
                {isRevealed && (
                  <p className="text-xs font-mono text-amber-500 mt-1">{revealedPasswords[item.id]}</p>
                )}
                {item.content && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{item.content}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-0">
                  Credencial
                </Badge>
                {item.hasPassword && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRevealPassword(item)}
                    disabled={isRevealing}
                    title={isRevealed ? "Ocultar senha" : "Revelar senha"}
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopy(item)}
                  title="Copiar"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { setDeleteId(item.id); setDeleteStoragePath(item.storagePath); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Credencial" : "Nova Credencial"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Atualize os dados da credencial." : "Adicione uma nova credencial de cliente."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Portal do Cliente — Acesso Admin"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select
                value={formData.clientId || "__none__"}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, clientId: v === "__none__" ? "" : v, projectId: "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione um cliente</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.clientId && availableProjects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Projeto (opcional)</Label>
                <Select
                  value={formData.projectId || "none"}
                  onValueChange={(v) => setFormData((p) => ({ ...p, projectId: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {availableProjects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        {proj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Usuário / E-mail</Label>
              <Input
                placeholder="usuario@exemplo.com"
                value={formData.username}
                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editingItem ? "Nova senha (deixe em branco para não alterar)" : "Senha"}</Label>
              <div className="relative">
                <Input
                  type={showFormPassword ? "text" : "password"}
                  placeholder={editingItem ? "••••••••" : "Senha"}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Anotações adicionais..."
                rows={3}
                value={formData.content}
                onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                placeholder="servidor, produção, aws"
                value={formData.tags}
                onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim() || isAdding || isUpdating}>
              {editingItem ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir credencial"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) deleteKnowledgeItem(deleteId, deleteStoragePath);
          setDeleteId(null);
          setDeleteStoragePath(undefined);
        }}
      />
    </div>
  );
}
