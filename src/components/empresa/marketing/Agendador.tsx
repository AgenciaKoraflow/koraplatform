import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

const platforms = [
  { name: "INSTAGRAM", color: "border-pink-500" },
  { name: "TIKTOK", color: "border-black" },
  { name: "YT SHORTS", color: "border-red-500" },
  { name: "LINKEDIN", color: "border-blue-700" },
];

export function Agendador({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Agendar Este Reel</h1>
          <p className="text-muted-foreground text-sm">
            VOCÊ PRECISA DE UM PAINEL DE CONTEÚDO...
          </p>
        </div>
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          AGENDAR TUDO
        </Button>
      </div>

      {/* Platform Selection */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
        <h3 className="font-semibold text-foreground mb-4">
          Selecione as plataformas
        </h3>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.name}
              className={`px-4 py-2 rounded-lg border-2 ${platform.color} bg-transparent text-foreground font-semibold hover:bg-secondary/30 transition-all`}
            >
              {platform.name}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Form */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Data
              </label>
              <input
                type="date"
                defaultValue="2026-05-26"
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">Seg · 26 Mai</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Hora
              </label>
              <input
                type="time"
                defaultValue="07:30"
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">07:30</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Via
              </label>
              <input
                type="text"
                defaultValue="Zernio MCP"
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">Zernio MCP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
