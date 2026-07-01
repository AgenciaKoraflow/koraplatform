import { Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

export function Agendador({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-green-500" />
          Agendador
        </h2>
        <p className="text-muted-foreground">
          Agende suas publicações com antecedência
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agendar Publicação
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Nenhuma publicação agendada</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Organize seu calendário de publicações para a semana
        </p>
      </div>
    </div>
  );
}
