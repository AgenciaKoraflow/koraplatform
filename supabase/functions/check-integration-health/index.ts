import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { integration_id } = await req.json();

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: 'integration_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get integration details
    const { data: integration, error: fetchError } = await supabase
      .from('client_integrations')
      .select('*, credentials:integration_credentials(*)')
      .eq('id', integration_id)
      .single();

    if (fetchError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integração não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Health check based on integration type
    let isHealthy = true;
    let responseTime = 0;
    let errorMessage = '';

    const startTime = Date.now();

    try {
      switch (integration.integration_type) {
        case 'n8n':
          await checkN8NHealth(integration);
          break;
        case 'supabase':
          await checkSupabaseHealth(integration);
          break;
        case 'openai':
          await checkOpenAIHealth(integration);
          break;
        case 'sendgrid':
          await checkSendGridHealth(integration);
          break;
        case 'aws_s3':
          await checkAWSS3Health(integration);
          break;
        default:
          // For custom APIs, just check if base_url is accessible
          await checkGenericHealth(integration);
      }
    } catch (err) {
      isHealthy = false;
      errorMessage = err.message;
    }

    responseTime = Date.now() - startTime;

    // Record health check result
    const { error: insertError } = await supabase
      .from('integration_health')
      .insert({
        integration_id,
        is_healthy: isHealthy,
        response_time_ms: responseTime,
        error_message: errorMessage || null,
      });

    if (insertError) {
      console.error('Error recording health check:', insertError);
    }

    return new Response(
      JSON.stringify({
        integration_id,
        is_healthy: isHealthy,
        response_time_ms: responseTime,
        error_message: errorMessage || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Health check functions for different integration types
async function checkN8NHealth(integration: any) {
  const apiKey = integration.credentials?.find((c: any) => c.credential_key === 'api_key')?.credential_value;
  
  if (!apiKey) {
    throw new Error('API key não configurada para N8N');
  }

  const response = await fetch(`${integration.base_url || 'https://n8n.example.com'}/api/v1/workflows`, {
    headers: {
      'X-N8N-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`N8N health check failed: ${response.statusText}`);
  }
}

async function checkSupabaseHealth(integration: any) {
  const projectUrl = integration.credentials?.find((c: any) => c.credential_key === 'project_url')?.credential_value;
  const anonKey = integration.credentials?.find((c: any) => c.credential_key === 'anon_key')?.credential_value;

  if (!projectUrl || !anonKey) {
    throw new Error('Credenciais do Supabase não configuradas');
  }

  const response = await fetch(`${projectUrl}/rest/v1/`, {
    headers: {
      apikey: anonKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase health check failed: ${response.statusText}`);
  }
}

async function checkOpenAIHealth(integration: any) {
  const apiKey = integration.credentials?.find((c: any) => c.credential_key === 'api_key')?.credential_value;

  if (!apiKey) {
    throw new Error('API key não configurada para OpenAI');
  }

  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAI health check failed: ${response.statusText}`);
  }
}

async function checkSendGridHealth(integration: any) {
  const apiKey = integration.credentials?.find((c: any) => c.credential_key === 'api_key')?.credential_value;

  if (!apiKey) {
    throw new Error('API key não configurada para SendGrid');
  }

  const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`SendGrid health check failed: ${response.statusText}`);
  }
}

async function checkAWSS3Health(integration: any) {
  // Basic AWS S3 health check - just validate credentials structure
  const accessKeyId = integration.credentials?.find((c: any) => c.credential_key === 'access_key_id')?.credential_value;
  const secretAccessKey = integration.credentials?.find((c: any) => c.credential_key === 'secret_access_key')?.credential_value;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Credenciais AWS não configuradas');
  }

  // For S3, we could do a ListBuckets call but that requires AWS SDK
  // For now, just validate credentials exist
}

async function checkGenericHealth(integration: any) {
  if (!integration.base_url) {
    throw new Error('URL base não configurada');
  }

  const response = await fetch(integration.base_url, {
    method: 'HEAD',
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
}
