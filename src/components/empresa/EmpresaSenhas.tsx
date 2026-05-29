import { useState } from "react";
import { Plus, Key, Eye, EyeOff, Copy, Link2, FileText, Edit2, Trash2 } from "lucide-react";
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
import { useInternalCredentials } from "@/hooks/useInternalCredentials";
import { useInternalCredentialMutations } from "@/hooks/mutations/useInternalCredentialMutations";
import { usePermissions } from "@/hooks/usePermissions";
import type { InternalCredential } from "@/types/data";
import { toast } from "sonner";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  credencial: { label: "Credencial", color: "bg-amber-500/10 text-amber-500", icon: Key },
  link: { label: "Link", color: "bg-green-500/10 text-green-500", icon: Link2 },
  documento: { label: "Documento", color: "bg-primary/10 text-primary", icon: FileText },
};

type FormData = {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
};

const EMPTY_FORM: FormData = { title: "", username: "", password: "", url: "", notes: "", category: "credencial" };

interface Props {
  workspaceId: string;
}

export function EmpresaSenhas({ workspaceId }: Props) {
  const { isAdmin } = usePermissions();
  const { data: credentials = [], isLoading } = useInternalCredentials(workspaceId);
  const { addCredential, updateCredential, deleteCredential, getCredentialPassword, isAdding, isUpdating } =
    useInternalCredentialMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InternalCredential | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);

  const openAdd = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: InternalCredential) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      username: item.username ?? "",
      password: "",
      url: item.url ?? "",
      notes: item.notes ?? "",
      category: item.category ?? "credencial",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    if (editingItem) {
      const data: Partial<InternalCredential> & { password?: string } = {
        title: formData.title,
        username: formData.username || undefined,
        url: formData.url || undefined,
        notes: formData.notes || undefined,
        category: formData.category || undefined,
      };
      if (formData.password) data.password = formData.password;
      updateCredential(editingItem.id, data);
    } else {
      await addCredential({
        workspaceId,
        title: formData.title,
        username: formData.username || undefined,
        url: formData.url || undefined,
        notes: formData.notes || undefined,
        category: formData.category || undefined,
        password: formData.password || undefined,
        tags: [],
        createdAt: "",
        updatedAt: "",
      });
    }
    setDialogOpen(false);
  };

  const handleRevealPassword = async (item: InternalCredential) => {
    if (revealedPasswords[item.id]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }
    setRevealingId(item.id);
    const pw = await getCredentialPassword(item.id);
    setRevealingId(null);
    if (pw) setRevealedPasswords((prev) => ({ ...prev, [item.id]: pw }));
  };

  const handleCopy = async (item: InternalCredential) => {
    const pw = revealedPasswords[item.id] ?? (item.hasPassword ? await getCredentialPassword(item.id) : null);
    const value = pw ?? item.username ?? item.url;
    if (value) {
      navigator.clipboard.writeText(value);
      toast.success("Copiado!");
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Carregando...</div>;
  }

  const categoryConfig = (cat?: string) => CATEGORY_CONFIG[cat ?? "credencial"] ?? CATEGORY_CONFIG["credencial"];

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Credencial
          </Button>
        </div>
      )}

      {credentials.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhuma credencial cadastrada</p>
        </div>
      )}

      <div className="space-y-2">
        {credentials.map((item) => {
          const cfg = categoryConfig(item.category);
          const CatIcon = cfg.icon;
          const isRevealed = !!revealedPasswords[item.id];
          const isRevealing = revealingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <CatIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.username && <span className="truncate">{item.username}</span>}
                  {item.url && (
                    <a
                      href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary truncate"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
                {isRevealed && (
                  <p className="text-xs font-mono text-amber-500 mt-1">{revealedPasswords[item.id]}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant="outline" className={`text-xs ${cfg.color} border-0`}>
                  {cfg.label}
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
                      onClick={() => setDeleteId(item.id)}
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
              {editingItem ? "Atualize os dados da credencial." : "Adicione uma nova credencial interna."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Google Workspace Admin"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credencial">Credencial</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
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
          if (deleteId) deleteCredential(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
