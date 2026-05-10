import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Square,
  Circle,
  Type,
  StickyNote,
  ArrowRight,
  Minus,
  Hand,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Plus,
  Palette,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Tool = "select" | "pan" | "rectangle" | "circle" | "text" | "sticky" | "arrow" | "line";

interface CanvasElement {
  id: string;
  type: "rectangle" | "circle" | "text" | "sticky" | "arrow" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color: string;
  strokeColor?: string;
  rotation?: number;
  points?: { x: number; y: number }[];
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

const STICKY_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#fecaca", // red
  "#bfdbfe", // blue
  "#e9d5ff", // purple
  "#fed7aa", // orange
];

export function InsightsCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (tool === "pan") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (tool === "select") {
      // Check if clicking on an element
      const clickedElement = [...elements].reverse().find(el => {
        return coords.x >= el.x && coords.x <= el.x + el.width &&
               coords.y >= el.y && coords.y <= el.y + el.height;
      });
      
      if (clickedElement) {
        setSelectedId(clickedElement.id);
        setIsDragging(true);
        setDragOffset({
          x: coords.x - clickedElement.x,
          y: coords.y - clickedElement.y,
        });
      } else {
        setSelectedId(null);
      }
      return;
    }

    // Drawing tools
    if (["rectangle", "circle", "text", "sticky", "arrow", "line"].includes(tool)) {
      setIsDrawing(true);
      setDrawStart(coords);
    }
  }, [tool, pan, elements, getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDragging && selectedId) {
      const coords = getCanvasCoords(e);
      setElements(prev => prev.map(el => 
        el.id === selectedId
          ? { ...el, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : el
      ));
      return;
    }

    if (isDrawing) {
      const coords = getCanvasCoords(e);
      // Could add preview here
    }
  }, [isPanning, panStart, isDragging, selectedId, dragOffset, isDrawing, getCanvasCoords]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (isDrawing) {
      const coords = getCanvasCoords(e);
      const width = Math.max(Math.abs(coords.x - drawStart.x), 100);
      const height = Math.max(Math.abs(coords.y - drawStart.y), 60);
      const x = Math.min(drawStart.x, coords.x);
      const y = Math.min(drawStart.y, coords.y);

      const newElement: CanvasElement = {
        id: `el-${Date.now()}`,
        type: tool as CanvasElement["type"],
        x: tool === "text" || tool === "sticky" ? drawStart.x : x,
        y: tool === "text" || tool === "sticky" ? drawStart.y : y,
        width: tool === "text" ? 200 : tool === "sticky" ? 200 : width,
        height: tool === "text" ? 40 : tool === "sticky" ? 150 : height,
        text: tool === "text" || tool === "sticky" ? "Clique para editar" : undefined,
        color: tool === "sticky" ? STICKY_COLORS[0] : currentColor,
        strokeColor: currentColor,
      };

      setElements(prev => [...prev, newElement]);
      setSelectedId(newElement.id);
      setIsDrawing(false);

      if (tool === "text" || tool === "sticky") {
        setEditingTextId(newElement.id);
      }

      // Reset to select tool after drawing
      setTool("select");
    }
  }, [isDrawing, drawStart, tool, currentColor, getCanvasCoords]);

  const handleDelete = useCallback(() => {
    if (selectedId) {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.25), 3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const updateElementText = (id: string, text: string) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, text } : el
    ));
  };

  const updateElementColor = (id: string, color: string) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, color } : el
    ));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!editingTextId) {
          handleDelete();
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingTextId(null);
        setTool("select");
      }
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("pan");
      if (e.key === "r") setTool("rectangle");
      if (e.key === "o") setTool("circle");
      if (e.key === "t") setTool("text");
      if (e.key === "s") setTool("sticky");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete, editingTextId]);

  const selectedElement = elements.find(el => el.id === selectedId);

  const tools = [
    { id: "select", icon: MousePointer2, label: "Selecionar (V)" },
    { id: "pan", icon: Hand, label: "Mover Canvas (H)" },
    { id: "rectangle", icon: Square, label: "Retângulo (R)" },
    { id: "circle", icon: Circle, label: "Círculo (O)" },
    { id: "text", icon: Type, label: "Texto (T)" },
    { id: "sticky", icon: StickyNote, label: "Post-it (S)" },
    { id: "arrow", icon: ArrowRight, label: "Seta" },
    { id: "line", icon: Minus, label: "Linha" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        {/* Tools */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-xl border border-border">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as Tool)}
              className={cn(
                "p-2 rounded-xl transition-all",
                tool === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={t.label}
            >
              <t.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
              title="Cor"
            >
              <div
                className="w-5 h-5 rounded-xl border border-border"
                style={{ backgroundColor: currentColor }}
              />
              <Palette className="w-4 h-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-xl border-2 transition-transform hover:scale-110",
                    currentColor === color ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            title="Resetar visualização"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        {selectedId && (
          <>
            {selectedElement && (selectedElement.type === "sticky" || selectedElement.type === "rectangle" || selectedElement.type === "circle") && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                    title="Cor do elemento"
                  >
                    <div
                      className="w-5 h-5 rounded-xl border border-border"
                      style={{ backgroundColor: selectedElement.color }}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="grid grid-cols-5 gap-2">
                    {(selectedElement.type === "sticky" ? STICKY_COLORS : COLORS).map((color) => (
                      <button
                        key={color}
                        onClick={() => updateElementColor(selectedId, color)}
                        className={cn(
                          "w-8 h-8 rounded-xl border-2 transition-transform hover:scale-110",
                          selectedElement.color === color ? "border-foreground" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
              title="Excluir (Delete)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "flex-1 overflow-hidden relative",
          tool === "pan" ? "cursor-grab" : "",
          isPanning ? "cursor-grabbing" : "",
          ["rectangle", "circle", "text", "sticky", "arrow", "line"].includes(tool) ? "cursor-crosshair" : ""
        )}
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setIsDragging(false);
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {elements.map((el) => (
            <div
              key={el.id}
              className={cn(
                "absolute transition-shadow",
                selectedId === el.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(el.id);
              }}
              onDoubleClick={() => {
                if (el.type === "text" || el.type === "sticky") {
                  setEditingTextId(el.id);
                }
              }}
            >
              {el.type === "rectangle" && (
                <div
                  className="w-full h-full rounded-xl border-2"
                  style={{
                    backgroundColor: el.color + "20",
                    borderColor: el.color,
                  }}
                />
              )}

              {el.type === "circle" && (
                <div
                  className="w-full h-full rounded-full border-2"
                  style={{
                    backgroundColor: el.color + "20",
                    borderColor: el.color,
                  }}
                />
              )}

              {el.type === "text" && (
                editingTextId === el.id ? (
                  <Input
                    autoFocus
                    value={el.text || ""}
                    onChange={(e) => updateElementText(el.id, e.target.value)}
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingTextId(null)}
                    className="w-full h-full bg-transparent border-none text-lg font-medium focus:ring-0"
                    style={{ color: el.color }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center text-lg font-medium cursor-text"
                    style={{ color: el.color }}
                  >
                    {el.text}
                  </div>
                )
              )}

              {el.type === "sticky" && (
                <div
                  className="w-full h-full rounded-xl shadow-lg p-3 flex flex-col"
                  style={{ backgroundColor: el.color }}
                >
                  {editingTextId === el.id ? (
                    <textarea
                      autoFocus
                      value={el.text || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateElementText(el.id, e.target.value)}
                      onBlur={() => setEditingTextId(null)}
                      className="w-full h-full bg-transparent border-none resize-none text-sm text-foreground/80 focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{el.text}</p>
                  )}
                </div>
              )}

              {el.type === "arrow" && (
                <svg className="w-full h-full" style={{ overflow: "visible" }}>
                  <defs>
                    <marker
                      id={`arrowhead-${el.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={el.strokeColor || el.color}
                      />
                    </marker>
                  </defs>
                  <line
                    x1="0"
                    y1={el.height / 2}
                    x2={el.width}
                    y2={el.height / 2}
                    stroke={el.strokeColor || el.color}
                    strokeWidth="2"
                    markerEnd={`url(#arrowhead-${el.id})`}
                  />
                </svg>
              )}

              {el.type === "line" && (
                <svg className="w-full h-full" style={{ overflow: "visible" }}>
                  <line
                    x1="0"
                    y1={el.height / 2}
                    x2={el.width}
                    y2={el.height / 2}
                    stroke={el.strokeColor || el.color}
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <StickyNote className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Comece a criar
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Use as ferramentas acima para adicionar formas, textos e post-its ao seu quadro de ideias
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span>{elements.length} elemento(s)</span>
        <span>Pressione V para selecionar, H para mover o canvas</span>
      </div>
    </div>
  );
}
