import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Supported tables for CRUD operations
const ALLOWED_TABLES = [
  'clients',
  'projects', 
  'tasks',
  'proposals',
  'contracts',
  'knowledge_items',
  'support_tickets',
  'financial_transactions'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API Key
    const apiKey = req.headers.get('x-api-key');
    const storedApiKey = Deno.env.get('N8N_API_KEY');
    
    if (!storedApiKey) {
      console.error('N8N_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API not configured. Please set N8N_API_KEY in secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey || apiKey !== storedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid API key.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get external Supabase credentials
    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY');

    if (!externalUrl || !externalKey) {
      console.error('Missing external Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'External database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalSupabase = createClient(externalUrl, externalKey);

    // Parse request body
    const { action, table, data, id, filters, limit, offset, order_by, order_direction } = await req.json();
    
    console.log(`N8N API: ${action} on ${table}`, { id, filters, limit, offset });

    // Validate table name
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid table. Allowed tables: ${ALLOWED_TABLES.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    const validActions = ['select', 'insert', 'update', 'delete', 'upsert'];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid action. Allowed actions: ${validActions.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'select': {
        let query = externalSupabase.from(table).select('*');
        
        // Apply filters
        if (filters && typeof filters === 'object') {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }
        
        // Apply ordering
        if (order_by) {
          query = query.order(order_by, { ascending: order_direction !== 'desc' });
        }
        
        // Apply pagination
        if (limit) {
          query = query.limit(limit);
        }
        if (offset) {
          query = query.range(offset, offset + (limit || 100) - 1);
        }
        
        result = await query;
        break;
      }

      case 'insert': {
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Data is required for insert action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await externalSupabase.from(table).insert(data).select();
        break;
      }

      case 'update': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for update action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Data is required for update action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Add updated_at timestamp
        const updateData = { ...data, updated_at: new Date().toISOString() };
        result = await externalSupabase.from(table).update(updateData).eq('id', id).select();
        break;
      }

      case 'upsert': {
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Data is required for upsert action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await externalSupabase.from(table).upsert(data).select();
        break;
      }

      case 'delete': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for delete action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await externalSupabase.from(table).delete().eq('id', id);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`N8N API: Success - ${action} on ${table}`);
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result.data,
        count: Array.isArray(result.data) ? result.data.length : 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in n8n-api function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
