import { useEffect, useState, useMemo } from "react";
import { Plus, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Hook } from "@/components/empresa/marketing/hooks";

interface Props {
  workspaceId: string;
}

const platforms = [
  { id: "instagram", name: "INSTAGRAM", color: "border-pink-500", bgHover: "hover:bg-pink-500/10" },
  { id: "tiktok", name: "TIKTOK", color: "border-black dark:border-white", bgHover: "hover:bg-black/10 dark:hover:bg-white/10" },
  { id: "youtube", name: "YT SHORTS", color: "border-red-500", bgHover: "hover:bg-red-500/10" },
];

export function Agendador({ workspaceId }: Props) {
  const { toast } = useToast();
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [angle, setAngle] = useState("");
  const [cta, setCta] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("07:30");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedHook");
    if (stored) {
      try {
        const hook = JSON.parse(stored) as Hook;
        setSelectedHook(hook);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduleDate(tomorrow.toISOString().split("T")[0]);
      } catch (error) {
        console.error("Erro ao carregar hook do sessionStorage:", error);
        toast({
          title: "Erro",
          description: "Não consegui carregar o hook selecionado",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const generatedCaption = useMemo(() => {
    if (!selectedHook) return "";

    let caption = selectedHook.text;

    if (angle) {
      caption += `\n\n💡 ${angle}`;
    }

    if (cta) {
      caption += `\n\n${cta}`;
    }

    return caption.trim();
  }, [selectedHook, angle, cta]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(generatedCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = () => {
    if (!selectedHook) {
      toast({
        title: "Erro",
        description: "Nenhum hook selecionado",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma plataforma",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleDate) {
      toast({
        title: "Erro",
        description: "Selecione uma data",
        variant: "destructive",
      });
      return;
    }

    const platformNames = selectedPlatforms
      .map((id) => platforms.find((p) => p.id === id)?.name)
      .join(", ");

    toast({
      title: "Agendado com sucesso! 🚀",
      description: `Seu conteúdo foi agendado para ${platformNames} em ${scheduleDate} às ${scheduleTime}`,
    });

    sessionStorage.removeItem("selectedHook");
  };

  if (!selectedHook) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Agendar Este Reel</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Nenhum hook selecionado</p>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 sm:p-8 border border-border shadow-soft flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-muted-foreground">Volte para Hook Vault e selecione um hook para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Agendar Este Reel</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Hook: <span className="text-foreground font-medium">{selectedHook.type}</span>
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleSchedule}
          className="bg-[#B8532E] hover:bg-[#B8532E]/90 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          AGENDAR TUDO
        </Button>
      </div>

      {/* Hook Selecionado */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft space-y-3">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Hook Base</h3>
        <p className="text-base text-foreground leading-relaxed">{selectedHook.text}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedHook.painPoint && (
            <span className="text-xs bg-[#B8532E]/10 text-[#B8532E] px-2 py-1 rounded">🎯 {selectedHook.painPoint}</span>
          )}
          {selectedHook.emotionalTrigger && (
            <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">💭 {selectedHook.emotionalTrigger}</span>
          )}
          {selectedHook.contentType && (
            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">{selectedHook.contentType}</span>
          )}
        </div>
      </div>

      {/* Ângulo e CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
            Seu Ângulo / Insight
          </label>
          <textarea
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Ex: Mostre como isso economizou tempo da sua equipe..."
            className="w-full h-24 px-3 py-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">Personalize o hook com seu contexto</p>
        </div>

        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
            Call-to-Action
          </label>
          <textarea
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Ex: Clique no link da bio para agendar sua demo..."
            className="w-full h-24 px-3 py-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">O que você quer que seu público faça?</p>
        </div>
      </div>

      {/* Legenda Gerada */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Legenda Gerada</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCaption}
            className="gap-2 self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
        <div className="bg-input rounded-lg p-4 border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {generatedCaption || "Preencha o ângulo e CTA para gerar a legenda..."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Conta de caracteres: {generatedCaption.length}
        </p>
      </div>

      {/* Platform Selection */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft">
        <h3 className="font-semibold text-foreground mb-4">
          Selecione as plataformas
        </h3>
        <div className="flex flex-wrap gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`px-4 py-2 rounded-lg border-2 ${platform.color} ${
                selectedPlatforms.includes(platform.id)
                  ? "bg-secondary/50 text-foreground"
                  : `bg-transparent text-foreground ${platform.bgHover}`
              } font-semibold transition-all`}
            >
              {selectedPlatforms.includes(platform.id) && "✓ "}
              {platform.name}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Form */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft">
        <h3 className="font-semibold text-foreground mb-4">Agendar para</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Data
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Hora
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
