import { useState, useMemo } from "react";
import { Search, Copy, Share2, Trash2, Settings, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHooks } from "@/hooks/queries/useHooksQuery";
import { useHooksMutations } from "@/hooks/mutations/useHooksMutations";
import { hookNiches, hookTypes, typeColors } from "./hooks";
import { defaultAudience, calculateRelevance } from "./audience";
import { AudienceConfig } from "./AudienceConfig";
import { seedHooksToDatabase } from "@/lib/seedHooks";
import type { HookNiche, HookType } from "./hooks";
import type { CreateHookInput } from "@/types/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
}

interface NewHookForm {
  text: string;
  template: string;
  creator: string;
  creator_handle: string;
  type: HookType;
  niche: HookNiche;
}

const EMPTY_FORM: NewHookForm = {
  text: "",
  template: "",
  creator: "",
  creator_handle: "",
  type: "SWAP",
  niche: "IA",
};

export function HookVault({ workspaceId }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<HookNiche | "">("");
  const [selectedType, setSelectedType] = useState<HookType | "">("");
  const [minViews, setMinViews] = useState(0);
  const [sortByRelevance, setSortByRelevance] = useState(true);
  const [minRelevance, setMinRelevance] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [newHookOpen, setNewHookOpen] = useState(false);
  const [formData, setFormData] = useState<NewHookForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch hooks from Supabase
  const { data: hooks = [], isLoading } = useHooks(workspaceId);
  const { createHook, deleteHook } = useHooksMutations(workspaceId);

  const hooksWithRelevance = useMemo(() => {
    return hooks.map((hook) => ({
      hook,
      relevance: calculateRelevance(hook.text, defaultAudience),
    }));
  }, [hooks]);

  const filteredHooks = useMemo(() => {
    let result = hooksWithRelevance
      .filter((item) => {
        const hook = item.hook;
        const relevance = item.relevance;
        const matchesSearch =
          hook.text.toLowerCase().includes(searchInput.toLowerCase()) ||
          hook.creator.toLowerCase().includes(searchInput.toLowerCase());
        const matchesNiche = !selectedNiche || hook.niche === selectedNiche;
        const matchesType = !selectedType || hook.type === selectedType;
        const matchesViews = hook.views >= minViews * 1000;
        const matchesRelevance = relevance.score >= minRelevance;

        return (
          matchesSearch &&
          matchesNiche &&
          matchesType &&
          matchesViews &&
          matchesRelevance
        );
      });

    if (sortByRelevance) {
      result = result.sort((a, b) => b.relevance.score - a.relevance.score);
    }

    return result;
  }, [searchInput, selectedNiche, selectedType, minViews, sortByRelevance, minRelevance]);

  const handleUseHook = (hookText: string) => {
    navigator.clipboard.writeText(hookText);
  };

  const handleCreateHook = async () => {
    if (!formData.text.trim() || !formData.template.trim()) {
      return;
    }

    await createHook.mutateAsync({
      text: formData.text,
      template: formData.template,
      creator: formData.creator || "Você",
      creator_handle: formData.creator_handle || "@seu_usuario",
      type: formData.type,
      niche: formData.niche,
    } as CreateHookInput);

    setNewHookOpen(false);
    setFormData(EMPTY_FORM);
  };

  const handleDeleteHook = async () => {
    if (deleteId) {
      await deleteHook.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleSeedHooks = async () => {
    try {
      const result = await seedHooksToDatabase(workspaceId);
      if (result.success) {
        toast.success(`${result.count} hooks adicionados com sucesso!`);
      } else {
        toast.info("Hooks já foram adicionados anteriormente");
      }
    } catch (error) {
      toast.error("Erro ao adicionar hooks");
      console.error(error);
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 dark:bg-green-950/30";
    if (score >= 60) return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
    if (score >= 40) return "text-amber-600 bg-amber-50 dark:bg-amber-950/30";
    return "text-gray-600 bg-gray-50 dark:bg-gray-950/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {hooks.length} hooks · buscável
          </h1>
          <p className="text-muted-foreground text-sm">
            +17 ESSA SEMANA · Auto-atualização ativa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setConfigOpen(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurar Audiência
          </Button>
          <Button
            size="lg"
            onClick={() => setNewHookOpen(true)}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Hook
          </Button>
        </div>
      </div>

      {/* Audience Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm">
          <span className="font-semibold">Sua Audiência:</span> {defaultAudience.description}
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {defaultAudience.segments.map((seg) => (
            <span
              key={seg}
              className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded"
            >
              {seg}
            </span>
          ))}
        </div>
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
        <div className="grid grid-cols-4 gap-3">
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
              <option value="">Todos</option>
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
              <option value="">Todos</option>
              {hookTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Relevance Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Relevância
            </label>
            <select
              value={minRelevance}
              onChange={(e) => setMinRelevance(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="0">Qualquer uma</option>
              <option value="40">40%+</option>
              <option value="60">60%+</option>
              <option value="80">80%+</option>
            </select>
          </div>

          {/* Sort */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Ordenar por
            </label>
            <select
              value={sortByRelevance ? "relevance" : "views"}
              onChange={(e) => setSortByRelevance(e.target.value === "relevance")}
              className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="relevance">Relevância</option>
              <option value="views">Mais Views</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchInput || selectedNiche || selectedType || minRelevance > 0) && (
          <button
            onClick={() => {
              setSearchInput("");
              setSelectedNiche("");
              setSelectedType("");
              setMinRelevance(0);
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
        {filteredHooks.length !== hooks.length && ` (de ${hooks.length})`}
      </div>

      {/* Hooks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Carregando hooks...</p>
          </div>
        ) : filteredHooks.length > 0 ? (
          filteredHooks.map(({ hook, relevance }) => (
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

                {/* Relevance & Reasons */}
                <div className="bg-secondary/50 rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${getRelevanceColor(
                        relevance.score
                      )}`}
                    >
                      Relevância: {relevance.score}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {relevance.reasons.map((reason, idx) => (
                      <p key={idx}>✓ {reason}</p>
                    ))}
                  </div>
                  {relevance.suggestedAdaptation && (
                    <div className="mt-2 text-xs bg-primary/10 text-primary p-2 rounded border-l-2 border-primary">
                      <strong>Sugestão:</strong> {relevance.suggestedAdaptation}
                    </div>
                  )}
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
                      onClick={() => handleUseHook(hook.text)}
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
                          onClick: () => setDeleteId(hook.id),
                          variant: "destructive",
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : hooks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-4">
            <p>Nenhum hook no banco de dados</p>
            <p className="text-xs">Adicione hooks manualmente ou importe nossos modelos</p>
            <Button onClick={handleSeedHooks} className="mt-4">
              + Importar 20 Hooks Iniciais
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum hook encontrado com esses filtros</p>
            <p className="text-xs mt-2">Tente ajustar sua busca ou relevância</p>
          </div>
        )}
      </div>

      {/* New Hook Dialog */}
      <Dialog open={newHookOpen} onOpenChange={setNewHookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Hook</DialogTitle>
            <DialogDescription>
              Adicione um novo hook ao seu banco de dados
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hook Text *</Label>
              <Textarea
                placeholder='Ex: "Para de fazer [X]. Começa a fazer [Y]."'
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Template *</Label>
              <Input
                placeholder='Ex: "Para de fazer [X]. Começa a fazer [Y]."'
                value={formData.template}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, template: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, type: v as HookType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hookTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Nicho *</Label>
                <Select
                  value={formData.niche}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, niche: v as HookNiche }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hookNiches.map((niche) => (
                      <SelectItem key={niche} value={niche}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Criador Original</Label>
              <Input
                placeholder='Ex: "Dan Koe"'
                value={formData.creator}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, creator: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Handle do Criador</Label>
              <Input
                placeholder='Ex: "@dan_koe"'
                value={formData.creator_handle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    creator_handle: e.target.value,
                  }))
                }
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewHookOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateHook}
              disabled={
                !formData.text.trim() ||
                !formData.template.trim() ||
                createHook.isPending
              }
            >
              {createHook.isPending ? "Criando..." : "Criar Hook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Hook"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleDeleteHook}
      />

      {/* Audience Config Modal */}
      <AudienceConfig isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}
