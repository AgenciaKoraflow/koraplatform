import { BarChart3, TrendingUp } from "lucide-react";

interface Props {
  workspaceId: string;
}

interface TopHeater {
  text: string;
  views: number;
  growth: string;
}

const topHeaters: TopHeater[] = [
  {
    text: '"Você precisa de um painel de conteúdo..."',
    views: 187,
    growth: "+ 312 %",
  },
  {
    text: '"Para de usar Notion pra conteúdo"',
    views: 94,
    growth: "+ 201 %",
  },
  {
    text: '"Como criei um comando /script"',
    views: 52,
    growth: "+ 148 %",
  },
  {
    text: '"A maioria dos criadores fica sem ideia"',
    views: 38,
    growth: "+ 92 %",
  },
];

export function Analytics({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Métricas de Desempenho</h1>
          <p className="text-muted-foreground text-sm">
            ÚLTIMOS 7 DIAS
          </p>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">
            VIEWS IG · 7D
          </p>
          <p className="text-2xl font-bold mb-1">287.4K</p>
          <p className="text-green-600 text-sm font-semibold">+162%</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">
            SAVES · 7D
          </p>
          <p className="text-2xl font-bold mb-1">4.812</p>
          <p className="text-green-600 text-sm font-semibold">+71%</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">
            VISITAS PERFIL
          </p>
          <p className="text-2xl font-bold mb-1">12.6K</p>
          <p className="text-green-600 text-sm font-semibold">+44%</p>
        </div>
      </div>

      {/* Top Heaters */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
        <h3 className="font-semibold text-foreground text-lg mb-4">
          TOP 5 HEATERS · ÚLTIMOS 7 DIAS
        </h3>
        <div className="space-y-3">
          {topHeaters.map((heater, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
            >
              <p className="text-foreground text-sm flex-1">{heater.text}</p>
              <div className="text-right ml-4">
                <p className="font-semibold text-primary text-lg">
                  {heater.views}K
                </p>
                <p className="text-green-600 text-xs font-semibold">
                  {heater.growth}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
