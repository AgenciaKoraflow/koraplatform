import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, 
  Server, 
  Database, 
  Key, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Settings,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  BarChart3,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/DataContext";

// Mock data for monitoring
const workflowsData = [
  { id: "1", name: "Lead Nurturing Automation", client: "Tech Corp", status: "running", executions: 1234, errors: 2, lastRun: "Há 5 min" },
  { id: "2", name: "Invoice Processing", client: "StartupXYZ", status: "running", executions: 567, errors: 0, lastRun: "Há 15 min" },
  { id: "3", name: "Customer Onboarding", client: "RetailMax", status: "paused", executions: 890, errors: 5, lastRun: "Há 2 horas" },
  { id: "4", name: "Report Generator", client: "DataFlow Inc", status: "error", executions: 123, errors: 12, lastRun: "Há 30 min" },
  { id: "5", name: "Data Sync Pipeline", client: "CloudNative", status: "running", executions: 2345, errors: 1, lastRun: "Há 2 min" },
];

const connectionsData = [
  { id: "1", name: "PostgreSQL - Tech Corp", type: "database", status: "connected", latency: "12ms" },
  { id: "2", name: "AWS S3 - Backups", type: "storage", status: "connected", latency: "45ms" },
  { id: "3", name: "Stripe API", type: "payment", status: "connected", latency: "78ms" },
  { id: "4", name: "Salesforce CRM", type: "crm", status: "disconnected", latency: "-" },
  { id: "5", name: "SendGrid Email", type: "email", status: "connected", latency: "23ms" },
  { id: "6", name: "OpenAI API", type: "ai", status: "connected", latency: "156ms" },
];

const tokensData = [
  { id: "1", name: "API Key - Production", type: "api_key", usage: 85, limit: 10000, expires: "30 dias" },
  { id: "2", name: "OAuth Token - Google", type: "oauth", usage: 45, limit: 5000, expires: "7 dias" },
  { id: "3", name: "JWT Token - Auth", type: "jwt", usage: 92, limit: 1000, expires: "1 dia" },
  { id: "4", name: "Webhook Secret", type: "secret", usage: 12, limit: 100, expires: "Nunca" },
];

const consumptionData = [
  { resource: "CPU", current: 45, limit: 100, unit: "%" },
  { resource: "Memória", current: 6.2, limit: 16, unit: "GB" },
  { resource: "Storage", current: 124, limit: 500, unit: "GB" },
  { resource: "Bandwidth", current: 2.4, limit: 10, unit: "TB" },
];

