import { useRef, useState } from "react";
import { Paperclip, Download, Trash2, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useProjectDocuments } from "@/hooks/useProjectDocuments";
import { useProjectDocumentMutations } from "@/hooks/mutations/useProjectDocumentMutations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProjectDocument, ProjectDocumentType } from "@/types/data";

const BUCKET = "project-documents";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentSectionProps {
  label: string;
  type: ProjectDocumentType;
  doc: ProjectDocument | undefined;
  required?: boolean;
  projectId: string;
  isUploading: boolean;
  isDeleting: boolean;
  onUpload: (type: ProjectDocumentType, file: File, oldStoragePath?: string) => void;
  onDelete: (doc: ProjectDocument) => void;
  onDownload: (doc: ProjectDocument) => void;
}

function DocumentSection({
  label,
  type,
  doc,
  required,
  isUploading,
  isDeleting,
  onUpload,
  onDelete,
  onDownload,
}: DocumentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(type, file, doc?.storagePath);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Badge variant={required ? "default" : "secondary"} className="text-xs">
          {required ? "Obrigatório" : "Opcional"}
        </Badge>
      </div>

      {doc ? (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
            <Paperclip className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.fileName}</p>
            {doc.fileSize != null && (
              <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(doc.fileSize)}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Baixar"
              onClick={() => onDownload(doc)}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Substituir"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            {!required && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                title="Remover"
                disabled={isDeleting}
                onClick={() => setPendingDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors py-8 text-muted-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-5 h-5" />
          <span>{isUploading ? "Enviando…" : "Selecionar PDF"}</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
      />

      <ConfirmDialog
        open={pendingDelete}
        onOpenChange={setPendingDelete}
        title="Remover documento técnico"
        description="Tem certeza que deseja remover o documento técnico? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onConfirm={() => {
          if (doc) onDelete(doc);
          setPendingDelete(false);
        }}
      />
    </div>
  );
}

interface Props {
  projectId: string;
  projectName: string;
}

export function ProjectDocuments({ projectId, projectName }: Props) {
  const { data: docs = [], isLoading } = useProjectDocuments(projectId);
  const { uploadDocument, deleteDocument, isUploading, isDeleting } =
    useProjectDocumentMutations();

  const planejamentoDoc = docs.find((d) => d.type === "planejamento");
  const tecnicoDoc = docs.find((d) => d.type === "tecnico");

  const handleUpload = async (
    type: ProjectDocumentType,
    file: File,
    oldStoragePath?: string
  ) => {
    await uploadDocument({ projectId, type, file, oldStoragePath });
  };

  const handleDelete = (doc: ProjectDocument) => {
    deleteDocument(doc.id, doc.storagePath, projectId);
  };

  const handleDownload = async (doc: ProjectDocument) => {
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
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">Carregando…</div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <p className="text-xs text-muted-foreground mb-4">
          Documentação associada ao projeto <span className="font-medium text-foreground">{projectName}</span>.
          O planejamento é obrigatório; a documentação técnica é opcional.
        </p>
      </div>

      <DocumentSection
        label="Planejamento"
        type="planejamento"
        doc={planejamentoDoc}
        required
        projectId={projectId}
        isUploading={isUploading}
        isDeleting={isDeleting}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />

      <div className="border-t border-border" />

      <DocumentSection
        label="Técnico"
        type="tecnico"
        doc={tecnicoDoc}
        projectId={projectId}
        isUploading={isUploading}
        isDeleting={isDeleting}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
}
