import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

export function Concorrentes({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-violet-500" />
          Concorrentes
        </h2>
        <p className="text-muted-foreground">
          Monitore e analise a estratégia de conteúdo de seus concorrentes
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar concorrentes..."
            className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Concorrente
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Nenhum concorrente monitorado</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Adicione concorrentes para acompanhar suas estratégias
        </p>
      </div>
    </div>
  );
}
