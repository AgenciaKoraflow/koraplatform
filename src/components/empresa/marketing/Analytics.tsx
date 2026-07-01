import { useState } from "react";
import { Plus, LogOut, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  workspaceId: string;
}

interface MetricCard {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
}

const mockMetrics: MetricCard[] = [
  { label: "VIEWS · 7D", value: "287.4K", change: "+162%", changePositive: true },
  { label: "SAVES · 7D", value: "4.812", change: "+71%", changePositive: true },
  { label: "COMENTÁRIOS · 7D", value: "892", change: "+44%", changePositive: true },
  { label: "COMPARTILHAMENTOS · 7D", value: "1.2K", change: "+28%", changePositive: true },
  { label: "NOVOS SEGUIDORES · 7D", value: "3.4K", change: "+18%", changePositive: true },
  { label: "VISITAS PERFIL · 7D", value: "12.6K", change: "+89%", changePositive: true },
];

const mockHeaters = [
  { rank: 1, title: "Você precisa de um painel de conteúdo", views: 287400, saves: 4812 },
  { rank: 2, title: "Para de usar Notion pra conteúdo", views: 156800, saves: 3421 },
  { rank: 3, title: "Como criei um comando /script", views: 98900, saves: 2103 },
  { rank: 4, title: "A maioria dos criadores fica sem ideia", views: 76200, saves: 1892 },
  { rank: 5, title: "Você não sabe quanto vale seu tempo", views: 54300, saves: 987 },
];

export function Analytics({ workspaceId }: Props) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectInstagram = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar OAuth com Instagram
      // Por enquanto, apenas simular conexão
      setTimeout(() => {
        setIsConnected(true);
        toast({
          title: "Conectado!",
          description: "Sua conta do Instagram foi conectada com sucesso",
        });
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não conseguimos conectar à sua conta do Instagram",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
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
            ÚLTIMOS 7 DIAS · @fabianocarvalhojr
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
      <div className="grid grid-cols-3 gap-4">
        {mockMetrics.map((metric, idx) => (
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

      {/* Top Heaters */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft">
        <h3 className="font-semibold text-foreground text-lg mb-4">
          🔥 TOP 5 REELS · ÚLTIMOS 7 DIAS
        </h3>
        <div className="space-y-3">
          {mockHeaters.map((heater) => (
            <div
              key={heater.rank}
              className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">#{heater.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm truncate">
                  {heater.title}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {(heater.views / 1000).toFixed(0)}K views
                </p>
                <p className="text-xs text-muted-foreground">
                  {(heater.saves / 1000).toFixed(1)}K saves
                </p>
              </div>
            </div>
          ))}
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
