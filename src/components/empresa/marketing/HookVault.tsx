import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Copy, Share2, Trash2, Settings, Zap, Plus, Calendar, Sparkles, BookOpen } from "lucide-react";
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
import { hookNiches, hookTypes, typeColors, hookTypeLabels, contentTypes, visualModes, contentTypeLabels, visualModeLabels } from "./hooks";
import { defaultAudience, calculateRelevance } from "./audience";
import { AudienceConfig } from "./AudienceConfig";
import { seed150HooksNew } from "@/lib/seed150HooksNew";
import type { HookNiche, HookType, ContentType, VisualMode } from "./hooks";
import type { CreateHookInput } from "@/types/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
}

interface NewHookForm {
  text: string;
  template: string;
  type: HookType;
  niche: HookNiche;
}

// Map verticals in database to display
const verticalNameMap: Record<string, string> = {
  "Automação": "agent",
  "Dev": "dev",
  "Studio": "studio",
};

// Map niches to verticals
const verticalMap: Record<Vertical, string[]> = {
  agent: ["Automação"],
  dev: ["Dev"],
  studio: ["Studio"],
};

const verticalLabels: Record<Vertical, string> = {
  agent: "🤖 Agentes de IA",
  dev: "💻 Desenvolvimento",
  studio: "🎨 Studio Criativo",
};

const EMPTY_FORM: NewHookForm = {
  text: "",
  template: "",
  type: "SWAP",
  niche: "IA",
};

type Vertical = "agent" | "dev" | "studio";

