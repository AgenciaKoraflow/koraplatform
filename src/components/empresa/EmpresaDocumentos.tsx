import { useRef, useState } from "react";
import { Plus, FileText, Edit2, Trash2, Paperclip, X, Download, Link2, ExternalLink } from "lucide-react";
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
import { useInternalDocuments } from "@/hooks/useInternalDocuments";
import { useInternalDocumentMutations, detectDocType } from "@/hooks/mutations/useInternalDocumentMutations";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InternalDocument } from "@/types/data";

const BUCKET = "internal-documents";
const CATEGORIES = ["SOP", "Processo", "Técnico", "Administrativo", "Outro"];
const DOC_TYPES = ["Doc", "PDF", "Texto", "CSV", "Planilha", "Apresentação", "HTML", "Outro"];

type ContentMode = "file" | "text" | "link";

type FormData = {
  title: string;
  docType: string;
  category: string;
  contentMode: ContentMode;
  content: string;
  url: string;
  file: File | null;
};

const EMPTY_FORM: FormData = {
  title: "",
  docType: "",
  category: "",
  contentMode: "text",
  content: "",
  url: "",
  file: null,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  workspaceId: string;
}

export function EmpresaDocumentos({ workspaceId }: Props) {
  const { isAdmin } = usePermissions();
  const { data: documents = [], isLoading } = useInternalDocuments(workspaceId);
  const { addDocument, updateDocument, deleteDocument, isAdding, isUpdating } =
    useInternalDocumentMutations();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InternalDocument | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<InternalDocument | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered =
    categoryFilter === "all" ? documents : documents.filter((d) => d.category === categoryFilter);

  const openAdd = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: InternalDocument) => {
    setEditingItem(item);
    let contentMode: ContentMode = "text";
    if (item.storagePath) contentMode = "file";
    else if (item.url) contentMode = "link";
    setFormData({
      title: item.title,
      docType: item.docType ?? "",
      category: item.category ?? "",
      contentMode,
      content: item.content ?? "",
      url: item.url ?? "",
      file: null,
    });
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setFormData((p) => ({
      ...p,
      file,
      docType: p.docType || detectDocType(file),
      contentMode: "file",
    }));
    e.target.value = "";
  };

  const clearFile = () => {
    setFormData((p) => ({ ...p, file: null, contentMode: "text" }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const isFileMode = formData.contentMode === "file";
    const isLinkMode = formData.contentMode === "link";
    const hasNewFile = !!formData.file;
    const removingExistingFile = editingItem?.storagePath && !hasNewFile && !isFileMode;

    if (editingItem) {
      updateDocument(
        editingItem.id,
        {
          workspaceId,
          title: formData.title,
          content: isFileMode || isLinkMode ? undefined : formData.content || undefined,
          url: isLinkMode ? formData.url || undefined : undefined,
          category: formData.category || undefined,
          docType: formData.docType || undefined,
          file: hasNewFile ? formData.file! : undefined,
          removeFile: removingExistingFile ? true : undefined,
        },
        editingItem.storagePath,
      );
    } else {
      await addDocument({
        workspaceId,
        title: formData.title,
        content: isFileMode || isLinkMode ? undefined : formData.content || undefined,
        url: isLinkMode ? formData.url || undefined : undefined,
        category: formData.category || undefined,
        docType: formData.docType || undefined,
        file: formData.file ?? undefined,
        createdAt: "",
        updatedAt: "",
      });
    }
    setDialogOpen(false);
  };

  const handleDownload = async (doc: InternalDocument) => {
    if (!doc.storagePath) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storagePath, 300);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível gerar o link de download");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Carregando...</div>;
  }

  const existingFileName = editingItem?.fileName;
  const existingFileSize = editingItem?.fileSize;
  const existingStoragePath = editingItem?.storagePath;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <div className="ml-auto">
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Documento
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum documento cadastrado</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-xl border border-border p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
              {item.storagePath ? (
                <Paperclip className="w-4 h-4 text-primary" />
              ) : item.url ? (
                <Link2 className="w-4 h-4 text-primary" />
              ) : (
                <FileText className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{item.title}</p>
                {item.docType && (
                  <Badge variant="secondary" className="text-xs">
                    {item.docType}
                  </Badge>
                )}
                {item.category && (
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                )}
              </div>
              {item.fileName ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.fileName}
                  {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : ""}
                </p>
              ) : item.url ? (
                <a
                  href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline mt-1 flex items-center gap-1 truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.url}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : item.content ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.storagePath && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Download"
                  onClick={() => handleDownload(item)}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              )}
              {item.url && !item.storagePath && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Abrir link"
                  onClick={() => window.open(item.url!.startsWith("http") ? item.url! : `https://${item.url}`, "_blank")}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(item)}
                  >
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
            <DialogTitle>{editingItem ? "Editar Documento" : "Novo Documento"}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize os dados do documento."
                : "Adicione um novo documento interno."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {/* Título */}
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: SOP — Onboarding de Clientes"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Conteúdo: toggle Arquivo / Texto / Link */}
            <div className="space-y-1.5">
              <Label>Conteúdo</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={formData.contentMode === "file" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((p) => ({ ...p, contentMode: "file" }))}
                >
                  <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                  Arquivo
                </Button>
                <Button
                  type="button"
                  variant={formData.contentMode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((p) => ({ ...p, contentMode: "text", file: null }))}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Texto
                </Button>
                <Button
                  type="button"
                  variant={formData.contentMode === "link" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((p) => ({ ...p, contentMode: "link", file: null }))}
                >
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  Link
                </Button>
              </div>

              {formData.contentMode === "file" ? (
                <div>
                  {formData.file ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{formData.file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(formData.file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : existingStoragePath && !formData.file ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate text-muted-foreground">
                        {existingFileName ?? "Arquivo existente"}
                      </span>
                      {existingFileSize && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatFileSize(existingFileSize)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, contentMode: "text" }))
                        }
                        className="text-muted-foreground hover:text-foreground"
                        title="Remover arquivo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors py-6 text-muted-foreground text-sm"
                    >
                      <Paperclip className="w-6 h-6" />
                      <span>Clique para selecionar um arquivo</span>
                      <span className="text-xs">PDF, Word, Excel, PowerPoint, HTML, CSV…</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.html,.htm,.txt"
                    onChange={handleFileChange}
                  />
                  {formData.contentMode === "file" && !formData.file && !existingStoragePath && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                      Selecionar arquivo
                    </Button>
                  )}
                </div>
              ) : formData.contentMode === "link" ? (
                <Input
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                />
              ) : (
                <Textarea
                  placeholder="Escreva o conteúdo do documento..."
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                />
              )}
            </div>

            {/* Tipo de Documento */}
            <div className="space-y-1.5">
              <Label>Tipo de Documento</Label>
              <Select
                value={formData.docType || "none"}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, docType: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem tipo</SelectItem>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={formData.category || "none"}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, category: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isAdding || isUpdating}
            >
              {editingItem ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir documento"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) deleteDocument(deleteTarget.id, deleteTarget.storagePath);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
