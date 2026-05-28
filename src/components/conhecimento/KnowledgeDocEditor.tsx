import { useState, useCallback } from "react";
import DOMPurify from "dompurify";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Highlighter,
  Type,
  Check,
  X,
} from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KnowledgeItem } from "@/types/data";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorMetadata = {
  title: string;
  clientId: string;
  projectId: string;
  category: string;
  tags: string;
};

type Client = { id: string; company: string };
type Project = { id: string; name: string; clientId: string };

interface KnowledgeDocEditorProps {
  item: KnowledgeItem | null;
  initialContent: string;
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
// Sanitization — allows inline styles for font size/color/alignment
// ---------------------------------------------------------------------------

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "p", "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "b", "strong", "i", "em", "u", "s", "strike",
    "a", "blockquote", "pre", "code",
    "br", "div", "span", "mark",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: true,
  ALLOWED_URI_REGEXP: /^https?:\/\/.+/i,
};

const DANGEROUS_CSS = /expression|javascript|vbscript|behavior|binding/gi;

function sanitize(html: string): string {
  const clean = DOMPurify.sanitize(html, PURIFY_CONFIG) as string;
  return clean.replace(/style="([^"]*)"/gi, (match, styles) =>
    DANGEROUS_CSS.test(styles) ? "" : match,
  );
}

// ---------------------------------------------------------------------------
// Custom FontSize extension via TextStyle
// ---------------------------------------------------------------------------

const FontSizeExtension = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => {
          if (!attrs.fontSize) return {};
          return { style: `font-size: ${attrs.fontSize}` };
        },
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Color palettes
// ---------------------------------------------------------------------------

const TEXT_COLORS = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
  "#FFFFFF", "#FEF9C3", "#DBEAFE", "#F3E8FF",
];

const HIGHLIGHT_COLORS = [
  "#FEF08A", "#BBF7D0", "#BFDBFE", "#DDD6FE",
  "#FED7AA", "#FECACA", "#E0F2FE", "#F0FDF4",
];

const FONT_SIZES = [
  "10px", "11px", "12px", "14px", "16px", "18px",
  "20px", "24px", "28px", "32px", "36px", "48px",
];

// ---------------------------------------------------------------------------
// Toolbar sub-components
// ---------------------------------------------------------------------------

