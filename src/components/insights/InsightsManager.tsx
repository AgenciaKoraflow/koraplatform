import { useState } from "react";
import { useInsightsBoards } from "@/hooks/useInsightsBoards";
import { InsightsBoardList } from "./InsightsBoardList";
import { InsightsCanvasEnhanced } from "./InsightsCanvasEnhanced";
import { InsightsDocEditor } from "./InsightsDocEditor";
import { InsightsBoard, CanvasElement } from "@/types/insights";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ViewState = 
  | { type: "list" }
  | { type: "canvas"; board: InsightsBoard }
  | { type: "document"; board: InsightsBoard };

interface Props {
  source: string;
}

export function InsightsManager({ source }: Props) {
  const { boards, isLoading, createBoard, updateBoard, deleteBoard } = useInsightsBoards(source);
  const [viewState, setViewState] = useState<ViewState>({ type: "list" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"canvas" | "document">("canvas");
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [renamingBoard, setRenamingBoard] = useState<InsightsBoard | null>(null);

  const handleCreateCanvas = () => {
    setCreateType("canvas");
    setFormData({ name: "Novo Canvas", description: "" });
    setIsCreateDialogOpen(true);
  };

  const handleCreateDocument = () => {
    setCreateType("document");
    setFormData({ name: "Novo Documento", description: "" });
    setIsCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    const newBoard = await createBoard({
      name: formData.name,
      type: createType,
      description: formData.description || undefined,
      elements: [],
      content: createType === "document" ? "<p>Comece a escrever...</p>" : undefined,
    });

    if (newBoard) {
      setIsCreateDialogOpen(false);
      if (createType === "canvas") {
        setViewState({ type: "canvas", board: newBoard });
      } else {
        setViewState({ type: "document", board: newBoard });
      }
    }
  };

  const handleOpenBoard = (board: InsightsBoard) => {
    if (board.type === "canvas") {
      setViewState({ type: "canvas", board });
    } else {
      setViewState({ type: "document", board });
    }
  };

  const handleBack = () => {
    setViewState({ type: "list" });
  };

  const handleSaveCanvas = async (elements: CanvasElement[]) => {
    if (viewState.type === "canvas") {
      await updateBoard(viewState.board.id, { elements });
    }
  };

  const handleSaveDocument = async (content: string) => {
    if (viewState.type === "document") {
      await updateBoard(viewState.board.id, { content });
    }
  };

  const handleRename = async (name: string) => {
    if (viewState.type === "canvas" || viewState.type === "document") {
      await updateBoard(viewState.board.id, { name });
      setViewState(prev => {
        if (prev.type === "canvas" || prev.type === "document") {
          return { ...prev, board: { ...prev.board, name } };
        }
        return prev;
      });
    }
  };

  const handleOpenRenameDialog = (board: InsightsBoard) => {
    setRenamingBoard(board);
    setFormData({ name: board.name, description: board.description || "" });
    setIsRenameDialogOpen(true);
  };

  const handleRenameFromDialog = async () => {
    if (renamingBoard) {
      await updateBoard(renamingBoard.id, { 
        name: formData.name, 
        description: formData.description || undefined 
      });
      setIsRenameDialogOpen(false);
      setRenamingBoard(null);
    }
  };

  if (viewState.type === "canvas") {
    return (
      <InsightsCanvasEnhanced
        board={viewState.board}
        onSave={handleSaveCanvas}
        onBack={handleBack}
        onRename={handleRename}
      />
    );
  }

  if (viewState.type === "document") {
    return (
      <InsightsDocEditor
        board={viewState.board}
        onSave={handleSaveDocument}
        onBack={handleBack}
        onRename={handleRename}
      />
    );
  }

  return (
    <>
      <InsightsBoardList
        boards={boards}
        isLoading={isLoading}
        onCreateCanvas={handleCreateCanvas}
        onCreateDocument={handleCreateDocument}
        onOpenBoard={handleOpenBoard}
        onDeleteBoard={deleteBoard}
        onRenameBoard={handleOpenRenameDialog}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-border" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {createType === "canvas" ? "Novo Canvas" : "Novo Documento"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do quadro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste quadro"
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-card border-border" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Renomear Quadro</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-name">Nome</Label>
              <Input
                id="rename-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do quadro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rename-description">Descrição (opcional)</Label>
              <Textarea
                id="rename-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste quadro"
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameFromDialog} disabled={!formData.name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
