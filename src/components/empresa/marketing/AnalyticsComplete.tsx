import { useState, useEffect } from "react";
import { Plus, LogOut, Loader, TrendingUp, Users, Zap, Globe, BarChart3, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchCompleteInstagramAnalytics, validateInstagramToken, type CompleteInstagramReport } from "@/lib/instagram-complete";

interface Props {
  workspaceId: string;
}

export function AnalyticsComplete({ workspaceId }: Props) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompleteInstagramReport | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "historical" | "content" | "audience">("overview");

  useEffect(() => {
    const savedConnection = localStorage.getItem("ig_connected");
    if (savedConnection === "true") {
      setIsConnected(true);
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const isValid = await validateInstagramToken();
      if (!isValid) {
        toast({ title: "Token expirado", description: "Reconecte sua conta", variant: "destructive" });
        handleDisconnect();
        return;
      }

      const analytics = await fetchCompleteInstagramAnalytics();
      if (analytics) {
        setReport(analytics);
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não conseguimos carregar os dados", variant: "destructive" });
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const isValid = await validateInstagramToken();
      if (!isValid) {
        toast({ title: "Erro", description: "Token inválido", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      localStorage.setItem("ig_connected", "true");
      setIsConnected(true);
      await loadData();
      toast({ title: "Conectado!", description: "@koraflow.ia conectada" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha na conexão", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("ig_connected");
    setIsConnected(false);
    setReport(null);
    toast({ title: "Desconectado", description: "Conta removida" });
  };

  if (!isConnected || !report) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Analytics Profissional</h1>
            <p className="text-muted-foreground text-sm">Painel completo com TODOS os dados do Instagram</p>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-sm">
              <div className="text-6xl">📊</div>
              <h2 className="text-2xl font-bold">Painel Profissional</h2>
              <p className="text-muted-foreground">Histórico completo, audiência, crescimento, tipos de conteúdo, tudo!</p>
              <Button
                size="lg"
                onClick={handleConnect}
                disabled={isLoading}
                className="bg-gradient-to-r from-pink-500 to-purple-500 gap-2"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isLoading ? "Conectando..." : "Conectar Instagram"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics Profissional</h1>
          <p className="text-muted-foreground text-sm">
            📊 @{report.account.username} • {report.account.followers.toLocaleString()} seguidores
          </p>
        </div>
        <Button variant="outline" onClick={handleDisconnect} className="gap-2">
          <LogOut className="w-4 h-4" />
          Desconectar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📈 Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("historical")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "historical"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📅 Histórico (Dia/Semana/Mês)
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "content"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🎬 Por Tipo de Conteúdo
        </button>
        <button
          onClick={() => setActiveTab("audience")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "audience"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          👥 Audiência
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-lg p-4 border border-pink-500/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">SEGUIDORES</p>
              <p className="text-2xl font-bold">{report.account.followers.toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-1">+{report.growth.newFollowers7d} (7d)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">POSTS</p>
              <p className="text-2xl font-bold">{report.account.totalPosts}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ALCANCE</p>
              <p className="text-2xl font-bold">{(report.metrics.reach.daily.reduce((sum, m) => sum + m.value, 0) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-green-500 mt-1">{report.growth.growthRate7d > 0 ? "+" : ""}{report.growth.growthRate7d.toFixed(1)}%</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ENGAJAMENTO</p>
              <p className="text-2xl font-bold">{report.engagement.engagementRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">{report.engagement.totalLikes.toLocaleString()} curtidas</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">VISITAS</p>
              <p className="text-2xl font-bold">{report.interactions.interactionsByType.profileVisits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Perfil</p>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500">❤️</span>
                <p className="text-xs font-semibold text-muted-foreground">CURTIDAS</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{report.engagement.totalLikes.toLocaleString()}</p>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-500">💬</span>
                <p className="text-xs font-semibold text-muted-foreground">COMENTÁRIOS</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{report.engagement.totalComments.toLocaleString()}</p>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-500">📌</span>
                <p className="text-xs font-semibold text-muted-foreground">SALVOS</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{report.engagement.totalSaves.toLocaleString()}</p>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">↗️</span>
                <p className="text-xs font-semibold text-muted-foreground">COMPARTILHADOS</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{report.engagement.totalShares.toLocaleString()}</p>
            </div>
          </div>

          {/* Top 5 Posts */}
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h3 className="font-semibold text-lg">🔥 TOP 5 POSTS</h3>
            <div className="space-y-2">
              {report.topPosts.map((post, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/30 rounded hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-bold text-pink-500">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{post.caption}</p>
                    <p className="text-xs text-muted-foreground">{post.date} • {post.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">❤️ {post.likes}</p>
                    <p className="text-xs text-muted-foreground">Engagement: {(post.engagementRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTÓRICO */}
      {activeTab === "historical" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">📈 Alcance por Dia</h3>
              <div className="space-y-2">
                {report.metrics.reach.daily.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-primary/30 rounded" style={{ width: `${Math.min((day.value / 150) * 100, 100)}%` }} />
                      <span className="text-sm font-bold text-foreground">{day.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">🔗 Cliques no Website</h3>
              <div className="space-y-2">
                {report.metrics.websiteClicks.daily.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    <span className="text-sm font-bold text-amber-500">{day.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">📊 Alcance por Semana</h3>
              <div className="space-y-2">
                {report.metrics.reach.weekly.map((week, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">Semana {idx + 1}</span>
                    <span className="text-sm font-bold text-foreground">{week.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">📅 Visitas de Perfil</h3>
              <div className="space-y-2">
                {report.metrics.profileViews.daily.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    <span className="text-sm font-bold text-cyan-500">{day.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTEÚDO */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {report.contentByType.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Sem dados de conteúdo disponíveis</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {report.contentByType.map((content) => (
                <div key={content.type} className="bg-card rounded-lg p-6 border border-border space-y-4">
                  <h3 className="font-semibold text-lg">
                    {content.type === "REEL" && "📹"} {content.type === "POST" && "📸"} {content.type === "CAROUSEL" && "📷"} {content.type}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de posts</span>
                      <span className="font-bold text-foreground">{content.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de curtidas</span>
                      <span className="font-bold text-red-500">{content.totalLikes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de comentários</span>
                      <span className="font-bold text-blue-500">{content.totalComments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de salvos</span>
                      <span className="font-bold text-purple-500">{content.totalSaves}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Engajamento médio</span>
                      <span className="font-bold text-foreground">{content.avgEngagement.toFixed(0)}</span>
                    </div>
                  </div>

                  {content.topPost && (
                    <div className="bg-secondary/30 rounded p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Top post</p>
                      <p className="text-sm text-foreground">{content.topPost.caption}</p>
                      <p className="text-xs text-pink-500">❤️ {content.topPost.likes} curtidas</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIÊNCIA */}
      {activeTab === "audience" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Países */}
            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">🌍 Principais Países</h3>
              <div className="space-y-3">
                {report.audience.topCountries.map((country) => (
                  <div key={country.country} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground">{country.country}</span>
                      <span className="text-sm font-bold">{country.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${country.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gênero */}
            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">👥 Gênero</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground">🔵 Masculino</span>
                    <span className="text-sm font-bold">{report.audience.genderDistribution.male}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${report.audience.genderDistribution.male}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground">🔴 Feminino</span>
                    <span className="text-sm font-bold">{report.audience.genderDistribution.female}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: `${report.audience.genderDistribution.female}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Idade */}
            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">🎂 Faixa Etária</h3>
              <div className="space-y-2">
                {Object.entries(report.audience.ageDistribution).map(([age, percentage]) => (
                  <div key={age} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground">{age} anos</span>
                      <span className="text-sm font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cidades */}
            <div className="bg-card rounded-lg p-6 border border-border space-y-4">
              <h3 className="font-semibold text-lg">🏙️ Principais Cidades</h3>
              <div className="space-y-2">
                {report.audience.topCities.map((city) => (
                  <div key={city.city} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-foreground">{city.city}</span>
                    <span className="text-sm font-bold text-green-500">{city.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
