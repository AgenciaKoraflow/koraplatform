import { useState, useCallback } from "react";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KnowledgeItem } from "@/types/data";
import { toast } from "sonner";
import type { EditorMetadata } from "./KnowledgeDocEditor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Client = { id: string; company: string };
type Project = { id: string; name: string; clientId: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SheetData = Record<string, any>;

export type SpreadsheetData = {
  version: "1";
  sheets: SheetData[];
};

interface KnowledgeSpreadsheetEditorProps {
  item: KnowledgeItem | null;
  initialData: SpreadsheetData;
  metadata: EditorMetadata;
  clients: Client[];
  projects: Project[];
  onBack: () => void;
  onSaved?: () => void;
  onAdd: (payload: AddPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdatePayload, oldStoragePath?: string) => void;
}

type AddPayload = {
  title: string;
  category: "documento";
  clientId: string;
  projectIds: string[];
  content: string;
  tags: string[];
  docType: string;
  createdAt: string;
  updatedAt: string;
};

type UpdatePayload = {
  title: string;
  clientId: string;
  projectIds: string[];
  content: string;
  tags: string[];
  docType: string;
};

// ---------------------------------------------------------------------------
// Default empty spreadsheet
// ---------------------------------------------------------------------------

export function emptySpreadsheetData(): SpreadsheetData {
  return {
    version: "1",
    sheets: [
      {
        name: "Planilha1",
        id: "sheet1",
        status: 1,
        order: 0,
        celldata: [],
        config: {},
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// KnowledgeSpreadsheetEditor
// ---------------------------------------------------------------------------

export function KnowledgeSpreadsheetEditor({
  item,
  initialData,
  metadata,
  clients,
  projects,
  onBack,
  onSaved,
  onAdd,
  onUpdate,
}: KnowledgeSpreadsheetEditorProps) {
  const [localTitle, setLocalTitle] = useState(metadata.title);
  const [localClientId, setLocalClientId] = useState(metadata.clientId);
  const [localProjectId, setLocalProjectId] = useState(metadata.projectId);
  const [localTags, setLocalTags] = useState(metadata.tags);
  const [sheets, setSheets] = useState<SheetData[]>(initialData.sheets);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const availableProjects = localClientId
    ? projects.filter((p) => p.clientId === localClientId)
    : [];

  const handleSave = useCallback(async () => {
    if (!localTitle.trim()) { toast.error("Informe um título"); return; }
    if (!localClientId) { toast.error("Selecione um cliente"); return; }
    setIsSaving(true);
    try {
      const content = JSON.stringify({ version: "1", sheets } satisfies SpreadsheetData);
      const tags = localTags.split(",").map((t) => t.trim()).filter(Boolean);
      if (item) {
        onUpdate(item.id, {
          title: localTitle,
          clientId: localClientId,
          projectIds: localProjectId ? [localProjectId] : [],
          content,
          tags,
          docType: "Planilha",
        });
      } else {
        await onAdd({
          title: localTitle,
          category: "documento",
          clientId: localClientId,
          projectIds: localProjectId ? [localProjectId] : [],
          content,
          tags,
          docType: "Planilha",
          createdAt: "",
          updatedAt: "",
        });
      }
      setHasChanges(false);
      toast.success("Planilha salva!");
      onSaved?.();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }, [localTitle, localClientId, localProjectId, localTags, sheets, item, onAdd, onUpdate, onSaved]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-muted transition-colors flex-shrink-0"
          title="Voltar"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <Input
          value={localTitle}
          onChange={(e) => { setLocalTitle(e.target.value); setHasChanges(true); }}
          placeholder="Título da planilha"
          className="max-w-xs font-semibold text-sm h-8"
          aria-label="Título"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={localClientId || "__none__"}
            onValueChange={(v) => {
              setLocalClientId(v === "__none__" ? "" : v);
              setLocalProjectId("");
              setHasChanges(true);
            }}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Cliente *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Selecione um cliente</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {availableProjects.length > 0 && (
            <Select
              value={localProjectId || "none"}
              onValueChange={(v) => { setLocalProjectId(v === "none" ? "" : v); setHasChanges(true); }}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {availableProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Tags:</Label>
            <Input
              value={localTags}
              onChange={(e) => { setLocalTags(e.target.value); setHasChanges(true); }}
              placeholder="tag1, tag2"
              className="h-8 w-36 text-xs"
            />
          </div>
        </div>

        <div className="flex-1" />

        {hasChanges && (
          <span className="text-xs text-amber-500 font-medium flex-shrink-0">
            Alterações não salvas
          </span>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving || !localTitle.trim()}
          size="sm"
          className="gap-2 flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-hidden">
        <Workbook
          data={sheets}
          onChange={(data) => {
            setSheets(data);
            setHasChanges(true);
          }}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}
