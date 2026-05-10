import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InsightsBoard, InsightsBoardInsert, InsightsBoardUpdate, CanvasElement } from "@/types/insights";
import { toast } from "sonner";

export function useInsightsBoards() {
  const [boards, setBoards] = useState<InsightsBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("insights_boards")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mappedBoards: InsightsBoard[] = (data || []).map((board) => ({
        id: board.id,
        name: board.name,
        type: board.type as "canvas" | "document",
        description: board.description || undefined,
        thumbnailUrl: board.thumbnail_url || undefined,
        elements: (board.elements as unknown as CanvasElement[]) || [],
        content: board.content || undefined,
        createdAt: board.created_at,
        updatedAt: board.updated_at,
      }));

      setBoards(mappedBoards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      toast.error("Erro ao carregar quadros");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = async (board: InsightsBoardInsert): Promise<InsightsBoard | null> => {
    try {
      // Using any to bypass strict typing issues with Supabase's generated types
      const insertData = {
        name: board.name,
        type: board.type,
        description: board.description || null,
        thumbnail_url: board.thumbnailUrl || null,
        elements: board.elements || [],
        content: board.content || null,
      };

      const { data, error } = await supabase
        .from("insights_boards")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      const newBoard: InsightsBoard = {
        id: data.id,
        name: data.name,
        type: data.type as "canvas" | "document",
        description: data.description || undefined,
        thumbnailUrl: data.thumbnail_url || undefined,
        elements: (data.elements as unknown as CanvasElement[]) || [],
        content: data.content || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setBoards((prev) => [newBoard, ...prev]);
      toast.success("Quadro criado com sucesso!");
      return newBoard;
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error("Erro ao criar quadro");
      return null;
    }
  };

  const updateBoard = async (id: string, updates: InsightsBoardUpdate): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnail_url = updates.thumbnailUrl;
      if (updates.elements !== undefined) updateData.elements = JSON.parse(JSON.stringify(updates.elements));
      if (updates.content !== undefined) updateData.content = updates.content;

      const { error } = await supabase
        .from("insights_boards")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setBoards((prev) =>
        prev.map((board) =>
          board.id === id
            ? { ...board, ...updates, updatedAt: new Date().toISOString() }
            : board
        )
      );

      return true;
    } catch (error) {
      console.error("Error updating board:", error);
      toast.error("Erro ao salvar quadro");
      return false;
    }
  };

  const deleteBoard = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("insights_boards")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setBoards((prev) => prev.filter((board) => board.id !== id));
      toast.success("Quadro removido com sucesso!");
      return true;
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Erro ao remover quadro");
      return false;
    }
  };

  const getBoard = (id: string): InsightsBoard | undefined => {
    return boards.find((board) => board.id === id);
  };

  return {
    boards,
    isLoading,
    createBoard,
    updateBoard,
    deleteBoard,
    getBoard,
    refetch: fetchBoards,
  };
}
