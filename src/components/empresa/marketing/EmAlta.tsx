import { Flame } from "lucide-react";

interface Props {
  workspaceId: string;
}

export function EmAlta({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          Em Alta
        </h2>
        <p className="text-muted-foreground">
          Tendências e tópicos em alta para capturar oportunidades
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Flame className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Nenhuma tendência carregada</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Acompanhe o que está em alta nas plataformas
        </p>
      </div>
    </div>
  );
}
