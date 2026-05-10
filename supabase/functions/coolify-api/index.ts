import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface CoolifyConfig {
  base_url: string;
  api_token: string;
  team_id?: string;
}

interface CoolifyServer {
  id: string;
  name: string;
  description: string;
  ip: string;
  port: number;
  user: string;
  status: string;
  type: string;
  settings: {
    is_part_of_update_notification: boolean;
    concurrent_builds: number;
    dynamic_timeout: number;
  };
  resources: {
    disk_usage: number;
    disk_usage_percentage: number;
    memory_usage: number;
    memory_usage_percentage: number;
    cpu_usage: number;
  };
}

interface CoolifyApplication {
  id: string;
  name: string;
  description: string;
  fqdn: string;
  status: string;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    name: string;
  };
  environment: {
    id: string;
    name: string;
  };
  destination: {
    id: string;
    name: string;
  };
  source: {
    id: string;
    name: string;
  };
  settings: {
    is_static: boolean;
    is_git_based: boolean;
    is_github_based: boolean;
    is_gitlab_based: boolean;
    is_bitbucket_based: boolean;
    is_gitea_based: boolean;
  };
  cpu_usage: number;
  memory_usage: number;
}

interface CoolifyDatabase {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  cpu_usage: number;
  memory_usage: number;
}

interface CoolifyProject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  applications: CoolifyApplication[];
  databases: CoolifyDatabase[];
}

async function fetchFromCoolify(
  endpoint: string,
  config: CoolifyConfig
): Promise<any> {
  const url = `${config.base_url.replace(/\/$/, '')}/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.api_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Coolify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getServers(config: CoolifyConfig): Promise<CoolifyServer[]> {
  return fetchFromCoolify('/servers', config);
}

async function getServerResources(config: CoolifyConfig, serverId: string): Promise<any> {
  return fetchFromCoolify(`/servers/${serverId}/resources`, config);
}

async function getApplications(config: CoolifyConfig): Promise<CoolifyApplication[]> {
  return fetchFromCoolify('/applications', config);
}

async function getDatabases(config: CoolifyConfig): Promise<CoolifyDatabase[]> {
  return fetchFromCoolify('/databases', config);
}

async function getProjects(config: CoolifyConfig): Promise<CoolifyProject[]> {
  return fetchFromCoolify('/projects', config);
}

async function getProjectResources(config: CoolifyConfig, projectId: string): Promise<any> {
  return fetchFromCoolify(`/projects/${projectId}`, config);
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const body = await req.json();
    const { action, config } = body as { action: string; config: CoolifyConfig };

    if (!config?.base_url || !config?.api_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required config: base_url and api_token' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    let result: any;

    switch (action) {
      case 'servers':
        result = await getServers(config);
        break;
      
      case 'server_resources':
        const { serverId } = body;
        if (!serverId) {
          throw new Error('Missing serverId for server_resources action');
        }
        result = await getServerResources(config, serverId);
        break;
      
      case 'applications':
        result = await getApplications(config);
        break;
      
      case 'databases':
        result = await getDatabases(config);
        break;
      
      case 'projects':
        result = await getProjects(config);
        break;
      
      case 'project_resources':
        const { projectId } = body;
        if (!projectId) {
          throw new Error('Missing projectId for project_resources action');
        }
        result = await getProjectResources(config, projectId);
        break;
      
      case 'dashboard':
        // Get all dashboard data in one call
        const [servers, applications, databases, projects] = await Promise.all([
          getServers(config),
          getApplications(config),
          getDatabases(config),
          getProjects(config),
        ]);
        
        // Calculate totals
        const totalCpuUsage = servers.reduce((acc: number, s: any) => acc + (s.resources?.cpu_usage || 0), 0);
        const totalMemoryUsage = servers.reduce((acc: number, s: any) => acc + (s.resources?.memory_usage || 0), 0);
        const totalDiskUsage = servers.reduce((acc: number, s: any) => acc + (s.resources?.disk_usage || 0), 0);
        
        const runningApps = applications.filter((a: any) => a.status === 'running').length;
        const runningDbs = databases.filter((d: any) => d.status === 'running').length;
        
        result = {
          servers: {
            total: servers.length,
            running: servers.filter((s: any) => s.status === 'running').length,
            data: servers,
          },
          applications: {
            total: applications.length,
            running: runningApps,
            data: applications,
          },
          databases: {
            total: databases.length,
            running: runningDbs,
            data: databases,
          },
          projects: {
            total: projects.length,
            data: projects,
          },
          resources: {
            cpu_usage: totalCpuUsage / (servers.length || 1),
            memory_usage: totalMemoryUsage,
            disk_usage: totalDiskUsage,
          },
        };
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: servers, server_resources, applications, databases, projects, project_resources, dashboard' }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Coolify API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});