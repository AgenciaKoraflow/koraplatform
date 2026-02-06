export interface CanvasElement {
  id: string;
  type: "rectangle" | "circle" | "text" | "sticky" | "arrow" | "line" | "connector";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color: string;
  strokeColor?: string;
  rotation?: number;
  // For connectors
  startElementId?: string;
  endElementId?: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

export interface InsightsBoard {
  id: string;
  name: string;
  type: "canvas" | "document";
  description?: string;
  thumbnailUrl?: string;
  elements: CanvasElement[];
  content?: string; // For document type
  createdAt: string;
  updatedAt: string;
}

export type InsightsBoardInsert = Omit<InsightsBoard, "id" | "createdAt" | "updatedAt">;
export type InsightsBoardUpdate = Partial<InsightsBoardInsert>;
