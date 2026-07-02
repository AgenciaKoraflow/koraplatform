import { TrendingUp, MessageCircle, Heart, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

interface MetricCard {
  label: string;
  value: string | number;
  change: string;
  period: string;
}

const metrics: MetricCard[] = [
  { label: "VIEWS IG", value: "287.4K", change: "+162%", period: "7D" },
  { label: "STRIPE", value: "$48.2K", change: "+39%", period: "30D" },
  { label: "DMS FILTRADAS", value: "1.204", change: "+88%", period: "7D" },
];

const recentFeatures = [
  {
    icon: "◆",
    title: "Hook Vault",
    description: "482 hooks · 17 novos essa semana",
  },
  {
    icon: "◯",
    title: "Concorrentes",
    description: "8 criadores · raspado dom 6h",
  },
  {
    icon: "▦",
    title: "Calendário",
    description: "S/Q/S · auto-preenchido por /script",
  },
  {
    icon: "≡",
    title: "Em Alta",
    description: "12 fontes · 5 itens com potencial",
  },
];

export function VisaoGeral({ workspaceId }: Props) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Bom dia, Fabiano</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            3 REELS NA FILA · 2 HOOKS AQUECENDO
          </p>
        </div>
        <Button size="lg" className="bg-primary hover:bg-primary/90 shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          NOVO REEL
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-card rounded-lg p-3 sm:p-4 border border-border shadow-soft min-w-0"
          >
            <p className="text-muted-foreground text-xs font-semibold uppercase mb-2 truncate">
              {metric.label} · {metric.period}
            </p>
            <p className="text-xl sm:text-2xl font-bold mb-1">{metric.value}</p>
            <p className="text-green-600 text-sm font-semibold">{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {recentFeatures.map((feature, idx) => (
          <div
            key={idx}
            className="bg-card rounded-lg p-3 sm:p-4 border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl text-primary shrink-0">{feature.icon}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Status */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground text-base sm:text-lg">
              Status de Conteúdo
            </h3>
            <span className="text-muted-foreground text-[10px] sm:text-xs shrink-0">ÚLTIMOS 30D</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-secondary/50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-primary">12</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Publicados
              </p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-secondary/50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-primary">8</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Em Rascunho</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-secondary/50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-primary">5</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Agendados</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-secondary/50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-primary">3</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Em Análise</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
