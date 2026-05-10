import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Server,
  Globe,
  Database,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoolify, type CoolifyDashboard } from "@/hooks/useCoolify";
import type { ClientIntegration } from "@/types/data";

interface CoolifyMetricsProps {
  integration: ClientIntegration;
}

export function CoolifyMetrics({ integration }: CoolifyMetricsProps) {
  const [dashboard, setDashboard] = useState<CoolifyDashboard | null>(null);
  const { loading, error, getDashboard } = useCoolify();

  const config = integration.config as {
    base_url: string;
    api_token: string;
    team_id?: string;
  };

  const fetchMetrics = async () => {
    if (!config?.base_url || !config?.api_token) return;
    
    try {
      const data = await getDashboard({
        base_url: config.base_url,
        api_token: config.api_token,
        team_id: config.team_id,
      });
      setDashboard(data);
    } catch (err) {
      console.error('Failed to fetch Coolify metrics:', err);
    }
  };

  useEffect(() => {
    if (integration.status === 'active') {
      fetchMetrics();
      // Refresh every 5 minutes
      const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [integration.status]);

  if (integration.status !== 'active') {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Configure e ative a integração para ver as métricas
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchMetrics}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-4">
        <Button variant="outline" size="sm" onClick={fetchMetrics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Carregar métricas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resource Usage */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">CPU</span>
          </div>
          <p className="text-lg font-bold">{dashboard.resources.cpu_usage.toFixed(1)}%</p>
          <Progress
            value={dashboard.resources.cpu_usage}
            className="h-1 mt-1"
          />
        </div>
        
        <div className="p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Memória</span>
          </div>
          <p className="text-lg font-bold">{dashboard.resources.memory_usage.toFixed(1)}%</p>
          <Progress
            value={dashboard.resources.memory_usage}
            className="h-1 mt-1"
          />
        </div>
        
        <div className="p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Disco</span>
          </div>
          <p className="text-lg font-bold">{dashboard.resources.disk_usage.toFixed(1)}%</p>
          <Progress
            value={dashboard.resources.disk_usage}
            className="h-1 mt-1"
          />
        </div>
      </div>

      {/* Servers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Server className="w-4 h-4" />
            Servidores
          </h4>
          <Badge variant="outline" className="text-xs">
            {dashboard.servers.running}/{dashboard.servers.total} ativos
          </Badge>
        </div>
        <div className="space-y-2">
          {dashboard.servers.data.slice(0, 3).map((server) => (
            <div 
              key={server.id} 
              className="flex items-center justify-between p-2 rounded-xl bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  server.status === 'running' ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm">{server.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>CPU: {server.resources?.cpu_usage?.toFixed(0) || 0}%</span>
                <span>MEM: {server.resources?.memory_usage_percentage?.toFixed(0) || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Aplicações
          </h4>
          <Badge variant="outline" className="text-xs">
            {dashboard.applications.running}/{dashboard.applications.total} rodando
          </Badge>
        </div>
        <div className="space-y-2">
          {dashboard.applications.data.slice(0, 5).map((app) => (
            <div 
              key={app.id} 
              className="flex items-center justify-between p-2 rounded-xl bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  app.status === 'running' ? "bg-green-500" : "bg-amber-500"
                )} />
                <span className="text-sm">{app.name}</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  app.status === 'running' ? "text-green-500 border-green-500/30" : "text-amber-500 border-amber-500/30"
                )}
              >
                {app.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Databases */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Database className="w-4 h-4" />
            Bancos de Dados
          </h4>
          <Badge variant="outline" className="text-xs">
            {dashboard.databases.running}/{dashboard.databases.total} ativos
          </Badge>
        </div>
        <div className="space-y-2">
          {dashboard.databases.data.slice(0, 3).map((db) => (
            <div 
              key={db.id} 
              className="flex items-center justify-between p-2 rounded-xl bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  db.status === 'running' ? "bg-green-500" : "bg-amber-500"
                )} />
                <span className="text-sm">{db.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{db.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchMetrics}
          disabled={loading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}