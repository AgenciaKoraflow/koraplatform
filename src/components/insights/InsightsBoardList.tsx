import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  PenTool,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Folder,
} from "lucide-react";
import { InsightsBoard } from "@/types/insights";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InsightsBoardListProps {
  boards: InsightsBoard[];
  isLoading: boolean;
  onCreateCanvas: () => void;
  onCreateDocument: () => void;
  onOpenBoard: (board: InsightsBoard) => void;
  onDeleteBoard: (id: string) => void;
  onRenameBoard: (board: InsightsBoard) => void;
}

export function InsightsBoardList({
  boards,
  isLoading,
  onCreateCanvas,
  onCreateDocument,
  onOpenBoard,
  onDeleteBoard,
  onRenameBoard,
}: InsightsBoardListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "canvas" | "document">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || board.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateCanvas}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-glow"
          >
            <PenTool className="w-4 h-4" />
            Novo Canvas
          </button>
          <button
            onClick={onCreateDocument}
            className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors border border-border"
          >
            <FileText className="w-4 h-4" />
            Novo Documento
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-input rounded-xl border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        {[
          { value: "all", label: "Todos" },
          { value: "canvas", label: "Canvas" },
          { value: "document", label: "Documentos" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterType(option.value as typeof filterType)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
              filterType === option.value
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-input text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredBoards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "Nenhum resultado encontrado" : "Nenhum quadro criado"}
          </h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            {searchQuery
              ? "Tente buscar por outro termo"
              : "Crie seu primeiro canvas ou documento para começar a organizar suas ideias"}
          </p>
          {!searchQuery && (
            <div className="flex items-center gap-3">
              <button
                onClick={onCreateCanvas}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <PenTool className="w-4 h-4" />
                Criar Canvas
              </button>
              <button
                onClick={onCreateDocument}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors border border-border"
              >
                <FileText className="w-4 h-4" />
                Criar Documento
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredBoards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoards.map((board, index) => (
            <div
              key={board.id}
              onClick={() => onOpenBoard(board)}
              className="group relative p-4 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium hover:border-primary/30 transition-all duration-200 cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Thumbnail */}
              <div
                className={cn(
                  "aspect-video rounded-xl mb-4 flex items-center justify-center",
                  board.type === "canvas"
                    ? "bg-gradient-to-br from-primary/20 to-muted/20"
                    : "bg-gradient-to-br from-muted/20 to-muted/20"
                )}
              >
                {board.type === "canvas" ? (
                  <PenTool className="w-8 h-8 text-primary/60" />
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground/60" />
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground truncate">{board.name}</h3>
                {board.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {board.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(board.updatedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <ActionMenu
                  items={[
                    {
                      label: "Renomear",
                      icon: Edit,
                      onClick: () => onRenameBoard(board),
                    },
                    {
                      label: "Excluir",
                      icon: Trash2,
                      onClick: () => setDeletingId(board.id),
                      variant: "destructive",
                    },
                  ]}
                />
              </div>

              {/* Type Badge */}
              <div
                className={cn(
                  "absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium",
                  board.type === "canvas"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/15 text-muted-foreground"
                )}
              >
                {board.type === "canvas" ? "Canvas" : "Documento"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredBoards.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Nome
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Tipo
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Atualizado
                </th>
                <th className="text-right px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBoards.map((board) => (
                <tr
                  key={board.id}
                  onClick={() => onOpenBoard(board)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          board.type === "canvas"
                            ? "bg-primary/10"
                            : "bg-primary/15"
                        )}
                      >
                        {board.type === "canvas" ? (
                          <PenTool className="w-5 h-5 text-primary" />
                        ) : (
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{board.name}</p>
                        {board.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        board.type === "canvas"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/15 text-muted-foreground"
                      )}
                    >
                      {board.type === "canvas" ? "Canvas" : "Documento"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {formatDate(board.updatedAt)}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      items={[
                        {
                          label: "Renomear",
                          icon: Edit,
                          onClick: () => onRenameBoard(board),
                        },
                        {
                          label: "Excluir",
                          icon: Trash2,
                          onClick: () => setDeletingId(board.id),
                          variant: "destructive",
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Excluir Quadro"
        description="Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => {
          if (deletingId) {
            onDeleteBoard(deletingId);
            setDeletingId(null);
          }
        }}
        variant="destructive"
      />
    </div>
  );
}
