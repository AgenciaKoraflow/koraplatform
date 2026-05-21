import { logger } from "@/lib/logger";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Server,
  Database,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Settings,
  Globe,
  Plus,
  Trash2,
  Terminal,
  Building2,
  Save,
  Play,
  Pause,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAllClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import type { IntegrationType, IntegrationStatus, ClientIntegration } from "@/types/data";
import { toast } from "sonner";
import { CoolifyMetrics } from "@/components/observability/CoolifyMetrics";

// Integration type icons
const integrationTypeIcons: Record<IntegrationType, React.ReactNode> = {
  supabase: <Database className="w-5 h-5" />,
  coolify: <Server className="w-5 h-5" />,
};

const integrationTypeLabels: Record<IntegrationType, string> = {
  supabase: 'Supabase (Database)',
  coolify: 'Coolify (VPS Deploy)',
};

const integrationStatusColors: Record<IntegrationStatus, string> = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  pending_setup: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

const integrationStatusLabels: Record<IntegrationStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  error: 'Erro',
  pending_setup: 'Pendente',
};

// Config fields for each integration type
const integrationConfigFields: Record<IntegrationType, { key: string; label: string; type: string; placeholder: string }[]> = {
  supabase: [
    { key: 'project_url', label: 'Project URL', type: 'text', placeholder: 'https://xxxx.supabase.co' },
    { key: 'anon_key', label: 'Anon Key', type: 'password', placeholder: '********' },
    { key: 'service_role_key', label: 'Service Role Key', type: 'password', placeholder: '******** (opcional)' },
  ],
  coolify: [
    { key: 'base_url', label: 'URL do Coolify', type: 'text', placeholder: 'https://coolify.seudominio.com' },
    { key: 'api_token', label: 'API Token', type: 'password', placeholder: '********' },
    { key: 'team_id', label: 'Team ID (opcional)', type: 'text', placeholder: '1' },
  ],
};

