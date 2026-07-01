import { useState, useEffect } from "react";
import { Plus, LogOut, Loader, Heart, MessageCircle, Share2, Bookmark, Eye, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchCompleteInstagramReport, validateInstagramToken, type InstagramCompleteReport, type InstagramMedia } from "@/lib/instagram";

interface Props {
  workspaceId: string;
}

export function Analytics({ workspaceId }: Props) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<InstagramCompleteReport | null>(null);

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

      const completeReport = await fetchCompleteInstagramReport();
      if (completeReport) {
        setReport(completeReport);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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

      localStorage.setItem("ig_connected", "true");
      setIsConnected(true);
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
    setReport(null);
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
              Conecte sua conta do Instagram para ver relatórios completos
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-6xl">📱</div>
            <h2 className="text-2xl font-bold">Conectar Instagram</h2>
            <p className="text-muted-foreground">
              Acesse insights completos: views, saves, comentários, alcance, perfil e muito mais.
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

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados do Instagram...</p>
          </div>
        </div>
      </div>
    );
  }

  const topMedia = [...report.media].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const avgLikes = report.media.length > 0 ? Math.floor(report.engagement.totalLikes / report.media.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            📊 @{report.account.username} • {report.account.followers.toLocaleString()} followers
          </p>
        </div>
        <Button variant="outline" onClick={handleDisconnect} className="gap-2">
          <LogOut className="w-4 h-4" />
          Desconectar
        </Button>
      </div>

      {/* Account Summary Card */}
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-6 border border-pink-500/20 space-y-3">
        <div className="flex items-start gap-4">
          <img
            src={report.account.profilePictureUrl}
            alt={report.account.username}
            className="w-16 h-16 rounded-full border-2 border-pink-500/30"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold">{report.account.name}</h2>
            <p className="text-sm text-muted-foreground">{report.account.biography}</p>
            {report.account.website && (
              <a
                href={report.account.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-500 hover:underline mt-1 block"
              >
                {report.account.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Seguidores</p>
          <p className="text-3xl font-bold">{report.account.followers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Perfil</p>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Posts</p>
          <p className="text-3xl font-bold">{report.media.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Alcance Semanal</p>
          <p className="text-3xl font-bold">{report.insights.reachWeekly.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Visualizações</p>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border shadow-soft">
          <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Taxa Engajamento</p>
          <p className="text-3xl font-bold">{report.engagement.engagementRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Interações</p>
        </div>
      </div>

      {/* Engagement Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <p className="text-xs font-semibold text-muted-foreground">CURTIDAS TOTAIS</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{report.engagement.totalLikes.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">~{avgLikes} por post</p>
        </div>

        <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold text-muted-foreground">COMENTÁRIOS</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{report.engagement.totalComments.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>

        <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-500" />
            <p className="text-xs font-semibold text-muted-foreground">SALVOS</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{report.engagement.totalSaves.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>

        <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-semibold text-muted-foreground">COMPARTILHAMENTOS</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{report.engagement.totalShares.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Top 5 Posts */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-foreground text-lg">🔥 TOP 5 POSTS</h3>
        </div>

        <div className="space-y-3">
          {topMedia.map((media, idx) => (
            <a
              key={media.id}
              href={media.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                #{idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm line-clamp-2 group-hover:text-pink-500 transition-colors">
                  {media.caption}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(media.timestamp).toLocaleDateString("pt-BR")} • {media.mediaType === "VIDEO" ? "📹 Vídeo" : media.mediaType === "CAROUSEL_ALBUM" ? "📸 Carrossel" : "🖼️ Imagem"}
                </p>
              </div>

              <div className="flex items-center gap-4 text-right flex-shrink-0">
                <div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    <p className="text-sm font-bold text-foreground">{media.likes.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MessageCircle className="w-3 h-3 text-blue-500" />
                    <p className="text-xs text-muted-foreground">{media.comments}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-purple-500" />
                    <p className="text-sm font-bold text-foreground">{media.saved}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Eye className="w-3 h-3 text-amber-500" />
                    <p className="text-xs text-muted-foreground">{(media.views / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* All Media List */}
      {report.media.length > 5 && (
        <div className="bg-card rounded-lg p-6 border border-border shadow-soft space-y-4">
          <h3 className="font-semibold text-foreground text-lg">📋 TODOS OS POSTS ({report.media.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {report.media.map((media) => (
              <a
                key={media.id}
                href={media.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-secondary/20 rounded hover:bg-secondary/40 transition-colors text-sm"
              >
                <p className="text-foreground truncate flex-1 text-xs">{media.caption}</p>
                <div className="flex items-center gap-3 text-right flex-shrink-0 text-xs">
                  <span className="text-red-500">❤️ {media.likes}</span>
                  <span className="text-blue-500">💬 {media.comments}</span>
                  <span className="text-purple-500">📌 {media.saved}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
