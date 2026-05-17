import { useState, useRef, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Code,
  Quote,
  Undo,
  Redo,
  Save,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InsightsBoard } from "@/types/insights";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Sanitization — strict allowlist, no inline styles, https-only links
// ---------------------------------------------------------------------------

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "p", "h1", "h2", "h3",
    "ul", "ol", "li",
    "b", "strong", "i", "em", "u", "s", "strike",
    "a", "blockquote", "pre", "code",
    "br", "div",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: true,
  // Blocks javascript:, data:, vbscript: and any other non-http(s) URL
  ALLOWED_URI_REGEXP: /^https?:\/\/.+/i,
};

const sanitize = (html: string): string =>
  DOMPurify.sanitize(html, PURIFY_CONFIG) as string;

// Accepts only absolute https:// URLs
const isSafeUrl = (url: string): boolean =>
  /^https?:\/\/.+/i.test(url.trim());

// ---------------------------------------------------------------------------
// Blocked vectors (documented for audit trail)
// ---------------------------------------------------------------------------
// - onerror / onload / on* event handlers  → stripped by DOMPurify
// - style="" inline attributes             → not in ALLOWED_ATTR
// - <svg> injection                        → not in ALLOWED_TAGS
// - <iframe> / <script> / <object>         → not in ALLOWED_TAGS
// - javascript: / data: / vbscript: URLs  → blocked by ALLOWED_URI_REGEXP
// - <img onerror=...>                     → img not in ALLOWED_TAGS
// - ALLOWED_URI_REGEXP enforced on load AND save
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightsDocEditorProps {
  board: InsightsBoard;
  onSave: (content: string) => Promise<void>;
  onBack: () => void;
  onRename: (name: string) => void;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
}

interface EditorToolbarProps {
  onCommand: (cmd: string, value?: string) => void;
  onLink: (url: string) => void;
}

interface LinkPopoverProps {
  onInsert: (url: string) => void;
}

// ---------------------------------------------------------------------------
// ToolbarButton — onMouseDown + preventDefault keeps editor selection active
// ---------------------------------------------------------------------------

function ToolbarButton({ icon: Icon, title, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title={title}
      aria-label={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-border mx-1" aria-hidden />;
}

// ---------------------------------------------------------------------------
// LinkPopover — replaces prompt(), validates URL before inserting
// ---------------------------------------------------------------------------

function LinkPopover({ onInsert }: LinkPopoverProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setUrl("");
    setError("");
    setOpen(false);
  };

  const handleInsert = () => {
    if (!isSafeUrl(url)) {
      setError("URL inválida. Use https://...");
      return;
    }
    onInsert(url.trim());
    reset();
  };

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Inserir link"
          aria-label="Inserir link"
        >
          <Link className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            URL (https://...)
          </label>
          <Input
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleInsert()}
            placeholder="https://exemplo.com"
            className={error ? "border-destructive" : ""}
            aria-describedby={error ? "link-error" : undefined}
          />
          {error && (
            <p id="link-error" className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleInsert}>
              <Check className="w-3 h-3 mr-1" /> Inserir
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={reset}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// EditorToolbar — separated from the editor area
// Colors and alignment removed: both inject style="" attributes which
// are blocked by the sanitizer, causing silent formatting loss on save.
// ---------------------------------------------------------------------------

const TOOLBAR_GROUPS = [
  [
    { icon: Undo, cmd: "undo", title: "Desfazer" },
    { icon: Redo, cmd: "redo", title: "Refazer" },
  ],
  [
    { icon: Heading1, cmd: "formatBlock", value: "h1", title: "Título 1" },
    { icon: Heading2, cmd: "formatBlock", value: "h2", title: "Título 2" },
    { icon: Heading3, cmd: "formatBlock", value: "h3", title: "Título 3" },
  ],
  [
    { icon: Bold, cmd: "bold", title: "Negrito" },
    { icon: Italic, cmd: "italic", title: "Itálico" },
    { icon: Underline, cmd: "underline", title: "Sublinhado" },
    { icon: Strikethrough, cmd: "strikeThrough", title: "Riscado" },
  ],
  [
    { icon: List, cmd: "insertUnorderedList", title: "Lista" },
    { icon: ListOrdered, cmd: "insertOrderedList", title: "Lista numerada" },
    { icon: Quote, cmd: "formatBlock", value: "blockquote", title: "Citação" },
    { icon: Code, cmd: "formatBlock", value: "pre", title: "Código" },
  ],
] as const;

function EditorToolbar({ onCommand, onLink }: EditorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Opções de formatação"
      className="flex items-center gap-1 p-2 border-b border-border bg-background flex-wrap"
    >
      {TOOLBAR_GROUPS.map((group, i) => (
        <div key={i} role="group" className="flex items-center gap-1">
          {group.map((item) => (
            <ToolbarButton
              key={item.title}
              icon={item.icon}
              title={item.title}
              onClick={() => onCommand(item.cmd, "value" in item ? item.value : undefined)}
            />
          ))}
          {i < TOOLBAR_GROUPS.length - 1 && <Divider />}
        </div>
      ))}
      <Divider />
      <LinkPopover onInsert={onLink} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// InsightsDocEditor
//
// MIGRATION NOTE: this component uses the deprecated document.execCommand API.
// To migrate to Tiptap: replace the contentEditable div + EditorToolbar with
// <EditorContent editor={editor} /> and useEditor() from @tiptap/react.
// The sanitize() helper and onSave / onBack / onRename props stay unchanged.
// ---------------------------------------------------------------------------

export function InsightsDocEditor({ board, onSave, onBack, onRename }: InsightsDocEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(board.name);
  const [hasChanges, setHasChanges] = useState(false);

  // Sanitize content from the DB before injecting into the DOM
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitize(board.content ?? "");
    }
  }, [board.id]);

  const execCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value ?? undefined);
    editorRef.current?.focus();
    setHasChanges(true);
  }, []);

  const handleLink = useCallback((url: string) => {
    document.execCommand("createLink", false, url);
    // Force safe attributes on the newly created anchor
    editorRef.current?.querySelectorAll(`a[href="${url}"]`).forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
    editorRef.current?.focus();
    setHasChanges(true);
  }, []);

  // Sanitize content before persisting — second defence-in-depth layer
  const handleSave = async () => {
    if (!editorRef.current) return;
    setIsSaving(true);
    try {
      await onSave(sanitize(editorRef.current.innerHTML));
      setHasChanges(false);
      toast.success("Documento salvo!");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== board.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          title="Voltar"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        {isEditing ? (
          <Input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            className="max-w-xs font-semibold"
            aria-label="Nome do documento"
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
            title="Clique para renomear"
          >
            {board.name}
          </h2>
        )}

        <div className="flex-1" />

        {hasChanges && (
          <span className="text-xs text-amber-500 font-medium" role="status">
            Alterações não salvas
          </span>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="sm"
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <EditorToolbar onCommand={execCmd} onLink={handleLink} />

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <div
            ref={editorRef}
            role="textbox"
            aria-multiline="true"
            aria-label="Conteúdo do documento"
            contentEditable
            onInput={() => setHasChanges(true)}
            className="min-h-[500px] outline-none prose prose-neutral dark:prose-invert max-w-none
              [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6
              [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5
              [&>h3]:text-xl [&>h3]:font-medium [&>h3]:mb-2 [&>h3]:mt-4
              [&>p]:mb-4 [&>p]:leading-relaxed
              [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4
              [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4
              [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4
              [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-4
              [&_a]:text-primary [&_a]:underline"
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>
  );
}
