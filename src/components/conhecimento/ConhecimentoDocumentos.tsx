import { useRef, useState, useMemo } from "react";
import {
  Plus, FileText, Edit2, Trash2, Paperclip, X,
  Download, Link2, ExternalLink, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { detectDocType } from "@/hooks/mutations/useInternalDocumentMutations";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeItem } from "@/types/data";
import { toast } from "sonner";
import { KnowledgeDocEditor, EditorMetadata } from "./KnowledgeDocEditor";
import { KnowledgeSpreadsheetEditor, emptySpreadsheetData, SpreadsheetData } from "./KnowledgeSpreadsheetEditor";

const BUCKET = "client-documents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentMode = "file" | "doc" | "spreadsheet" | "link";

type FormData = {
  title: string;
  clientId: string;
  projectId: string;
  category: string;
  tags: string;
  contentMode: ContentMode;
  url: string;
  file: File | null;
};

const EMPTY_FORM: FormData = {
  title: "",
  clientId: "",
  projectId: "",
  category: "",
  tags: "",
  contentMode: "doc",
  url: "",
  file: null,
};

type DocumentView =
  | { mode: "list" }
  | { mode: "doc-editor"; item: KnowledgeItem | null; initialContent: string; metadata: EditorMetadata }
  | { mode: "spreadsheet-editor"; item: KnowledgeItem | null; initialData: SpreadsheetData; metadata: EditorMetadata };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSpreadsheetContent(content: string | undefined): boolean {
  if (!content?.trimStart().startsWith("{")) return false;
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed?.sheets);
  } catch {
    return false;
  }
}

