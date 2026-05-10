import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseInvokeError } from "@/lib/supabaseFunctions";
import type {
  ClientIntegration,
  IntegrationCredential,
  IntegrationMetric,
  IntegrationLog,
  IntegrationHealth,
  ClientObservabilitySummary,
  IntegrationType,
} from '@/types/data';

export function useObservability(clientId?: string) {
  const [integrations, setIntegrations] = useState<ClientIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all integrations for a client
  const fetchIntegrations = useCallback(async () => {
    try {
      let query = supabase
        .from('client_integrations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setIntegrations((data as ClientIntegration[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    }
  }, [clientId]);

  // Create a new integration
  const createIntegration = useCallback(
    async (integration: {
      client_id: string;
      integration_type: IntegrationType;
      display_name?: string;
      description?: string;
      base_url?: string;
    }) => {
      try {
        const { data, error: insertError } = await supabase
          .from('client_integrations' as any)
          .insert(integration)
          .select()
          .single();

        if (insertError) throw insertError;
        setIntegrations((prev) => [(data as ClientIntegration), ...prev]);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create integration');
        throw err;
      }
    },
    []
  );

  // Update an integration
  const updateIntegration = useCallback(
    async (id: string, updates: Partial<ClientIntegration>) => {
      try {
        const { data, error: updateError } = await supabase
          .from('client_integrations' as any)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setIntegrations((prev) =>
          prev.map((i) => (i.id === id ? (data as ClientIntegration) : i))
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update integration');
        throw err;
      }
    },
    []
  );

  // Delete an integration
  const deleteIntegration = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('client_integrations' as any)
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete integration');
        throw err;
      }
    },
    []
  );

  // Fetch metrics for an integration
  const fetchMetrics = useCallback(
    async (integrationId: string, days = 7) => {
      try {
        const { data } = await supabase
          .from('integration_metrics' as any)
          .select('*')
          .eq('integration_id', integrationId)
          .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
          .order('recorded_at', { ascending: false });
        return (data as IntegrationMetric[]) || [];
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        return [];
      }
    },
    []
  );

  // Fetch logs for an integration
  const fetchLogs = useCallback(
    async (integrationId: string, days = 7) => {
      try {
        const { data } = await supabase
          .from('integration_logs' as any)
          .select('*')
          .eq('integration_id', integrationId)
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(100);
        return (data as IntegrationLog[]) || [];
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        return [];
      }
    },
    []
  );

  // Fetch health for an integration
  const fetchHealth = useCallback(
    async (integrationId: string) => {
      try {
        const { data } = await supabase
          .from('integration_health' as any)
          .select('*')
          .eq('integration_id', integrationId)
          .order('checked_at', { ascending: false })
          .limit(1)
          .single();
        return (data as IntegrationHealth) || null;
      } catch (err) {
        console.error('Failed to fetch health:', err);
        return null;
      }
    },
    []
  );

  // Check integration health
  const checkHealth = useCallback(async (integrationId: string) => {
    try {
      const { data, error: healthError } = await supabase.functions.invoke(
        'check-integration-health',
        {
          body: { integration_id: integrationId },
        }
      );

      if (healthError) throw healthError;
      return data;
    } catch (err) {
      console.error("Failed to check health:", err);
      const msg = await formatSupabaseInvokeError(err);
      await supabase.from("integration_health" as any).insert({
        integration_id: integrationId,
        is_healthy: false,
        error_message: msg,
      });
      return null;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    setLoading(true);
    fetchIntegrations().finally(() => setLoading(false));
  }, [clientId, fetchIntegrations]);

  return {
    integrations,
    loading,
    error,
    fetchIntegrations,
    fetchMetrics,
    fetchLogs,
    fetchHealth,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    checkHealth,
  };
}

// Hook for global observability (all clients)
export function useObservabilityOverview() {
  const [summaries, setSummaries] = useState<ClientObservabilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('client_observability_summary' as any)
        .select('*')
        .order('client_name');

      if (fetchError) throw fetchError;
      setSummaries((data as ClientObservabilitySummary[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summaries');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSummaries().finally(() => setLoading(false));
  }, [fetchSummaries]);

  return { summaries, loading, error, refetch: fetchSummaries };
}
