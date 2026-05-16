import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Remove chaves undefined (PostgREST pode rejeitar payload inválido). */
function stripUndefined<T extends Record<string, unknown>>(row: T): T {
  const out = {} as T;
  for (const key of Object.keys(row)) {
    const v = row[key];
    if (v !== undefined) (out as Record<string, unknown>)[key] = v;
  }
  return out;
}

function normalizeInsertPayload(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((row) =>
      typeof row === 'object' && row !== null ? stripUndefined(row as Record<string, unknown>) : row
    );
  }
  if (typeof data === 'object') {
    return stripUndefined(data as Record<string, unknown>);
  }
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT auth — validate caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Require explicit EXTERNAL_SUPABASE_SERVICE_KEY — no fallback to project service role
    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')?.trim() || supabaseUrl;
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY')?.trim();

    if (!externalKey) {
      return new Response(
        JSON.stringify({ error: 'Banco externo não configurado: defina EXTERNAL_SUPABASE_SERVICE_KEY.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    const { action, table, data, id, filters } = await req.json();

    let result;

    switch (action) {
      case 'select':
        let query = externalSupabase.from(table).select('*');
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        result = await query;
        break;

      case 'insert': {
        const payload = normalizeInsertPayload(data);
        result = await externalSupabase.from(table).insert(payload as never).select();
        break;
      }

      case 'update':
        result = await externalSupabase
          .from(table)
          .update(normalizeInsertPayload(data) as never)
          .eq('id', id)
          .select();
        break;

      case 'delete':
        result = await externalSupabase.from(table).delete().eq('id', id);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (result.error) {
      console.error('external-db Supabase error:', result.error.message);
      return new Response(
        JSON.stringify({ error: result.error.message, details: result.error.details, hint: result.error.hint }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('external-db error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
