import { useState, useEffect } from "react";
import { Plus, LogOut, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchInstagramMetrics, fetchInstagramReels, validateInstagramToken, type InstagramReel } from "@/lib/instagram";

interface Props {
  workspaceId: string;
}

interface MetricCard {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
}

export function Analytics({ workspaceId }: Props) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricCard[] | null>(null);
  const [reels, setReels] = useState<InstagramReel[]>([]);

  // Verificar se já tem token salvo
  useEffect(() => {
    const savedConnection = localStorage.getItem("ig_connected");
    if (savedConnection === "true") {
      setIsConnected(true);
      loadInstagramData();
    }
  }, []);

  const loadInstagramData = async () => {
    try {
      const isValid = await validateInstagramToken();
      if (!isValid) {
        toast({
          title: "Token expirado",
          description: "Reconecte sua conta do Instagram",
          variant: "destructive",
        });
        handleDisconnect();
        return;
      }

      // Buscar métricas
      const igMetrics = await fetchInstagramMetrics();
      if (igMetrics) {
        setMetrics([
          { label: "VIEWS · 7D", value: `${(igMetrics.reelsViews / 1000).toFixed(1)}K`, change: "+162%", changePositive: true },
          { label: "SAVES · 7D", value: `${igMetrics.saves.toLocaleString()}`, change: "+71%", changePositive: true },
          { label: "COMENTÁRIOS · 7D", value: `${igMetrics.comments.toLocaleString()}`, change: "+44%", changePositive: true },
          { label: "COMPARTILHAMENTOS · 7D", value: `${(igMetrics.shares / 1000).toFixed(1)}K`, change: "+28%", changePositive: true },
          { label: "NOVOS SEGUIDORES · 7D", value: `${(igMetrics.growth7d / 1000).toFixed(1)}K`, change: "+18%", changePositive: true },
          { label: "VISITAS PERFIL · 7D", value: `${(igMetrics.profileVisits / 1000).toFixed(1)}K`, change: "+89%", changePositive: true },
        ]);
      }

      // Buscar reels
      const igReels = await fetchInstagramReels(5);
      if (igReels) {
        setReels(igReels);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do Instagram:", error);
      toast({
        title: "Erro",
        description: "Não conseguimos carregar os dados do Instagram",
        variant: "destructive",
      });
    }
  };

  const handleConnectInstagram = async () => {
    setIsLoading(true);
    try {
      const isValid = await validateInstagramToken();
      if (!isValid) {
        toast({
          title: "Erro",
          description: "Token do Instagram inválido ou expirado",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Salvar conexão
      localStorage.setItem("ig_connected", "true");
      setIsConnected(true);

      // Carregar dados
      await loadInstagramData();

      toast({
        title: "Conectado!",
        description: "Sua conta @koraflow.ia foi conectada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não conseguimos conectar à sua conta do Instagram",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("ig_connected");
    setIsConnected(false);
    setMetrics(null);
    setReels([]);
    toast({
      title: "Desconectado",
      description: "Sua conta do Instagram foi desconectada",
    });
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm">
              Conecte sua conta do Instagram para ver os dados em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-6xl">📱</div>
            <h2 className="text-2xl font-bold">Conectar Instagram</h2>
            <p className="text-muted-foreground">
              Acesse seus insights de views, saves, comentários e crescimento de seguidores em tempo real.
            </p>
            <Button
              size="lg"
              onClick={handleConnectInstagram}
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Conectar com Instagram
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            ÚLTIMOS 7 DIAS · @koraflow.ia
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Desconectar
        </Button>
      </div>

      {/* Main Metrics Grid */}
      {metrics ? (
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-all"
            >
              <p className="text-muted-foreground text-xs font-semibold uppercase mb-3">
                {metric.label}
              </p>
              <p className="text-3xl font-bold mb-1">{metric.value}</p>
              <p className={`text-sm font-semibold ${metric.changePositive ? "text-green-600" : "text-red-600"}`}>
                {metric.change}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-lg p-4 border border-border shadow-soft animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Top Heels */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
        <h3 className="font-semibold text-foreground text-lg mb-4">
          🔥 TOP 5 REELS · ÚLTIMOS 7 DIAS
        </h3>
        <div className="space-y-3">
          {reels.length > 0 ? (
            reels.map((reel, idx) => (
              <div
                key={reel.id}
                className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => window.open(reel.permalink, "_blank")}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm truncate">
                    {reel.caption || "Reel sem descrição"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {(reel.views / 1000).toFixed(0)}K views
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(reel.saves / 1000).toFixed(1)}K saves
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Carregando reels...</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
          <h4 className="font-semibold text-foreground mb-3">💡 O que funcionou</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Reels com hooks de "Para de fazer X"</li>
            <li>✓ Vídeos 15-30 segundos têm 40% mais saves</li>
            <li>✓ Horário ideal: 19h-21h em dias úteis</li>
          </ul>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
          <h4 className="font-semibold text-foreground mb-3">🎯 Próximos passos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>→ Testar mais CTA no final dos reels</li>
            <li>→ Aumentar frequência para 5x/semana</li>
            <li>→ Diversificar entre educação e entretenimento</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
