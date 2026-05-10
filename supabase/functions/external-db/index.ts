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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Prefer EXTERNAL_*; se não houver, usa o próprio projeto (útil em dev e deploy sem DB externo).
    const externalUrl =
      Deno.env.get('EXTERNAL_SUPABASE_URL')?.trim() || Deno.env.get('SUPABASE_URL')?.trim();
    const externalKey =
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY')?.trim() ||
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();

    if (!externalUrl || !externalKey) {
      console.error('Missing Supabase URL or service key (EXTERNAL_* or SUPABASE_*)');
      return new Response(
        JSON.stringify({
          error:
            'Banco não configurado: defina EXTERNAL_SUPABASE_URL + EXTERNAL_SUPABASE_SERVICE_KEY no Edge Function, ou use o projeto padrão (SUPABASE_URL já disponível na função).',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    const { action, table, data, id, filters } = await req.json();
    console.log(`External DB operation: ${action} on ${table}`, { id, filters });

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
      console.error('Supabase error:', result.error);
      console.error('Data that was sent:', JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({ error: result.error.message, details: result.error.details, hint: result.error.hint }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Operation successful: ${action} on ${table}`);
    return new Response(
      JSON.stringify({ data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in external-db function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
