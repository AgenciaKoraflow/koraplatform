import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  Save,
  ArrowLeft,
  Palette,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InsightsBoard } from "@/types/insights";
import { toast } from "sonner";

interface InsightsDocEditorProps {
  board: InsightsBoard;
  onSave: (content: string) => Promise<void>;
  onBack: () => void;
  onRename: (name: string) => void;
}

const COLORS = [
  "#000000", "#374151", "#6b7280", "#9ca3af",
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#f43f5e",
];

export function InsightsDocEditor({ board, onSave, onBack, onRename }: InsightsDocEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(board.name);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (editorRef.current && board.content) {
      editorRef.current.innerHTML = board.content;
    }
  }, [board.id]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    setIsSaving(true);
    try {
      await onSave(editorRef.current.innerHTML);
      setHasChanges(false);
      toast.success("Documento salvo!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameSave = () => {
    if (editName.trim() && editName !== board.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const toolbarGroups = [
    {
      items: [
        { icon: Undo, action: () => execCommand("undo"), title: "Desfazer" },
        { icon: Redo, action: () => execCommand("redo"), title: "Refazer" },
      ],
    },
    {
      items: [
        { icon: Heading1, action: () => execCommand("formatBlock", "h1"), title: "Título 1" },
        { icon: Heading2, action: () => execCommand("formatBlock", "h2"), title: "Título 2" },
        { icon: Heading3, action: () => execCommand("formatBlock", "h3"), title: "Título 3" },
      ],
    },
    {
      items: [
        { icon: Bold, action: () => execCommand("bold"), title: "Negrito" },
        { icon: Italic, action: () => execCommand("italic"), title: "Itálico" },
        { icon: Underline, action: () => execCommand("underline"), title: "Sublinhado" },
        { icon: Strikethrough, action: () => execCommand("strikeThrough"), title: "Riscado" },
      ],
    },
    {
      items: [
        { icon: AlignLeft, action: () => execCommand("justifyLeft"), title: "Alinhar à esquerda" },
        { icon: AlignCenter, action: () => execCommand("justifyCenter"), title: "Centralizar" },
        { icon: AlignRight, action: () => execCommand("justifyRight"), title: "Alinhar à direita" },
      ],
    },
    {
      items: [
        { icon: List, action: () => execCommand("insertUnorderedList"), title: "Lista" },
        { icon: ListOrdered, action: () => execCommand("insertOrderedList"), title: "Lista numerada" },
        { icon: Quote, action: () => execCommand("formatBlock", "blockquote"), title: "Citação" },
        { icon: Code, action: () => execCommand("formatBlock", "pre"), title: "Código" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-secondary/30">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Editable Title */}
        {isEditing ? (
          <Input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            className="max-w-xs font-semibold"
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          >
            {board.name}
          </h2>
        )}

        <div className="flex-1" />

        {hasChanges && (
          <span className="text-xs text-amber-500 font-medium">Alterações não salvas</span>
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

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-background flex-wrap">
        {toolbarGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-1">
            {group.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={item.action}
                className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title={item.title}
              >
                <item.icon className="w-4 h-4" />
              </button>
            ))}
            {groupIndex < toolbarGroups.length - 1 && (
              <div className="w-px h-6 bg-border mx-1" />
            )}
          </div>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Cor do texto"
            >
              <Type className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => execCommand("foreColor", color)}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Cor de fundo"
            >
              <Palette className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => execCommand("hiliteColor", color)}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Link */}
        <button
          onClick={() => {
            const url = prompt("Digite a URL:");
            if (url) execCommand("createLink", url);
          }}
          className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Inserir link"
        >
          <Link className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <div
            ref={editorRef}
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
              [&>pre]:bg-secondary [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-4
              [&_a]:text-primary [&_a]:underline"
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>
  );
}
