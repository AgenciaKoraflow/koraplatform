import { useRef, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, Type, Upload, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SignaturePadProProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  initialName?: string;
}

const SIGNATURE_FONTS = [
  { name: "Caveat", family: "'Caveat', cursive" },
  { name: "Dancing Script", family: "'Dancing Script', cursive" },
  { name: "Great Vibes", family: "'Great Vibes', cursive" },
  { name: "Pacifico", family: "'Pacifico', cursive" },
  { name: "Satisfy", family: "'Satisfy', cursive" },
  { name: "Allura", family: "'Allura', cursive" },
];

const INK_COLORS = [
  { name: "Azul", value: "#1e40af" },
  { name: "Preto", value: "#0f172a" },
  { name: "Azul-escuro", value: "#1e3a8a" },
];

export function SignaturePadPro({ onSave, onCancel, initialName = "" }: SignaturePadProProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typedCanvasRef = useRef<HTMLCanvasElement>(null);

  const [tab, setTab] = useState<"draw" | "type" | "upload">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState(INK_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(2.5);

  const [typedName, setTypedName] = useState(initialName);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  const [_typedDataUrl, setTypedDataUrl] = useState<string | null>(null);

  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "draw") initCanvas();
  }, [tab]);

  useEffect(() => {
    if (tab === "type") renderTypedSignature();
  }, [tab, inkColor, selectedFont, typedName]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ("touches" in e) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) onSave(canvas.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    initCanvas();
    setHasDrawn(false);
  };

  const renderTypedSignature = () => {
    const canvas = typedCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (!typedName.trim()) {
      setTypedDataUrl(null);
      return;
    }

    ctx.fillStyle = inkColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = 64;
    ctx.font = `${fontSize}px ${selectedFont.family}`;
    while (ctx.measureText(typedName).width > rect.width - 40 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `${fontSize}px ${selectedFont.family}`;
    }
    ctx.fillText(typedName, rect.width / 2, rect.height / 2);

    const dataUrl = canvas.toDataURL("image/png");
    setTypedDataUrl(dataUrl);
    onSave(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem (PNG, JPG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Máximo 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedDataUrl(dataUrl);
      onSave(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&display=swap"
      />
      <div className="space-y-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="draw" className="gap-2">
              <PenTool className="w-4 h-4" />
              Desenhar
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-2">
              <Type className="w-4 h-4" />
              Digitar
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Enviar imagem
            </TabsTrigger>
          </TabsList>

          {/* Color & Stroke controls */}
          {(tab === "draw" || tab === "type") && (
            <div className="flex items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cor:</span>
                {INK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setInkColor(c.value)}
                    aria-label={c.name}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform",
                      inkColor === c.value ? "border-primary scale-110" : "border-border"
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              {tab === "draw" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Traço:</span>
                  <input
                    type="range"
                    min="1.5"
                    max="5"
                    step="0.5"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-20 accent-primary"
                  />
                </div>
              )}
            </div>
          )}

          <TabsContent value="draw" className="mt-4">
            <div className="relative rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-white to-slate-50 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-56 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <PenTool className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground/60">Desenhe sua assinatura aqui</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-300" />
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Digite seu nome"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label>Estilo de assinatura</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SIGNATURE_FONTS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setSelectedFont(f)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center bg-white hover:border-primary/50",
                      selectedFont.name === f.name ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <span
                      className="text-2xl"
                      style={{ fontFamily: f.family, color: inkColor }}
                    >
                      {typedName || "Assinatura"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-white to-slate-50 overflow-hidden">
              <canvas ref={typedCanvasRef} className="w-full h-40" />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploadedDataUrl ? (
              <div className="relative rounded-xl border-2 border-primary/50 bg-white p-4">
                <button
                  onClick={() => {
                    setUploadedDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background border border-border hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={uploadedDataUrl}
                  alt="Assinatura"
                  className="max-h-40 mx-auto object-contain"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-56 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white to-slate-50"
              >
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Clique para enviar</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG — máx 2MB</p>
                </div>
              </button>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (tab === "draw") clearCanvas();
              else if (tab === "type") setTypedName("");
              else if (tab === "upload") setUploadedDataUrl(null);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
