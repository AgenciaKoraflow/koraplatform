import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseInvokeError } from "@/lib/supabaseFunctions";
import type {
  ClientIntegration,
  IntegrationMetric,
  IntegrationLog,
  IntegrationHealth,
  ClientObservabilitySummary,
  IntegrationType,
} from "@/types/data";
import type { Tables } from "@/integrations/supabase/types";

type IntegrationRow = Tables<"client_integrations">;
type SummaryRow = Tables<"client_observability_summary">;

function rowToIntegration(row: IntegrationRow): ClientIntegration {
  return {
    id: row.id,
    client_id: row.client_id,
    integration_type: row.integration_type as IntegrationType,
    status: row.status as ClientIntegration["status"],
    display_name: row.display_name ?? undefined,
    description: row.description ?? undefined,
    base_url: row.base_url ?? undefined,
    api_key: row.api_key ?? undefined,
    config: row.config as ClientIntegration["config"],
    is_enabled: row.is_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToSummary(row: SummaryRow): ClientObservabilitySummary {
  return {
    client_id: row.client_id,
    client_name: row.client_name,
    total_integrations: row.total_integrations,
    active_integrations: row.active_integrations,
    error_integrations: row.error_integrations,
    last_health_check: row.last_health_check ?? undefined,
    total_logs_7d: row.total_logs_7d,
    errors_7d: row.errors_7d,
  };
}

export function useObservability(clientId?: string) {
  const [integrations, setIntegrations] = useState<ClientIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      let query = supabase
        .from("client_integrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setIntegrations((data ?? []).map(rowToIntegration));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch integrations");
    }
  }, [clientId]);

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
          .from("client_integrations")
          .insert(integration)
          .select()
          .single();

        if (insertError) throw insertError;
        setIntegrations((prev) => [rowToIntegration(data), ...prev]);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create integration");
        throw err;
      }
    },
    [],
  );

  const updateIntegration = useCallback(
    async (id: string, updates: Partial<ClientIntegration>) => {
      try {
        const { data, error: updateError } = await supabase
          .from("client_integrations")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;
        setIntegrations((prev) =>
          prev.map((i) => (i.id === id ? rowToIntegration(data) : i)),
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update integration");
        throw err;
      }
    },
    [],
  );

  const deleteIntegration = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("client_integrations")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete integration");
      throw err;
    }
  }, []);

  const fetchMetrics = useCallback(async (integrationId: string, days = 7) => {
    try {
      const { data } = await supabase
        .from("integration_metrics")
        .select("*")
        .eq("integration_id", integrationId)
        .gte(
          "recorded_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("recorded_at", { ascending: false });
      return (data ?? []) as IntegrationMetric[];
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      return [];
    }
  }, []);

  const fetchLogs = useCallback(async (integrationId: string, days = 7) => {
    try {
      const { data } = await supabase
        .from("integration_logs")
        .select("*")
        .eq("integration_id", integrationId)
        .gte(
          "created_at",
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as IntegrationLog[];
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      return [];
    }
  }, []);

  const fetchHealth = useCallback(async (integrationId: string) => {
    try {
      const { data } = await supabase
        .from("integration_health")
        .select("*")
        .eq("integration_id", integrationId)
        .order("checked_at", { ascending: false })
        .limit(1)
        .single();
      return (data as IntegrationHealth) ?? null;
    } catch (err) {
      console.error("Failed to fetch health:", err);
      return null;
    }
  }, []);

  const checkHealth = useCallback(async (integrationId: string) => {
    try {
      const { data, error: healthError } = await supabase.functions.invoke(
        "check-integration-health",
        { body: { integration_id: integrationId } },
      );

      if (healthError) throw healthError;
      return data;
    } catch (err) {
      console.error("Failed to check health:", err);
      const msg = await formatSupabaseInvokeError(err);
      await supabase.from("integration_health").insert({
        integration_id: integrationId,
        is_healthy: false,
        error_message: msg,
      });
      return null;
    }
  }, []);

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

export function useObservabilityOverview() {
  const [summaries, setSummaries] = useState<ClientObservabilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("client_observability_summary")
        .select("*")
        .order("client_name");

      if (fetchError) throw fetchError;
      setSummaries((data ?? []).map(rowToSummary));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch summaries");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSummaries().finally(() => setLoading(false));
  }, [fetchSummaries]);

  return { summaries, loading, error, refetch: fetchSummaries };
}