export function HookVault({ workspaceId }: Props) {
  const [activeVertical, setActiveVertical] = useState<Vertical>("agent");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPainPoint, setSelectedPainPoint] = useState<string>("");
  const [selectedEmotionalTrigger, setSelectedEmotionalTrigger] = useState<string>("");
  const [configOpen, setConfigOpen] = useState(false);
  const [newHookOpen, setNewHookOpen] = useState(false);
  const [formData, setFormData] = useState<NewHookForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedHookToSchedule, setSelectedHookToSchedule] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("19:00");
  const [contentType, setContentType] = useState<"Reel" | "Stories" | "Carrossel" | "Post">("Reel");

  // Fetch hooks from Supabase
  const { data: hooks = [], isLoading } = useHooks(workspaceId);
  const { createHook, deleteHook } = useHooksMutations(workspaceId);
  const queryClient = useQueryClient();

  // Extract unique pain points and emotional triggers
  const uniquePainPoints = useMemo(
    () => Array.from(new Set(hooks.map((h) => h.painPoint).filter(Boolean))).sort(),
    [hooks]
  );
  const uniqueEmotionalTriggers = useMemo(
    () => Array.from(new Set(hooks.map((h) => h.emotionalTrigger).filter(Boolean))).sort(),
    [hooks]
  );

  const hooksWithRelevance = useMemo(() => {
    return hooks.map((hook) => ({
      hook,
      relevance: calculateRelevance(hook.text, defaultAudience),
    }));
  }, [hooks]);

  const filteredHooks = useMemo(() => {
    const verticalNames = verticalMap[activeVertical];

    let result = hooksWithRelevance
      .filter((item) => {
        const hook = item.hook;

        // Filter by vertical
        const matchesVertical = verticalNames.includes(hook.vertical);

        // Filter by search
        const matchesSearch =
          hook.text.toLowerCase().includes(searchInput.toLowerCase()) ||
          hook.painPoint?.toLowerCase().includes(searchInput.toLowerCase()) ||
          hook.emotionalTrigger?.toLowerCase().includes(searchInput.toLowerCase()) ||
          hook.format?.toLowerCase().includes(searchInput.toLowerCase());

        // Filter by pain point and emotional trigger
        const matchesPainPoint = !selectedPainPoint || hook.painPoint?.toLowerCase().includes(selectedPainPoint.toLowerCase());
        const matchesEmotionalTrigger = !selectedEmotionalTrigger || hook.emotionalTrigger?.toLowerCase().includes(selectedEmotionalTrigger.toLowerCase());

        return matchesVertical && matchesSearch && matchesPainPoint && matchesEmotionalTrigger;
      });

    // Always sort by relevance
    result = result.sort((a, b) => b.relevance.score - a.relevance.score);

    return result;
  }, [searchInput, selectedPainPoint, selectedEmotionalTrigger, hooksWithRelevance, activeVertical]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchInput, selectedPainPoint, selectedEmotionalTrigger, activeVertical]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredHooks.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHooks = filteredHooks.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleUseHook = (hook: typeof hooks[0]) => {
    const content = `
🎯 HOOK
${hook.text}

📋 TEMPLATE
${hook.template}

🎯 DOR QUE RESOLVE
${hook.painPoint || "N/A"}

💭 GATILHO EMOCIONAL
${hook.emotionalTrigger || "N/A"}

📱 TIPO DE CONTEÚDO
${hook.contentType || "N/A"}

🎨 MODO VISUAL
${hook.visualMode || "N/A"}

🏷️ NICHO
${hook.niche}

👤 CRIADOR
${hook.creator} (${hook.creatorHandle})
`.trim();

    navigator.clipboard.writeText(content);
    toast.success("✅ Hook completo copiado! Use em Canva, CapCut, etc.");
  };

  const handleOpenScheduleModal = (hook: typeof hooks[0]) => {
    setSelectedHookToSchedule(hook);
    setScheduleDate("");
    setScheduleTime("19:00");
    setContentType("Reel");
    setScheduleModalOpen(true);
  };

  const handleSchedulePost = () => {
    if (!scheduleDate || !selectedHookToSchedule) {
      toast.error("Selecione uma data para agendar");
      return;
    }

    const scheduledPost = {
      id: Date.now().toString(),
      date: scheduleDate,
      time: scheduleTime,
      platforms: ["instagram"],
      contentType: contentType,
      caption: selectedHookToSchedule.text,
      hook: selectedHookToSchedule.text,
      painPoint: selectedHookToSchedule.painPoint,
      emotionalTrigger: selectedHookToSchedule.emotionalTrigger,
      angle: "",
      cta: "",
      status: "scheduled",
    };

    // Salvar no localStorage
    const existingPosts = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
    existingPosts.push(scheduledPost);
    localStorage.setItem("scheduledPosts", JSON.stringify(existingPosts));

    toast.success(`📅 Post agendado para ${scheduleDate}! Veja no Calendário.`);
    setScheduleModalOpen(false);
  };

  const handleCreateHook = async () => {
    if (!formData.text.trim() || !formData.template.trim()) {
      return;
    }

    await createHook.mutateAsync({
      text: formData.text,
      template: formData.template,
      creator: "Sistema",
      creator_handle: "@sistema",
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
      await seed150HooksNew(workspaceId);
      await queryClient.invalidateQueries({ queryKey: ["hooks", workspaceId] });
      toast.success(`✅ 150 hooks novos importados com sucesso!`);
    } catch (error) {
      toast.error("Erro ao importar hooks");
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
            {hooks.length} hooks · Biblioteca por Vertical
          </h1>
          <p className="text-muted-foreground text-sm">
            150 hooks organizados em 3 verticais: Agentes de IA, Desenvolvimento e Studio Criativo
          </p>
        </div>
      </div>

      {/* Vertical Selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(verticalLabels) as Vertical[]).map((vertical) => (
          <button
            key={vertical}
            onClick={() => {
              setActiveVertical(vertical);
              setSearchInput("");
              setSelectedPainPoint("");
              setSelectedEmotionalTrigger("");
            }}
            className={cn(
              "px-4 py-2.5 rounded-lg font-semibold transition-all border",
              activeVertical === vertical
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:border-primary/50"
            )}
          >
            {verticalLabels[vertical]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
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

        {/* Library Actions */}
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="outline"
            onClick={handleSeedHooks}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Importar Hooks (150)
          </Button>
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
          <div className="grid grid-cols-2 gap-3">
            {/* Pain Point Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                🎯 Dor que resolve
              </label>
              <select
                value={selectedPainPoint}
                onChange={(e) => setSelectedPainPoint(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todas as dores</option>
                {uniquePainPoints.map((pain) => (
                  <option key={pain} value={pain}>
                    {pain}
                  </option>
                ))}
              </select>
            </div>

            {/* Emotional Trigger Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                💭 Gatilho emocional
              </label>
              <select
                value={selectedEmotionalTrigger}
                onChange={(e) => setSelectedEmotionalTrigger(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todos os gatilhos</option>
                {uniqueEmotionalTriggers.map((trigger) => (
                  <option key={trigger} value={trigger}>
                    {trigger}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchInput || selectedPainPoint || selectedEmotionalTrigger) && (
            <button
              onClick={() => {
                setSearchInput("");
                setSelectedPainPoint("");
                setSelectedEmotionalTrigger("");
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Results Count & Pagination Info */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredHooks.length} hook{filteredHooks.length !== 1 ? "s" : ""} encontrado na vertical {verticalLabels[activeVertical]}
            {filteredHooks.length !== hooks.length && ` (de ${hooks.length} total)`}
          </div>
          {filteredHooks.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
          )}
        </div>

        {/* Hooks List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p>Carregando hooks...</p>
            </div>
          ) : paginatedHooks.length > 0 ? (
            paginatedHooks.map(({ hook, relevance }) => (
              <div
              key={hook.id}
              className="bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-all"
            >
              {/* 5 COLUNAS - MINIMALISTA */}
              <div className="space-y-4">
                {/* LINHA 1: Hook */}
                <div className="pl-3 border-l border-primary/20">
                  <p className="text-xs font-semibold text-primary/60 uppercase tracking-wide mb-2">Hook</p>
                  <p className="text-sm text-foreground leading-relaxed">"{hook.text}"</p>
                </div>

                {/* LINHA 2: Formato + Dor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="pl-3 border-l border-purple-500/20">
                    <p className="text-xs font-semibold text-purple-600/60 dark:text-purple-400/60 uppercase tracking-wide mb-2">Formato</p>
                    <p className="text-sm text-foreground font-medium">{hook.format || "—"}</p>
                  </div>
                  <div className="pl-3 border-l border-red-500/20">
                    <p className="text-xs font-semibold text-red-600/60 dark:text-red-400/60 uppercase tracking-wide mb-2">Dor que Resolve</p>
                    <p className="text-sm text-foreground">{hook.painPoint || "—"}</p>
                  </div>
                </div>

                {/* LINHA 3: Gatilho Emocional */}
                <div className="pl-3 border-l border-orange-500/20">
                  <p className="text-xs font-semibold text-orange-600/60 dark:text-orange-400/60 uppercase tracking-wide mb-2">Gatilho Emocional</p>
                  <p className="text-sm text-foreground">{hook.emotionalTrigger || "—"}</p>
                </div>

                {/* LINHA 4: Roteiro */}
                <div className="pl-3 border-l border-green-500/20">
                  <p className="text-xs font-semibold text-green-600/60 dark:text-green-400/60 uppercase tracking-wide mb-2">Roteiro de Execução</p>
                  <p className="text-sm text-foreground italic text-muted-foreground">{hook.roteiro || "—"}</p>
                </div>

                {/* AÇÕES */}
                <div className="flex gap-2 justify-start pt-3 border-t border-border/50">
                  <Button
                    size="sm"
                    onClick={() => handleUseHook(hook)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Usar este
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenScheduleModal(hook)}
                    className="gap-1"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : hooks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-4">
            <p>Nenhum hook no banco de dados</p>
            <p className="text-xs">Adicione hooks manualmente ou importe nossos modelos</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum hook encontrado com esses filtros</p>
            <p className="text-xs mt-2">Tente ajustar sua busca ou relevância</p>
          </div>
        )}
        </div>

        {/* Pagination */}
        {filteredHooks.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filteredHooks.length)} de {filteredHooks.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima →
            </Button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📅 Agendar Post no Instagram</DialogTitle>
            <DialogDescription>
              Defina quando este hook será postado
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {selectedHookToSchedule && (
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <p className="text-sm text-foreground font-medium">Hook: {selectedHookToSchedule.text.substring(0, 60)}...</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data do Post *</Label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora</Label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conteúdo</Label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Reel">📹 Reel</option>
                  <option value="Stories">📖 Stories</option>
                  <option value="Carrossel">📸 Carrossel</option>
                  <option value="Post">📄 Post</option>
                </select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSchedulePost} className="bg-primary hover:bg-primary/90 gap-2">
              <Calendar className="w-4 h-4" />
              Agendar Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        {hookTypeLabels[type]}
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