export default function Observabilidade() {
  const { data: clients = [] } = useAllClients();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<ClientIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ClientIntegration | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    integration_type: IntegrationType | "";
    display_name: string;
    description: string;
    config: Record<string, string>;
  }>({
    integration_type: "",
    display_name: "",
    description: "",
    config: {},
  });

  // Filter only active clients
  const activeClients = clients.filter(c => c.stage === "cliente");

  // Fetch integrations
  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('client_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations((data as ClientIntegration[]) || []);
    } catch (err) {
      logger.error('Failed to fetch integrations:', err instanceof Error ? err : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Get integrations by client
  const getIntegrationsByClient = (clientId: string) => {
    return integrations.filter(i => i.client_id === clientId);
  };

  // Calculate stats
  const totalIntegrations = integrations.length;
  const activeIntegrations = integrations.filter(i => i.status === 'active').length;
  const errorIntegrations = integrations.filter(i => i.status === 'error').length;

  // Open add dialog
  const openAddDialog = (clientId: string) => {
    setSelectedClientId(clientId);
    setFormData({
      integration_type: "",
      display_name: "",
      description: "",
      config: {},
    });
    setIsAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (integration: ClientIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      integration_type: integration.integration_type,
      display_name: integration.display_name || "",
      description: integration.description || "",
      config: (integration.config as Record<string, string>) || {},
    });
    if (integration.base_url) {
      setFormData(prev => ({
        ...prev,
        config: { ...prev.config, base_url: integration.base_url || "" }
      }));
    }
    setIsEditDialogOpen(true);
  };

  // Handle save new integration
  const handleSave = async () => {
    if (!selectedClientId || !formData.integration_type) {
      toast.error("Selecione o tipo de integração");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_integrations')
        .insert({
          client_id: selectedClientId,
          integration_type: formData.integration_type,
          display_name: formData.display_name || integrationTypeLabels[formData.integration_type],
          description: formData.description,
          config: formData.config,
          base_url: formData.config.base_url || null,
          status: 'pending_setup',
          is_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => [...prev, data as ClientIntegration]);
      setIsAddDialogOpen(false);
      toast.success("Integração adicionada com sucesso!");
    } catch (err) {
      logger.error('Failed to create integration:', err instanceof Error ? err : undefined);
      toast.error("Erro ao criar integração");
    }
  };

  // Handle update integration
  const handleUpdate = async () => {
    if (!editingIntegration) return;

    try {
      const { data, error } = await supabase
        .from('client_integrations')
        .update({
          display_name: formData.display_name,
          description: formData.description,
          config: formData.config,
          base_url: formData.config.base_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingIntegration.id)
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => prev.map(i => i.id === editingIntegration.id ? (data as ClientIntegration) : i));
      setIsEditDialogOpen(false);
      toast.success("Integração atualizada com sucesso!");
    } catch (err) {
      logger.error('Failed to update integration:', err instanceof Error ? err : undefined);
      toast.error("Erro ao atualizar integração");
    }
  };

  // Handle delete integration
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta integração?")) return;

    try {
      const { error } = await supabase
        .from('client_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.filter(i => i.id !== id));
      toast.success("Integração removida com sucesso!");
    } catch (err) {
      logger.error('Failed to delete integration:', err instanceof Error ? err : undefined);
      toast.error("Erro ao remover integração");
    }
  };

  // Toggle integration status
  const toggleStatus = async (integration: ClientIntegration) => {
    const newStatus = integration.status === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('client_integrations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', integration.id);

      if (error) throw error;

      setIntegrations(prev => prev.map(i =>
        i.id === integration.id ? { ...i, status: newStatus as IntegrationStatus } : i
      ));
      toast.success(`Integração ${newStatus === 'active' ? 'ativada' : 'desativada'}`);
    } catch (err) {
      logger.error('Failed to toggle status:', err instanceof Error ? err : undefined);
      toast.error("Erro ao alterar status");
    }
  };

  // Render integration card
  const renderIntegrationCard = (integration: ClientIntegration) => (
    <div
      key={integration.id}
      className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              integration.status === "active"
                ? "bg-green-500/10"
                : integration.status === "error"
                  ? "bg-red-500/10"
                  : "bg-amber-500/10"
            )}
          >
            {integrationTypeIcons[integration.integration_type]}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {integration.display_name || integrationTypeLabels[integration.integration_type]}
            </p>
            <p className="text-xs text-muted-foreground">
              {integrationTypeLabels[integration.integration_type]}
            </p>
          </div>
        </div>
        <Badge className={cn("text-xs border", integrationStatusColors[integration.status])}>
          {integrationStatusLabels[integration.status]}
        </Badge>
      </div>

      {integration.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {integration.description}
        </p>
      )}

      {/* Show Coolify metrics if integration type is coolify */}
      {integration.integration_type === 'coolify' && (
        <div className="mb-3">
          <CoolifyMetrics integration={integration} />
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => toggleStatus(integration)}
        >
          {integration.status === 'active' ? (
            <>
              <Pause className="w-3 h-3 mr-1" />
              Pausar
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Ativar
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openEditDialog(integration)}>
          <Settings className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => handleDelete(integration.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  // Render client card
  const renderClientCard = (clientId: string, clientName: string, isInternal = false) => {
    const clientIntegrations = getIntegrationsByClient(clientId);
    const activeCount = clientIntegrations.filter(i => i.status === 'active').length;
    const errorCount = clientIntegrations.filter(i => i.status === 'error').length;

    return (
      <Card key={clientId} className="hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isInternal ? "bg-primary/10" : "bg-primary/10"
              )}>
                {isInternal ? (
                  <Building2 className="w-6 h-6 text-primary" />
                ) : (
                  <Globe className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{clientName}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {clientIntegrations.length} integrações
                  </Badge>
                  {activeCount > 0 && (
                    <Badge className={cn("text-xs", integrationStatusColors.active)}>
                      {activeCount} ativas
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className={cn("text-xs", integrationStatusColors.error)}>
                      {errorCount} erros
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => openAddDialog(clientId)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clientIntegrations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma integração configurada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {clientIntegrations.map(renderIntegrationCard)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render config form fields
  const renderConfigFields = () => {
    if (!formData.integration_type) return null;

    const fields = integrationConfigFields[formData.integration_type];

    return fields.map((field) => (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.type === 'textarea' ? (
          <Textarea
            id={field.key}
            placeholder={field.placeholder}
            value={formData.config[field.key] || ""}
            onChange={(e) => setFormData({
              ...formData,
              config: { ...formData.config, [field.key]: e.target.value }
            })}
            className="bg-input border-border font-mono text-xs"
            rows={3}
          />
        ) : (
          <Input
            id={field.key}
            type={field.type}
            placeholder={field.placeholder}
            value={formData.config[field.key] || ""}
            onChange={(e) => setFormData({
              ...formData,
              config: { ...formData.config, [field.key]: e.target.value }
            })}
            className="bg-input border-border"
          />
        )}
      </div>
    ));
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <PageHeader
          icon={Activity}
          title="Observabilidade"
          subtitle="Monitore integrações e recursos de cada cliente"
          actions={
            <Button variant="outline" size="sm" onClick={() => fetchIntegrations()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          }
        />

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total de Integrações</p>
                  <p className="text-xl font-bold text-foreground mt-1">{totalIntegrations}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Globe className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Integrações Ativas</p>
                  <p className="text-xl font-bold text-foreground mt-1">{activeIntegrations}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Integrações com Erro</p>
                  <p className="text-xl font-bold text-foreground mt-1">{errorIntegrations}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Clientes Monitorados</p>
                  <p className="text-xl font-bold text-foreground mt-1">{activeClients.length + 1}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input"
          />
        </div>

        {/* Koraflow Internal Panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Koraflow Interno
          </h2>
          {renderClientCard('koraflow_internal', 'Koraflow', true)}
        </div>

        {/* Clients Panels */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Clientes Ativos
          </h2>
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {activeClients
                .filter(c =>
                  c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((client) => renderClientCard(client.id, client.company))}
            </div>
          )}
        </div>
      </div>

      {/* Add Integration Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Nova Integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Integração *</Label>
              <Select
                value={formData.integration_type}
                onValueChange={(value) => setFormData({
                  ...formData,
                  integration_type: value as IntegrationType,
                  display_name: integrationTypeLabels[value as IntegrationType] || "",
                  config: {},
                })}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {Object.entries(integrationTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {integrationTypeIcons[key as IntegrationType]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Nome de Exibição</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Nome personalizado para esta integração"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
                className="bg-input border-border"
                rows={2}
              />
            </div>

            {renderConfigFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Integration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                {integrationTypeIcons[formData.integration_type as IntegrationType]}
                <span className="font-medium">
                  {integrationTypeLabels[formData.integration_type as IntegrationType]}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_display_name">Nome de Exibição</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Descrição</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-input border-border"
                rows={2}
              />
            </div>

            {renderConfigFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
