import { Plus, Search, Copy, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/shared/ActionMenu";

interface Props {
  workspaceId: string;
}

interface Hook {
  id: string;
  text: string;
  category: "SWAP" | "BUILD" | "CLAIM" | "LIST" | "CONTRARIAN";
  uses: number;
  color: string;
}

const hookCategories: Record<Hook["category"], string> = {
  SWAP: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  BUILD: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  CLAIM: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  LIST: "text-green-600 bg-green-50 dark:bg-green-950/30",
  CONTRARIAN: "text-red-600 bg-red-50 dark:bg-red-950/30",
};

const mockHooks: Hook[] = [
  {
    id: "1",
    text: '"Para de fazer [X]. Começa a fazer [Y]."',
    category: "SWAP",
    uses: 38,
    color: "blue",
  },
  {
    id: "2",
    text: '"Construí [PRODUTO] em [TEMPO]."',
    category: "BUILD",
    uses: 24,
    color: "orange",
  },
  {
    id: "3",
    text: '"Você precisa de [FERRAMENTA]. Eis o porquê."',
    category: "CLAIM",
    uses: 19,
    color: "purple",
  },
  {
    id: "4",
    text: '"[NÚMERO] coisas que eu queria saber antes de [X]."',
    category: "LIST",
    uses: 15,
    color: "green",
  },
  {
    id: "5",
    text: '"Ninguém tá falando de [TENDÊNCIA]."',
    category: "CONTRARIAN",
    uses: 12,
    color: "red",
  },
];

export function HookVault({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">482 hooks · buscável</h1>
          <p className="text-muted-foreground text-sm">
            +17 ESSA SEMANA
          </p>
        </div>
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          NOVO HOOK
        </Button>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar hooks..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Hooks List */}
      <div className="space-y-3">
        {mockHooks.map((hook) => (
          <div
            key={hook.id}
            className="bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-foreground mb-2">{hook.text}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded ${
                      hookCategories[hook.category]
                    }`}
                  >
                    {hook.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{hook.uses}×</p>
                </div>
                <ActionMenu
                  items={[
                    {
                      label: "Copiar",
                      icon: Copy,
                      onClick: () => console.log("Copy"),
                    },
                    {
                      label: "Deletar",
                      icon: Trash2,
                      onClick: () => console.log("Delete"),
                      variant: "destructive",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
