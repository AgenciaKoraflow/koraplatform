import { BarChart3, TrendingUp } from "lucide-react";

interface Props {
  workspaceId: string;
}

export function Analytics({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Analytics
        </h2>
        <p className="text-muted-foreground">
          Métricas de desempenho e engajamento de seus conteúdos
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <TrendingUp className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Nenhum dado disponível</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Seus conteúdos serão analisados em tempo real
        </p>
      </div>
    </div>
  );
}
