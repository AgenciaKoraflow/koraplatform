import { Flame } from "lucide-react";

interface Props {
  workspaceId: string;
}

interface Trend {
  id: string;
  title: string;
  type: "COM POTENCIAL" | "HOOK" | "EXPLICAR" | "PULAR";
  sources: number;
}

const mockTrends: Trend[] = [
  {
    id: "1",
    title: "Anthropic lança Claude 4.7, janela de 1M de contexto",
    type: "COM POTENCIAL",
    sources: 5,
  },
  {
    id: "2",
    title: "Benchmarks vazados do Sora 2 vs Veo 3",
    type: "HOOK",
    sources: 3,
  },
  {
    id: "3",
    title: "OpenAI lança nova faixa de API de imagem",
    type: "EXPLICAR",
    sources: 4,
  },
  {
    id: "4",
    title: "Vercel corta preço do AI gateway",
    type: "EXPLICAR",
    sources: 2,
  },
  {
    id: "5",
    title: "Mais uma startup lança um wrapper",
    type: "PULAR",
    sources: 1,
  },
];

const trendTypeColors: Record<Trend["type"], string> = {
  "COM POTENCIAL": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  HOOK: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  EXPLICAR: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  PULAR: "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
};

export function EmAlta({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Feed de hoje · 12 fontes</h1>
          <p className="text-muted-foreground text-sm">
            5 COM POTENCIAL
          </p>
        </div>
      </div>

      {/* Trends List */}
      <div className="space-y-3">
        {mockTrends.map((trend) => (
          <div
            key={trend.id}
            className="bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-foreground">{trend.title}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded ${
                      trendTypeColors[trend.type]
                    }`}
                  >
                    {trend.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {trend.sources} fonte{trend.sources > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
