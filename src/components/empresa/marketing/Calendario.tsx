import { Calendar } from "lucide-react";

interface Props {
  workspaceId: string;
}

export function Calendario({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red-500" />
          Calendário Editorial
        </h2>
        <p className="text-muted-foreground">
          Visualize seu plano de conteúdo em formato de calendário
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Calendar className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Calendário vazio</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Seu calendário editorial aparecerá aqui
        </p>
      </div>
    </div>
  );
}
