import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 8_000;
const HEALTH_RETENTION_DAYS = 7;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Response helpers ──────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Structured logging ────────────────────────────────────────────────────────

function log(level: "INFO" | "WARN" | "ERROR", data: Record<string, unknown>): void {
  const entry = JSON.stringify({ level, ts: new Date().toISOString(), fn: "check-integration-health", ...data });
  if (level === "ERROR") console.error(entry);
  else if (level === "WARN") console.warn(entry);
  else console.log(entry);
}

// ─── Probe helpers ─────────────────────────────────────────────────────────────

interface ProbeResult {
  ok: boolean;
  latencyMs: number;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeSupabase(baseUrl: string, anonKey: string): Promise<ProbeResult> {
  const start = Date.now();
  const res = await fetchWithTimeout(
    `${baseUrl.replace(/\/$/, "")}/rest/v1/`,
    { method: "HEAD", headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    PROBE_TIMEOUT_MS,
  );
  // Supabase REST API returns 2xx/3xx for valid, configured projects.
  // 5xx indicates a server-side problem.
  return { ok: res.status < 500, latencyMs: Date.now() - start };
}

async function probeCoolify(baseUrl: string, apiToken: string): Promise<ProbeResult> {
  const start = Date.now();
  const res = await fetchWithTimeout(
    `${baseUrl.replace(/\/$/, "")}/api/v1/health`,
    { headers: { Authorization: `Bearer ${apiToken}` } },
    PROBE_TIMEOUT_MS,
  );
  return { ok: res.ok, latencyMs: Date.now() - start };
}

// ─── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Authentication required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    log("ERROR", { message: "Missing required env vars" });
    return json({ error: "Server configuration error" }, 500);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Invalid or expired session" }, 401);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { integration_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { integration_id } = body;
  if (!integration_id || typeof integration_id !== "string") {
    return json({ error: "integration_id is required" }, 400);
  }

  // ── Fetch integration config ───────────────────────────────────────────────
  const { data: integration, error: fetchError } = await userClient
    .from("client_integrations" as "clients") // cast to satisfy TS — table exists
    .select("id, integration_type, base_url, api_key, is_enabled")
    .eq("id", integration_id)
    .single();

  if (fetchError || !integration) {
    log("WARN", { action: "fetch_integration", integration_id, error: fetchError?.message });
    return json({ error: "Integration not found" }, 404);
  }

  const { integration_type, base_url, api_key } = integration as {
    integration_type: string;
    base_url?: string;
    api_key?: string;
    is_enabled: boolean;
  };

  // ── Run probe ──────────────────────────────────────────────────────────────
  let isHealthy = false;
  let latencyMs = 0;
  let errorMessage: string | undefined;

  try {
    if (!base_url) throw new Error("Integration has no base_url configured");
    if (!api_key) throw new Error("Integration has no api_key configured");

    let result: ProbeResult;
    if (integration_type === "supabase") {
      result = await probeSupabase(base_url, api_key);
    } else if (integration_type === "coolify") {
      result = await probeCoolify(base_url, api_key);
    } else {
      throw new Error(`Unsupported integration type: ${integration_type}`);
    }

    isHealthy = result.ok;
    latencyMs = result.latencyMs;
  } catch (e) {
    const msg = (e as Error).message;
    // AbortError = probe timed out
    isHealthy = false;
    errorMessage = (e as Error).name === "AbortError" ? `Probe timed out after ${PROBE_TIMEOUT_MS}ms` : msg;
    log("WARN", { action: "probe", integration_id, integration_type, error: errorMessage });
  }

  // ── Persist result ─────────────────────────────────────────────────────────
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const checkedAt = new Date().toISOString();

  const { error: insertError } = await serviceClient
    .from("integration_health" as "clients")
    .insert({
      integration_id,
      is_healthy: isHealthy,
      response_time_ms: latencyMs || null,
      error_message: errorMessage ?? null,
    } as unknown as Record<string, unknown>);

  if (insertError) {
    log("ERROR", { action: "persist_health", integration_id, error: insertError.message });
  }

  // ── Purge old records (non-blocking) ──────────────────────────────────────
  serviceClient
    .from("integration_health" as "clients")
    .delete()
    .eq("integration_id", integration_id)
    .lt("checked_at", new Date(Date.now() - HEALTH_RETENTION_DAYS * 86_400_000).toISOString())
    .then(({ error }) => {
      if (error) log("WARN", { action: "purge_health", integration_id, error: error.message });
    });

  log("INFO", { action: "complete", integration_id, integration_type, is_healthy: isHealthy, latency_ms: latencyMs });

  return json({ integration_id, is_healthy: isHealthy, response_time_ms: latencyMs || null, error_message: errorMessage ?? null, checked_at: checkedAt });
});