function buildMetadata(item: KnowledgeItem): EditorMetadata {
  return {
    title: item.title,
    clientId: item.clientId ?? "",
    projectId: item.projectIds?.[0] ?? "",
    category: "",
    tags: item.tags.join(", "),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ConhecimentoDocumentosProps {
  onSaved?: () => void;
}

export function ConhecimentoDocumentos({ onSaved }: ConhecimentoDocumentosProps) {
  const { isAdmin } = usePermissions();
  const { data: knowledgeData } = useKnowledgeItems({ category: "documento", pageSize: 500 });
  const items = knowledgeData?.items ?? [];
  const { addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, isAdding, isUpdating } =
    useKnowledgeMutations();
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<DocumentView>({ mode: "list" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFileItem, setEditingFileItem] = useState<KnowledgeItem | null>(null);
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

  // Open the "new document" dialog
  const openAdd = () => {
    setEditingFileItem(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  // Open edit — routes to editor or file/link dialog based on content type
  const openEdit = (item: KnowledgeItem) => {
    const meta = buildMetadata(item);
    if (item.storagePath) {
      // File-based: use dialog
      setEditingFileItem(item);
      setFormData({
        title: item.title,
        clientId: item.clientId ?? "",
        projectId: item.projectIds?.[0] ?? "",
        category: "",
        tags: item.tags.join(", "),
        contentMode: "file",
        url: "",
        file: null,
      });
      setDialogOpen(true);
      return;
    }
    if (item.url && !item.content) {
      // Link-based: use dialog
      setEditingFileItem(item);
      setFormData({
        title: item.title,
        clientId: item.clientId ?? "",
        projectId: item.projectIds?.[0] ?? "",
        category: "",
        tags: item.tags.join(", "),
        contentMode: "link",
        url: item.url ?? "",
        file: null,
      });
      setDialogOpen(true);
      return;
    }
    if (isSpreadsheetContent(item.content)) {
      let initialData: SpreadsheetData;
      try {
        initialData = JSON.parse(item.content) as SpreadsheetData;
      } catch {
        initialData = emptySpreadsheetData();
      }
      setView({ mode: "spreadsheet-editor", item, initialData, metadata: meta });
      return;
    }
    // Rich text doc
    setView({ mode: "doc-editor", item, initialContent: item.content ?? "", metadata: meta });
  };

  // Dialog confirm: for file/link modes
  const handleDialogSubmit = async () => {
    const { title, clientId, projectId, contentMode, url, tags: tagsRaw, file } = formData;
    if (!title.trim()) return;
    if (!clientId) { toast.error("Selecione um cliente"); return; }

    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const isFile = contentMode === "file";
    const isLink = contentMode === "link";

    if (contentMode === "doc") {
      // Transition to doc editor
      setDialogOpen(false);
      setView({
        mode: "doc-editor",
        item: null,
        initialContent: "<p></p>",
        metadata: { title, clientId, projectId, category: formData.category, tags: tagsRaw },
      });
      return;
    }

    if (contentMode === "spreadsheet") {
      // Transition to spreadsheet editor
      setDialogOpen(false);
      setView({
        mode: "spreadsheet-editor",
        item: null,
        initialData: emptySpreadsheetData(),
        metadata: { title, clientId, projectId, category: formData.category, tags: tagsRaw },
      });
      return;
    }

    // File or Link: save directly
    const editingItem = editingFileItem;
    const hasNewFile = !!file;
    const removingExistingFile = editingItem?.storagePath && !hasNewFile && !isFile;

    if (editingItem) {
      updateKnowledgeItem(
        editingItem.id,
        {
          title,
          clientId,
          projectIds: projectId ? [projectId] : [],
          content: "",
          url: isLink ? url || undefined : undefined,
          tags,
          file: hasNewFile ? file! : undefined,
          removeFile: removingExistingFile ? true : undefined,
        },
        editingItem.storagePath,
      );
    } else {
      await addKnowledgeItem({
        title,
        category: "documento",
        clientId,
        projectIds: projectId ? [projectId] : [],
        content: "",
        url: isLink ? url || undefined : undefined,
        tags,
        file: file ?? undefined,
        createdAt: "",
        updatedAt: "",
      });
    }
    setDialogOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setFormData((p) => ({ ...p, file, contentMode: "file" }));
    e.target.value = "";
  };

  const clearFile = () => setFormData((p) => ({ ...p, file: null, contentMode: "doc" }));

  const handleDownload = async (item: KnowledgeItem) => {
    if (!item.storagePath) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(item.storagePath, 300);
    if (error || !data?.signedUrl) { toast.error("Não foi possível gerar o link de download"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const existingFileName = editingFileItem?.fileName;
  const existingFileSize = editingFileItem?.fileSize;
  const existingStoragePath = editingFileItem?.storagePath;

  // Wrappers for editor save callbacks
  const handleEditorAdd = async (payload: Parameters<typeof addKnowledgeItem>[0]) => {
    await addKnowledgeItem(payload);
  };
  const handleEditorUpdate = (
    id: string,
    payload: Parameters<typeof updateKnowledgeItem>[0],
    oldPath?: string,
  ) => {
    updateKnowledgeItem(id, payload, oldPath);
  };
  const handleEditorSaved = () => {
    setView({ mode: "list" });
    onSaved?.();
  };

  // ---------------------------------------------------------------------------
  // Render editor modes
  // ---------------------------------------------------------------------------

  if (view.mode === "doc-editor") {
    return (
      <KnowledgeDocEditor
        item={view.item}
        initialContent={view.initialContent}
        metadata={view.metadata}
        clients={clients.map((c) => ({ id: c.id, company: c.company }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId ?? "" }))}
        onBack={() => setView({ mode: "list" })}
        onSaved={handleEditorSaved}
        onAdd={handleEditorAdd}
        onUpdate={handleEditorUpdate}
      />
    );
  }

  if (view.mode === "spreadsheet-editor") {
    return (
      <KnowledgeSpreadsheetEditor
        item={view.item}
        initialData={view.initialData}
        metadata={view.metadata}
        clients={clients.map((c) => ({ id: c.id, company: c.company }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId ?? "" }))}
        onBack={() => setView({ mode: "list" })}
        onSaved={handleEditorSaved}
        onAdd={handleEditorAdd}
        onUpdate={handleEditorUpdate}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // List view
  // ---------------------------------------------------------------------------

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
              <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
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
        {filtered.map((item) => {
          const isSheet = isSpreadsheetContent(item.content);
          return (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                {item.storagePath ? (
                  <Paperclip className="w-4 h-4 text-primary" />
                ) : item.url ? (
                  <Link2 className="w-4 h-4 text-primary" />
                ) : isSheet ? (
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{item.title}</p>
                  <Badge variant="secondary" className="text-xs text-primary">
                    {getClientName(item.clientId)}
                  </Badge>
                  {isSheet && (
                    <Badge variant="outline" className="text-xs">Planilha</Badge>
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
                ) : item.content && !isSheet ? (
                  <p
                    className="text-xs text-muted-foreground mt-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                ) : null}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.storagePath && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download" onClick={() => handleDownload(item)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                )}
                {item.url && !item.storagePath && (
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7" title="Abrir link"
                    onClick={() => window.open(item.url!.startsWith("http") ? item.url! : `https://${item.url}`, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
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

      {/* New / Edit dialog (file and link modes) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFileItem ? "Editar Documento" : "Novo Documento"}</DialogTitle>
            <DialogDescription>
              {editingFileItem
                ? "Atualize os dados do documento."
                : "Preencha o título, cliente e escolha o tipo de conteúdo."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Proposta de Serviço"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Client */}
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
                    <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
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
                      <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Content type */}
            {!editingFileItem && (
              <div className="space-y-1.5">
                <Label>Tipo de conteúdo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, contentMode: "doc", file: null }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors text-sm font-medium ${
                      formData.contentMode === "doc"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    Documento
                    <span className="text-xs font-normal opacity-70">Editor rich text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, contentMode: "spreadsheet", file: null }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors text-sm font-medium ${
                      formData.contentMode === "spreadsheet"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Planilha
                    <span className="text-xs font-normal opacity-70">Com fórmulas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, contentMode: "file" }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors text-sm font-medium ${
                      formData.contentMode === "file"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <Paperclip className="w-5 h-5" />
                    Arquivo
                    <span className="text-xs font-normal opacity-70">Upload de ficheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, contentMode: "link", file: null }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors text-sm font-medium ${
                      formData.contentMode === "link"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <Link2 className="w-5 h-5" />
                    Link
                    <span className="text-xs font-normal opacity-70">URL externa</span>
                  </button>
                </div>
              </div>
            )}

            {/* File upload (only in file mode) */}
            {formData.contentMode === "file" && (
              <div className="space-y-1.5">
                <Label>Arquivo</Label>
                {formData.file ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate">{formData.file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(formData.file.size)}</span>
                    <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : existingStoragePath && !formData.file ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate text-muted-foreground">{existingFileName ?? "Arquivo existente"}</span>
                    {existingFileSize && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(existingFileSize)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, contentMode: "doc" }))}
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
              </div>
            )}

            {/* Link URL */}
            {formData.contentMode === "link" && (
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                />
              </div>
            )}

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                placeholder="contrato, proposta"
                value={formData.tags}
                onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={!formData.title.trim() || isAdding || isUpdating}
            >
              {formData.contentMode === "doc" || formData.contentMode === "spreadsheet"
                ? "Abrir Editor"
                : editingFileItem
                  ? "Salvar"
                  : "Adicionar"}
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
          if (deleteTarget) deleteKnowledgeItem(deleteTarget.id, deleteTarget.storagePath);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
