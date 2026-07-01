import { Plus, Search, Tag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

export function HookVault({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          Hook Vault
        </h2>
        <p className="text-muted-foreground">
          Banco de dados de hooks e chamativos para seus conteúdos
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar hooks..."
            className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Hook
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Tag className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Nenhum hook cadastrado</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Comece adicionando hooks que funcionam bem com seu público
        </p>
      </div>
    </div>
  );
}
