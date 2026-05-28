import { useState, useMemo } from "react";
import { Plus, Link2, Edit2, Trash2, Copy, ExternalLink } from "lucide-react";
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
  url: string;
  clientId: string;
  projectId: string;
  content: string;
  tags: string;
};

const EMPTY_FORM: FormData = {
  title: "",
  url: "",
  clientId: "",
  projectId: "",
  content: "",
  tags: "",
};

export function ConhecimentoLinks() {
  const { isAdmin } = usePermissions();
  const { data: knowledgeData } = useKnowledgeItems({ category: "link", pageSize: 500 });
  const items = knowledgeData?.items ?? [];
  const { addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, isAdding, isUpdating } =
    useKnowledgeMutations();
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeItem | null>(null);
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
      url: item.url ?? "",
      clientId: item.clientId ?? "",
      projectId: item.projectIds?.[0] ?? "",
      content: item.content ?? "",
      tags: item.tags.join(", "),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    if (!formData.url.trim()) {
      toast.error("Preencha a URL");
      return;
    }
    if (!formData.clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (editingItem) {
      updateKnowledgeItem(editingItem.id, {
        title: formData.title,
        url: formData.url,
        clientId: formData.clientId,
        projectIds: formData.projectId ? [formData.projectId] : [],
        content: formData.content,
        tags,
      });
    } else {
      await addKnowledgeItem({
        title: formData.title,
        category: "link",
        url: formData.url,
        clientId: formData.clientId,
        projectIds: formData.projectId ? [formData.projectId] : [],
        content: formData.content,
        tags,
        createdAt: "",
        updatedAt: "",
      });
    }
    setDialogOpen(false);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const openUrl = (url: string) => {
    window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
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
              Novo Link
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum link cadastrado</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500/10">
              <Link2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs text-primary flex-shrink-0">
                  {getClientName(item.clientId)}
                </Badge>
                {item.url && (
                  <button
                    onClick={() => openUrl(item.url!)}
                    className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                  >
                    {item.url}
                  </button>
                )}
              </div>
              {item.content && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.content}</p>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.url && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Copiar URL"
                    onClick={() => handleCopyUrl(item.url!)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Abrir em nova aba"
                    onClick={() => openUrl(item.url!)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Link" : "Novo Link"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Atualize os dados do link." : "Adicione um novo link importante."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Portal do Cliente"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL *</Label>
              <Input
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
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
              <Label>Descrição</Label>
              <Textarea
                placeholder="Para que serve este link..."
                rows={3}
                value={formData.content}
                onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                placeholder="portal, acesso, cliente"
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
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir link"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) deleteKnowledgeItem(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