const statusColors = {
  running: "bg-green-500/10 text-green-500 border-green-500/20",
  connected: "bg-green-500/10 text-green-500 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  disconnected: "bg-red-500/10 text-red-500 border-red-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = {
  running: "Ativo",
  connected: "Conectado",
  paused: "Pausado",
  disconnected: "Desconectado",
  error: "Erro",
};

export default function Observabilidade() {
  const { clients, projects } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const activeWorkflows = workflowsData.filter(w => w.status === "running").length;
  const totalConnections = connectionsData.filter(c => c.status === "connected").length;
  const criticalAlerts = workflowsData.filter(w => w.status === "error").length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Observabilidade</h1>
            <p className="text-muted-foreground mt-1">Monitore workflows, conexões, tokens e consumo de recursos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Workflows Ativos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{activeWorkflows}</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% vs ontem
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Conexões Ativas</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{totalConnections}/{connectionsData.length}</p>
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Todas funcionando
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Wifi className="w-7 h-7 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Tokens Ativos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{tokensData.length}</p>
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    1 expira em breve
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Key className="w-7 h-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "bg-gradient-to-br border",
            criticalAlerts > 0 
              ? "from-red-500/5 to-red-500/10 border-red-500/20" 
              : "from-green-500/5 to-green-500/10 border-green-500/20"
          )}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Alertas Críticos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{criticalAlerts}</p>
                  <p className={cn(
                    "text-xs mt-1 flex items-center gap-1",
                    criticalAlerts > 0 ? "text-red-500" : "text-green-500"
                  )}>
                    {criticalAlerts > 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Requer atenção
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Tudo operacional
                      </>
                    )}
                  </p>
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  criticalAlerts > 0 ? "bg-red-500/20" : "bg-green-500/20"
                )}>
                  <AlertTriangle className={cn(
                    "w-7 h-7",
                    criticalAlerts > 0 ? "text-red-500" : "text-green-500"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different monitoring views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Conexões
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Tokens & APIs
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Recursos
              </TabsTrigger>
            </TabsList>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resource Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    Consumo de Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {consumptionData.map((item) => (
                    <div key={item.resource} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.resource}</span>
                        <span className="text-muted-foreground">
                          {item.current} / {item.limit} {item.unit}
                        </span>
                      </div>
                      <Progress 
                        value={(item.current / item.limit) * 100} 
                        className={cn(
                          "h-2",
                          (item.current / item.limit) > 0.8 && "bg-red-100 [&>div]:bg-red-500",
                          (item.current / item.limit) > 0.6 && (item.current / item.limit) <= 0.8 && "bg-amber-100 [&>div]:bg-amber-500"
                        )}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Workflow Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflowsData.slice(0, 4).map((workflow) => (
                      <div key={workflow.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            workflow.status === "running" && "bg-green-500",
                            workflow.status === "paused" && "bg-amber-500",
                            workflow.status === "error" && "bg-red-500"
                          )} />
                          <div>
                            <p className="font-medium text-sm">{workflow.name}</p>
                            <p className="text-xs text-muted-foreground">{workflow.client}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{workflow.lastRun}</p>
                          <p className="text-xs font-medium">{workflow.executions.toLocaleString()} exec.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connections Status Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Status das Conexões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {connectionsData.map((conn) => (
                    <div 
                      key={conn.id} 
                      className={cn(
                        "p-4 rounded-lg border text-center cursor-pointer transition-all hover:shadow-md",
                        conn.status === "connected" 
                          ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" 
                          : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center",
                        conn.status === "connected" ? "bg-green-500/20" : "bg-red-500/20"
                      )}>
                        {conn.type === "database" && <Database className={cn("w-5 h-5", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                        {conn.type === "storage" && <HardDrive className={cn("w-5 h-5", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                        {conn.type === "payment" && <Server className={cn("w-5 h-5", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                        {conn.type === "crm" && <Globe className={cn("w-5 h-5", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                        {conn.type === "email" && <Wifi className={cn("w-5 h-5", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                        {conn.type === "ai" && <Cpu className={cn("w-5 h-5", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                      </div>
                      <p className="text-xs font-medium truncate">{conn.name.split(" - ")[0]}</p>
                      <p className="text-xs text-muted-foreground mt-1">{conn.latency}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Workflows Ativos</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Workflow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowsData.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          workflow.status === "running" && "bg-green-500/10",
                          workflow.status === "paused" && "bg-amber-500/10",
                          workflow.status === "error" && "bg-red-500/10"
                        )}>
                          <Zap className={cn(
                            "w-6 h-6",
                            workflow.status === "running" && "text-green-500",
                            workflow.status === "paused" && "text-amber-500",
                            workflow.status === "error" && "text-red-500"
                          )} />
                        </div>
                        <div>
                          <p className="font-semibold">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">{workflow.client}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-lg font-bold">{workflow.executions.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Execuções</p>
                        </div>
                        <div className="text-center">
                          <p className={cn("text-lg font-bold", workflow.errors > 0 ? "text-red-500" : "text-green-500")}>
                            {workflow.errors}
                          </p>
                          <p className="text-xs text-muted-foreground">Erros</p>
                        </div>
                        <Badge className={cn("border", statusColors[workflow.status])}>
                          {statusLabels[workflow.status]}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conexões & Integrações</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conexão
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connectionsData.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          conn.status === "connected" ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          {conn.type === "database" && <Database className={cn("w-6 h-6", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                          {conn.type === "storage" && <HardDrive className={cn("w-6 h-6", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                          {conn.type === "payment" && <Server className={cn("w-6 h-6", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                          {conn.type === "crm" && <Globe className={cn("w-6 h-6", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                          {conn.type === "email" && <Wifi className={cn("w-6 h-6", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                          {conn.type === "ai" && <Cpu className={cn("w-6 h-6", conn.status === "connected" ? "text-green-500" : "text-red-500")} />}
                        </div>
                        <div>
                          <p className="font-semibold">{conn.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{conn.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{conn.latency}</p>
                          <p className="text-xs text-muted-foreground">Latência</p>
                        </div>
                        <Badge className={cn("border", statusColors[conn.status])}>
                          {statusLabels[conn.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tokens & Chaves de API</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Token
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokensData.map((token) => (
                    <div key={token.id} className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Key className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{token.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{token.type.replace("_", " ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={token.expires === "1 dia" ? "destructive" : "secondary"}>
                            Expira em {token.expires}
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Uso</span>
                          <span className="font-medium">{token.usage}% ({Math.round(token.limit * token.usage / 100).toLocaleString()} / {token.limit.toLocaleString()} requisições)</span>
                        </div>
                        <Progress 
                          value={token.usage} 
                          className={cn(
                            "h-2",
                            token.usage > 80 && "bg-red-100 [&>div]:bg-red-500",
                            token.usage > 60 && token.usage <= 80 && "bg-amber-100 [&>div]:bg-amber-500"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    Uso de CPU
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">45%</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Normal</Badge>
                    </div>
                    <Progress value={45} className="h-3" />
                    <p className="text-sm text-muted-foreground">4.5 / 10 vCPUs em uso</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-primary" />
                    Memória RAM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">6.2 GB</span>
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Atenção</Badge>
                    </div>
                    <Progress value={62} className="h-3 bg-amber-100 [&>div]:bg-amber-500" />
                    <p className="text-sm text-muted-foreground">6.2 / 10 GB em uso</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Armazenamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">124 GB</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Normal</Badge>
                    </div>
                    <Progress value={24.8} className="h-3" />
                    <p className="text-sm text-muted-foreground">124 / 500 GB em uso</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-primary" />
                    Largura de Banda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold">2.4 TB</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Normal</Badge>
                    </div>
                    <Progress value={24} className="h-3" />
                    <p className="text-sm text-muted-foreground">2.4 / 10 TB transferido este mês</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
