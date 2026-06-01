import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import DOMPurify from "dompurify";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, Underline as UnderlineIcon, Code,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, AtSign, Paperclip, X, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/hooks/useProfile";

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ["p", "ul", "ol", "li", "b", "strong", "i", "em", "u", "s",
    "a", "pre", "code", "br", "div", "span"],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^https?:\/\/.+/i,
};

export function sanitizeCommentHtml(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG) as string;
}

export interface CommentComposerHandle {
  focus(): void;
}

interface CommentComposerProps {
  profiles: Profile[];
  avatarUrl: (name: string) => string;
  onSubmit: (params: {
    html: string;
    mentionedUserIds: string[];
    isPrivate: boolean;
    files: File[];
  }) => void;
  isSubmitting: boolean;
  requireEvidence?: boolean;
}

export const CommentComposer = forwardRef<CommentComposerHandle, CommentComposerProps>(
function CommentComposer({ profiles, avatarUrl, onSubmit, isSubmitting, requireEvidence }, ref) {
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionFrom, setMentionFrom] = useState<number | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextAlign.configure({ types: ["paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
    ],
    editorProps: {
      attributes: { class: "min-h-[80px] text-sm outline-none prose prose-invert max-w-none" },
    },
    onCreate({ editor: ed }) {
      setEditorEmpty(ed.isEmpty);
    },
    onUpdate({ editor: ed }) {
      setEditorEmpty(ed.isEmpty);
      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(Math.max(0, from - 100), from, "\n");
      const match = textBefore.match(/@(\w*)$/);
      if (match) {
        setMentionQuery(match[1].toLowerCase());
        setMentionFrom(from - match[0].length);
      } else {
        setMentionQuery(null);
        setMentionFrom(null);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    focus() { editor?.commands.focus(); },
  }), [editor]);

  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return profiles
      .filter((p) => p.full_name?.toLowerCase().includes(q) || p.cargo?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [mentionQuery, profiles]);

  const handleSelectMention = useCallback((p: Profile) => {
    if (!editor || mentionFrom === null) return;
    const name = (p.full_name ?? "Usuário").replace(/\s+/g, "");
    const { from } = editor.state.selection;
    editor.chain().deleteRange({ from: mentionFrom, to: from }).insertContent(`@${name} `).focus().run();
    setMentionQuery(null);
    setMentionFrom(null);
    if (!mentionedUserIds.includes(p.id)) setMentionedUserIds((prev) => [...prev, p.id]);
  }, [editor, mentionFrom, mentionedUserIds]);

  const handleApplyLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    editor.chain().focus().extendMarkToLink().setLink({ href: linkUrl.trim() }).run();
    setLinkUrl("");
    setLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const handleInsertAtMention = useCallback(() => {
    editor?.chain().focus().insertContent("@").run();
  }, [editor]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }, []);

  const handleRemoveFile = useCallback((idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!editor || editorEmpty || isSubmitting) return;
    const html = sanitizeCommentHtml(editor.getHTML());
    onSubmit({ html, mentionedUserIds, isPrivate: false, files: pendingFiles });
    editor.commands.clearContent();
    setMentionedUserIds([]);
    setPendingFiles([]);
    setMentionQuery(null);
    setMentionFrom(null);
  }, [editor, editorEmpty, isSubmitting, mentionedUserIds, pendingFiles, onSubmit]);

  const isActive = (name: string, attrs?: Record<string, unknown>) => editor?.isActive(name, attrs) ?? false;
  const btnBase = "p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted";
  const btnActive = "bg-muted text-foreground";

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border flex-wrap">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={cn(btnBase, isActive("bold") && btnActive)} title="Negrito"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={cn(btnBase, isActive("italic") && btnActive)} title="Itálico"><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={cn(btnBase, isActive("underline") && btnActive)} title="Sublinhado"><UnderlineIcon className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor?.chain().focus().toggleCode().run()} className={cn(btnBase, isActive("code") && btnActive)} title="Código"><Code className="w-3.5 h-3.5" /></button>
        <span className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={cn(btnBase, isActive("bulletList") && btnActive)} title="Lista"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={cn(btnBase, isActive("orderedList") && btnActive)} title="Lista numerada"><ListOrdered className="w-3.5 h-3.5" /></button>
        <span className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()} className={cn(btnBase, isActive("textAlign", { textAlign: "left" }) && btnActive)} title="Alinhar à esquerda"><AlignLeft className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()} className={cn(btnBase, isActive("textAlign", { textAlign: "center" }) && btnActive)} title="Centralizar"><AlignCenter className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor?.chain().focus().setTextAlign("right").run()} className={cn(btnBase, isActive("textAlign", { textAlign: "right" }) && btnActive)} title="Alinhar à direita"><AlignRight className="w-3.5 h-3.5" /></button>
        <span className="w-px h-4 bg-border mx-1" />
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={cn(btnBase, isActive("link") && btnActive)} title="Inserir link"><LinkIcon className="w-3.5 h-3.5" /></button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <p className="text-xs font-medium mb-2">Inserir link</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyLink()}
                className="h-8 text-xs"
                autoFocus
              />
              <Button size="sm" onClick={handleApplyLink} className="h-8 px-3 text-xs shrink-0">
                OK
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <button type="button" onClick={handleInsertAtMention} className={cn(btnBase)} title="Mencionar alguém"><AtSign className="w-3.5 h-3.5" /></button>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:block">Cmd/Ctrl + Enter para enviar</span>
      </div>

      {/* Editor area + mention popup */}
      <div className="relative px-3 pt-3 pb-2">
        {filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-3 mb-1 z-50 rounded-md border border-border bg-popover shadow-md overflow-hidden min-w-[200px]">
            {filteredMentions.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelectMention(p); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <UserAvatar name={p.full_name ?? "Usuário"} src={avatarUrl(p.full_name ?? "")} size="xs" />
                <div className="min-w-0">
                  <p className="font-medium leading-none truncate">{p.full_name ?? "Usuário"}</p>
                  {p.cargo && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.cargo}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        <EditorContent editor={editor} />

        {editorEmpty && (
          <p className="absolute top-3 left-3 text-sm text-muted-foreground pointer-events-none select-none">
            {requireEvidence
              ? "Descreva a evidência da aprovação (texto, print, etc.)..."
              : "Escreva um comentário... Use @ para mencionar alguém"}
          </p>
        )}
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {pendingFiles.map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1 max-w-[160px]">
              <Paperclip className="w-3 h-3 shrink-0" />
              <span className="truncate">{f.name}</span>
              <button onClick={() => handleRemoveFile(i)} className="text-muted-foreground hover:text-destructive ml-0.5 shrink-0">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Attach files + Submit row */}
      <div className="flex items-center justify-between gap-3 px-3 pb-3 border-t border-border pt-2">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-foreground"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Anexar Arquivos
          </button>
          <span className="text-xs text-muted-foreground">Máx 10MB por arquivo</span>
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={editorEmpty || isSubmitting}
          className="h-8 text-xs gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          {requireEvidence ? "Confirmar Aprovação" : "Adicionar Comentário"}
        </Button>
      </div>
    </div>
  );
});

CommentComposer.displayName = "CommentComposer";
