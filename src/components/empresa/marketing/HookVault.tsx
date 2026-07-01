import { useState, useMemo } from "react";
import { Search, Copy, Share2, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { mockHooks, hookNiches, hookTypes, typeColors } from "./hooks";
import type { HookNiche, HookType } from "./hooks";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string;
}

export function HookVault({ workspaceId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<HookNiche | "">("");
  const [selectedType, setSelectedType] = useState<HookType | "">("");
  const [minViews, setMinViews] = useState(0);

  const filteredHooks = useMemo(() => {
    return mockHooks.filter((hook) => {
      const matchesSearch =
        hook.text.toLowerCase().includes(searchInput.toLowerCase()) ||
        hook.creator.toLowerCase().includes(searchInput.toLowerCase());
      const matchesNiche = !selectedNiche || hook.niche === selectedNiche;
      const matchesType = !selectedType || hook.type === selectedType;
      const matchesViews = hook.views >= minViews * 1000;

      return matchesSearch && matchesNiche && matchesType && matchesViews;
    });
  }, [searchInput, selectedNiche, selectedType, minViews]);

  const handleUseHook = (hook: typeof mockHooks[0]) => {
    // Copia o hook para a área de transferência
    navigator.clipboard.writeText(hook.text);
    // Aqui você pode adicionar um toast ou navegação para /fewer-permission-prompts
    console.log("Hook copied:", hook.text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {mockHooks.length} hooks · buscável
          </h1>
          <p className="text-muted-foreground text-sm">
            +17 ESSA SEMANA
          </p>
        </div>
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          + NOVO HOOK
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4 bg-secondary/30 rounded-lg p-4 border border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar hook ou criador..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-3 gap-3">
          {/* Niche Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Nicho
            </label>
            <select
              value={selectedNiche}
              onChange={(e) =>
                setSelectedNiche((e.target.value as HookNiche) || "")
              }
              className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os nichos</option>
              {hookNiches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Tipo
            </label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType((e.target.value as HookType) || "")
              }
              className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os tipos</option>
              {hookTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Views Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Views mínimas (K)
            </label>
            <select
              value={minViews}
              onChange={(e) => setMinViews(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="0">Qualquer uma</option>
              <option value="100">100K+</option>
              <option value="300">300K+</option>
              <option value="500">500K+</option>
              <option value="800">800K+</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchInput || selectedNiche || selectedType || minViews > 0) && (
          <button
            onClick={() => {
              setSearchInput("");
              setSelectedNiche("");
              setSelectedType("");
              setMinViews(0);
            }}
            className="text-xs text-primary hover:underline font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredHooks.length} hook{filteredHooks.length !== 1 ? "s" : ""} encontrado
        {filteredHooks.length !== mockHooks.length && ` (de ${mockHooks.length})`}
      </div>

      {/* Hooks List */}
      <div className="space-y-3">
        {filteredHooks.length > 0 ? (
          filteredHooks.map((hook) => (
            <div
              key={hook.id}
              className="bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-all"
            >
              <div className="space-y-3">
                {/* Hook Text */}
                <div>
                  <p className="text-foreground font-medium leading-relaxed">
                    "{hook.text}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Template: {hook.template}
                  </p>
                </div>

                {/* Hook Info & Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Type Badge */}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded ${
                        typeColors[hook.type]
                      }`}
                    >
                      {hook.type}
                    </span>

                    {/* Niche Badge */}
                    <span className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded">
                      {hook.niche}
                    </span>

                    {/* Creator */}
                    <span className="text-xs text-muted-foreground">
                      por {hook.creatorHandle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Views & Uses */}
                    <div className="text-right text-xs">
                      <p className="font-bold text-primary">
                        {(hook.views / 1000).toFixed(0)}K views
                      </p>
                      {hook.timesUsed && (
                        <p className="text-muted-foreground">
                          Usado {hook.timesUsed}×
                        </p>
                      )}
                    </div>

                    {/* Use Button */}
                    <Button
                      size="sm"
                      onClick={() => handleUseHook(hook)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Usar este
                    </Button>

                    {/* More Actions */}
                    <ActionMenu
                      items={[
                        {
                          label: "Copiar",
                          icon: Copy,
                          onClick: () =>
                            navigator.clipboard.writeText(hook.text),
                        },
                        {
                          label: "Compartilhar",
                          icon: Share2,
                          onClick: () => console.log("Share"),
                        },
                        {
                          label: "Remover",
                          icon: Trash2,
                          onClick: () => console.log("Delete"),
                          variant: "destructive",
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum hook encontrado com esses filtros</p>
            <p className="text-xs mt-2">Tente ajustar sua busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
