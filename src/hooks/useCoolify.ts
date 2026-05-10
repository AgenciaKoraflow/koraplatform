import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseInvokeError } from "@/lib/supabaseFunctions";

export interface CoolifyServer {
  id: string;
  name: string;
  description: string;
  ip: string;
  port: number;
  user: string;
  status: string;
  type: string;
  resources?: {
    disk_usage: number;
    disk_usage_percentage: number;
    memory_usage: number;
    memory_usage_percentage: number;
    cpu_usage: number;
  };
}

export interface CoolifyApplication {
  id: string;
  name: string;
  description: string;
  fqdn: string;
  status: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  cpu_usage?: number;
  memory_usage?: number;
}

export interface CoolifyDatabase {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  cpu_usage?: number;
  memory_usage?: number;
}

export interface CoolifyDashboard {
  servers: {
    total: number;
    running: number;
    data: CoolifyServer[];
  };
  applications: {
    total: number;
    running: number;
    data: CoolifyApplication[];
  };
  databases: {
    total: number;
    running: number;
    data: CoolifyDatabase[];
  };
  projects: {
    total: number;
    data: any[];
  };
  resources: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
  };
}

interface CoolifyConfig {
  base_url: string;
  api_token: string;
  team_id?: string;
}

export function useCoolify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callCoolifyApi = useCallback(async (
    action: string,
    config: CoolifyConfig,
    params?: Record<string, string>
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await supabase.functions.invoke('coolify-api', {
        body: { action, config, ...params },
      });

      if (apiError) throw apiError;
      if (!data.success) throw new Error(data.error || 'Unknown error');

      return data.data;
    } catch (err) {
      const errorMessage = await formatSupabaseInvokeError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDashboard = useCallback(async (config: CoolifyConfig): Promise<CoolifyDashboard> => {
    return callCoolifyApi('dashboard', config);
  }, [callCoolifyApi]);

  const getServers = useCallback(async (config: CoolifyConfig): Promise<CoolifyServer[]> => {
    return callCoolifyApi('servers', config);
  }, [callCoolifyApi]);

  const getApplications = useCallback(async (config: CoolifyConfig): Promise<CoolifyApplication[]> => {
    return callCoolifyApi('applications', config);
  }, [callCoolifyApi]);

  const getDatabases = useCallback(async (config: CoolifyConfig): Promise<CoolifyDatabase[]> => {
    return callCoolifyApi('databases', config);
  }, [callCoolifyApi]);

  return {
    loading,
    error,
    getDashboard,
    getServers,
    getApplications,
    getDatabases,
  };
}