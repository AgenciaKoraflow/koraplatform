import { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  Loader,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Calendar,
  Settings,
  Clapperboard,
  Heart,
  MessageCircle,
  Bookmark,
  ArrowUpRight,
  Flame,
  Link2,
  Video,
  Camera,
  Images,
  Cake,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseInvokeError } from "@/lib/supabaseFunctions";
import { fetchCompleteInstagramAnalytics, validateInstagramToken, type CompleteInstagramReport } from "@/lib/instagram";

interface Props {
  workspaceId: string;
}

const EMPTY_CREDENTIAL_FORM = { appId: "", appSecret: "", accessToken: "", businessAccountId: "" };

export function AnalyticsComplete({ workspaceId }: Props) {
  const { toast } = useToast();
  const { isAdmin } = usePermissions();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompleteInstagramReport | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "historical" | "content" | "audience">("overview");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [credentialForm, setCredentialForm] = useState(EMPTY_CREDENTIAL_FORM);
  const [isSavingCredential, setIsSavingCredential] = useState(false);

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

  const handleSaveCredential = async () => {
    const { appId, appSecret, accessToken, businessAccountId } = credentialForm;
    if (!appId || !appSecret || !accessToken || !businessAccountId) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setIsSavingCredential(true);
    try {
      const { error } = await supabase.functions.invoke("instagram-credential", {
        body: { action: "connect", appId, appSecret, accessToken, businessAccountId },
      });
      if (error) throw new Error(await formatSupabaseInvokeError(error));

      toast({ title: "Credencial salva", description: "Token do Instagram atualizado com sucesso" });
      setCredentialDialogOpen(false);
      setCredentialForm(EMPTY_CREDENTIAL_FORM);
      await handleConnect();
    } catch (error) {
      toast({
        title: "Erro ao salvar credencial",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSavingCredential(false);
    }
  };

  const credentialDialog = (
    <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar credencial do Instagram</DialogTitle>
          <DialogDescription>
            Cole aqui o App ID, App Secret e o Access Token gerados no Meta for Developers. Esses valores ficam
            criptografados no banco e nunca são enviados ao navegador — só o servidor os usa para consultar a API.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ig-app-id">App ID</Label>
            <Input
              id="ig-app-id"
              value={credentialForm.appId}
              onChange={(e) => setCredentialForm((f) => ({ ...f, appId: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig-app-secret">App Secret</Label>
            <Input
              id="ig-app-secret"
              type="password"
              value={credentialForm.appSecret}
              onChange={(e) => setCredentialForm((f) => ({ ...f, appSecret: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig-access-token">Access Token</Label>
            <Input
              id="ig-access-token"
              type="password"
              value={credentialForm.accessToken}
              onChange={(e) => setCredentialForm((f) => ({ ...f, accessToken: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig-account-id">Business Account ID</Label>
            <Input
              id="ig-account-id"
              value={credentialForm.businessAccountId}
              onChange={(e) => setCredentialForm((f) => ({ ...f, businessAccountId: e.target.value }))}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCredentialDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveCredential} disabled={isSavingCredential}>
            {isSavingCredential ? <Loader className="w-4 h-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const getMetricsForPeriod = () => {
    if (!report) return null;

    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const reachData = report.metrics.reach.daily.slice(-days);
    const viewsData = report.metrics.views.daily.slice(-days);

    const reachSum = reachData.reduce((sum, m) => sum + m.value, 0);
    const viewsSum = viewsData.reduce((sum, m) => sum + m.value, 0);

    return {
      reach: reachSum,
      reachAvg: reachData.length > 0 ? Math.round(reachSum / reachData.length) : 0,
      views: viewsSum,
      viewsAvg: viewsData.length > 0 ? Math.round(viewsSum / viewsData.length) : 0,
      growthRate: report.growth.growthRate7d
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Math.round(num).toString();
  };

  if (!isConnected || !report) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Analytics Profissional</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Painel completo com TODOS os dados do Instagram</p>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[400px] px-4">
            <div className="text-center space-y-4 max-w-sm">
              <BarChart3 className="w-12 h-12 sm:w-14 sm:h-14 mx-auto text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold">Painel Profissional</h2>
              <p className="text-muted-foreground">Histórico completo, audiência, crescimento, tipos de conteúdo, tudo!</p>
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isLoading ? "Conectando..." : "Conectar Instagram"}
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => setCredentialDialogOpen(true)} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Gerenciar credencial
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
        )}
        {credentialDialog}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Analytics Profissional</h1>
          <p className="text-muted-foreground text-xs sm:text-sm truncate flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            @{report.account.username} • {report.account.followers.toLocaleString()} seguidores
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setCredentialDialogOpen(true)} className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Gerenciar credencial</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Desconectar</span>
          </Button>
        </div>
      </div>
      {credentialDialog}

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${activeTab === "overview"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("historical")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${activeTab === "historical"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Calendar className="w-4 h-4" />
          Histórico (Dia/Semana/Mês)
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${activeTab === "content"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Clapperboard className="w-4 h-4" />
          Por Tipo de Conteúdo
        </button>
        <button
          onClick={() => setActiveTab("audience")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${activeTab === "audience"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Users className="w-4 h-4" />
          Audiência
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Period Selector */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setPeriod("7d")}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${period === "7d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${period === "30d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => setPeriod("90d")}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${period === "90d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
            >
              Últimos 90 dias
            </button>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-primary/10 rounded-lg p-2.5 sm:p-4 border border-primary/20">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">SEGUIDORES</p>
              <p className="text-lg sm:text-2xl font-bold">{report.account.followers.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-green-600 mt-1">+{report.growth.newFollowers7d} (7d)</p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-2.5 sm:p-4 border border-border">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">POSTS</p>
              <p className="text-lg sm:text-2xl font-bold">{report.account.totalPosts}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Total</p>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-2.5 sm:p-4 border border-blue-500/20">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">ALCANCE ({period})</p>
              <p className="text-lg sm:text-2xl font-bold">{formatNumber(getMetricsForPeriod()?.reach ?? 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Média: {formatNumber(getMetricsForPeriod()?.reachAvg ?? 0)}/dia</p>
            </div>

            <div className="bg-green-500/10 rounded-lg p-2.5 sm:p-4 border border-green-500/20">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">VISUALIZAÇÕES ({period})</p>
              <p className="text-lg sm:text-2xl font-bold">{formatNumber(getMetricsForPeriod()?.views ?? 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Média: {formatNumber(getMetricsForPeriod()?.viewsAvg ?? 0)}/dia</p>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-card rounded-lg p-2.5 sm:p-4 border border-border">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Heart className="w-4 h-4 text-primary" />
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">CURTIDAS</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{report.engagement.totalLikes.toLocaleString()}</p>
            </div>

            <div className="bg-card rounded-lg p-2.5 sm:p-4 border border-border">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">COMENTÁRIOS</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{report.engagement.totalComments.toLocaleString()}</p>
            </div>

            <div className="bg-card rounded-lg p-2.5 sm:p-4 border border-border">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Bookmark className="w-4 h-4 text-primary" />
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">SALVOS</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{report.engagement.totalSaves.toLocaleString()}</p>
            </div>

            <div className="bg-card rounded-lg p-2.5 sm:p-4 border border-border">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <ArrowUpRight className="w-4 h-4 text-primary" />
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">COMPARTILHADOS</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{report.engagement.totalShares.toLocaleString()}</p>
            </div>
          </div>

          {/* Top 5 Posts */}
          <div className="bg-card rounded-lg p-3 sm:p-6 border border-border space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-lg flex items-center gap-1.5">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              TOP 5 POSTS
            </h3>
            <div className="space-y-2">
              {report.topPosts.map((post, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-secondary/30 rounded hover:bg-secondary/50 transition-colors">
                  <span className="text-xs sm:text-sm font-bold text-primary">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-foreground truncate">{post.caption}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{post.date} • {post.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-bold flex items-center gap-1 justify-end">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Engagement: {(post.engagementRate * 100).toFixed(1)}%</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                Alcance por Dia
              </h3>
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

            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Cliques no Website
              </h3>
              <div className="space-y-2">
                {report.metrics.websiteClicks.daily.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    <span className="text-sm font-bold text-primary">{day.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                Alcance por Semana
              </h3>
              <div className="space-y-2">
                {report.metrics.reach.weekly.map((week, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">Semana {idx + 1}</span>
                    <span className="text-sm font-bold text-foreground">{week.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Visitas de Perfil
              </h3>
              <div className="space-y-2">
                {report.metrics.profileViews.daily.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    <span className="text-sm font-bold text-primary">{day.value}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {report.contentByType.map((content) => (
                <div key={content.type} className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
                  <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                    {content.type === "REEL" && <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                    {content.type === "POST" && <Camera className="w-4 h-4 sm:w-5 sm:h-5" />}
                    {content.type === "CAROUSEL" && <Images className="w-4 h-4 sm:w-5 sm:h-5" />}
                    {content.type}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de posts</span>
                      <span className="font-bold text-foreground">{content.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de curtidas</span>
                      <span className="font-bold text-primary">{content.totalLikes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de comentários</span>
                      <span className="font-bold text-primary">{content.totalComments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de salvos</span>
                      <span className="font-bold text-primary">{content.totalSaves}</span>
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
                      <p className="text-xs text-primary flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {content.topPost.likes} curtidas
                      </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Países */}
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                Principais Países
              </h3>
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
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Gênero
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      Masculino
                    </span>
                    <span className="text-sm font-bold">{report.audience.genderDistribution.male}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${report.audience.genderDistribution.male}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                      Feminino
                    </span>
                    <span className="text-sm font-bold">{report.audience.genderDistribution.female}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                    <div className="h-full bg-primary/60" style={{ width: `${report.audience.genderDistribution.female}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Idade */}
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <Cake className="w-4 h-4 sm:w-5 sm:h-5" />
                Faixa Etária
              </h3>
              <div className="space-y-2">
                {Object.entries(report.audience.ageDistribution).map(([age, percentage]) => (
                  <div key={age} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground">{age} anos</span>
                      <span className="text-sm font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary/50 rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cidades */}
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-1.5">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Principais Cidades
              </h3>
              <div className="space-y-2">
                {report.audience.topCities.map((city) => (
                  <div key={city.city} className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded">
                    <span className="text-sm text-foreground">{city.city}</span>
                    <span className="text-sm font-bold text-green-600">{city.percentage}%</span>
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