function ToolbarButton({
  icon: Icon,
  title,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted ${active ? "bg-muted text-foreground" : ""}`}
      title={title}
      aria-label={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" aria-hidden />;
}

function FontSizeSelect({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("textStyle").fontSize ?? "14px";
  return (
    <Select
      value={current}
      onValueChange={(size) => {
        editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
      }}
    >
      <SelectTrigger className="h-7 w-[72px] text-xs border-border px-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FONT_SIZES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {s.replace("px", "")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ColorPopover({
  title,
  icon: Icon,
  colors,
  onSelect,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: string[];
  onSelect: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={title}
          aria-label={title}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2" align="start">
        <div className="grid grid-cols-4 gap-1 mb-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              style={{ backgroundColor: color }}
              className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(color);
              }}
              aria-label={color}
            />
          ))}
        </div>
        <input
          type="color"
          className="w-full h-7 cursor-pointer rounded border border-border"
          onChange={(e) => onSelect(e.target.value)}
        />
      </PopoverContent>
    </Popover>
  );
}

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const reset = () => { setUrl(""); setError(""); setOpen(false); };

  const handleInsert = () => {
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setError("URL inválida. Use https://...");
      return;
    }
    editor.chain().focus().setLink({ href: trimmed, target: "_blank", rel: "noopener noreferrer" }).run();
    reset();
  };

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Inserir link"
          aria-label="Inserir link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">URL (https://...)</label>
          <Input
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleInsert()}
            placeholder="https://exemplo.com"
            className={error ? "border-destructive" : ""}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
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

function DocToolbar({ editor }: { editor: Editor }) {
  return (
    <div
      role="toolbar"
      aria-label="Opções de formatação"
      className="flex items-center gap-0.5 p-2 border-b border-border bg-muted/30 flex-wrap"
    >
      {/* Undo / Redo */}
      <ToolbarButton icon={Undo} title="Desfazer" onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton icon={Redo} title="Refazer" onClick={() => editor.chain().focus().redo().run()} />
      <Divider />

      {/* Headings */}
      <ToolbarButton icon={Heading1} title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton icon={Heading2} title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Heading3} title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <Divider />

      {/* Font size */}
      <FontSizeSelect editor={editor} />
      <Divider />

      {/* Basic formatting */}
      <ToolbarButton icon={Bold} title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon={UnderlineIcon} title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton icon={Strikethrough} title="Riscado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <Divider />

      {/* Colors */}
      <ColorPopover
        title="Cor do texto"
        icon={Type}
        colors={TEXT_COLORS}
        onSelect={(color) => editor.chain().focus().setColor(color).run()}
      />
      <ColorPopover
        title="Destacar texto"
        icon={Highlighter}
        colors={HIGHLIGHT_COLORS}
        onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
      />
      <Divider />

      {/* Alignment */}
      <ToolbarButton icon={AlignLeft} title="Alinhar à esquerda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
      <ToolbarButton icon={AlignCenter} title="Centralizar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
      <ToolbarButton icon={AlignRight} title="Alinhar à direita" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
      <ToolbarButton icon={AlignJustify} title="Justificar" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
      <Divider />

      {/* Lists & blocks */}
      <ToolbarButton icon={List} title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon={Quote} title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton icon={Code} title="Código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      <Divider />

      {/* Link */}
      <LinkPopover editor={editor} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KnowledgeDocEditor
// ---------------------------------------------------------------------------

export function KnowledgeDocEditor({
  item,
  initialContent,
  metadata,
  clients,
  projects,
  onBack,
  onSaved,
  onAdd,
  onUpdate,
}: KnowledgeDocEditorProps) {
  const [localTitle, setLocalTitle] = useState(metadata.title);
  const [localClientId, setLocalClientId] = useState(metadata.clientId);
  const [localProjectId, setLocalProjectId] = useState(metadata.projectId);
  const [localTags, setLocalTags] = useState(metadata.tags);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const availableProjects = localClientId
    ? projects.filter((p) => p.clientId === localClientId)
    : [];

  const editor = useEditor({
    extensions: [
      StarterKit,
      FontSizeExtension,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
    ],
    content: sanitize(initialContent || "<p></p>"),
    onUpdate: () => setHasChanges(true),
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;
    if (!localTitle.trim()) { toast.error("Informe um título"); return; }
    if (!localClientId) { toast.error("Selecione um cliente"); return; }
    setIsSaving(true);
    try {
      const html = sanitize(editor.getHTML());
      const tags = localTags.split(",").map((t) => t.trim()).filter(Boolean);
      if (item) {
        onUpdate(item.id, {
          title: localTitle,
          clientId: localClientId,
          projectIds: localProjectId ? [localProjectId] : [],
          content: html,
          tags,
          docType: "Doc",
        });
      } else {
        await onAdd({
          title: localTitle,
          category: "documento",
          clientId: localClientId,
          projectIds: localProjectId ? [localProjectId] : [],
          content: html,
          tags,
          docType: "Doc",
          createdAt: "",
          updatedAt: "",
        });
      }
      setHasChanges(false);
      toast.success("Documento salvo!");
      onSaved?.();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }, [editor, localTitle, localClientId, localProjectId, localTags, item, onAdd, onUpdate, onSaved]);

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
          placeholder="Título do documento"
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

      {/* Toolbar */}
      {editor && <DocToolbar editor={editor} />}

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <EditorContent
            editor={editor}
            className="min-h-[500px] outline-none
              [&_.ProseMirror]:outline-none
              [&_.ProseMirror]:min-h-[500px]
              [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:mt-6
              [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-5
              [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-4
              [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-relaxed
              [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:mb-3
              [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:mb-3
              [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:text-muted-foreground
              [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:text-sm
              [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:cursor-pointer
              [&_.ProseMirror_mark]:rounded-sm [&_.ProseMirror_mark]:px-0.5
              [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0"
          />
        </div>
      </div>
    </div>
  );
}
