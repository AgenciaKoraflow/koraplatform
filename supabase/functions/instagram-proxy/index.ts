// Edge Function: instagram-proxy
// Proxies read-only Instagram Graph API calls on behalf of the frontend.
// The decrypted access token is used here, server-side, to build the request —
// it is never included in the response sent back to the browser.
//
// Body: { operation: "account" | "account-insights" | "media" | "media-insights" | "validate", params?: Record<string, string> }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH_API_BASE = "https://graph.instagram.com/v18.0";
const FETCH_TIMEOUT_MS = 8_000;

// ─── AES-256-GCM crypto helpers (inlined — _shared not bundled by CLI) ───────

const FORMAT_PREFIX = "v1:";

function base64ToUint8(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isEncrypted(value: string): boolean {
  return value.startsWith(FORMAT_PREFIX);
}

async function importKey(): Promise<CryptoKey> {
  const keyB64 = Deno.env.get("KNOWLEDGE_ENCRYPTION_KEY");
  if (!keyB64) throw new Error("KNOWLEDGE_ENCRYPTION_KEY is not set");
  const keyBytes = base64ToUint8(keyB64);
  if (keyBytes.length !== 32) throw new Error("KNOWLEDGE_ENCRYPTION_KEY must be 32 bytes");
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function decrypt(encrypted: string): Promise<string> {
  if (!isEncrypted(encrypted)) return encrypted;
  const payload = encrypted.slice(FORMAT_PREFIX.length);
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid encrypted format");
  const iv = base64ToUint8(payload.slice(0, colonIdx));
  const ciphertext = base64ToUint8(payload.slice(colonIdx + 1));
  const key = await importKey();
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(message: string, status: number): Response {
  return json({ error: message }, status);
}

async function requireAuth(authHeader: string | null): Promise<void> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }
  const token = authHeader.slice(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) {
    throw Object.assign(new Error("Invalid or expired session"), { status: 401 });
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    await requireAuth(req.headers.get("Authorization"));
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return err((e as Error).message, status);
  }

  let body: { operation?: string; params?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { operation, params = {} } = body;
  if (!operation) return err("operation required", 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, serviceKey);

  const { data: row } = await client
    .from("instagram_credentials")
    .select("access_token_encrypted")
    .order("token_updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ access_token_encrypted: string }>();

  if (!row) return err("Instagram não conectado", 404);

  const accessToken = await decrypt(row.access_token_encrypted);

  // The Instagram API with Instagram Login resolves the account directly from
  // the access token, so "/me" is used instead of a separate business account id.
  let path: string;
  switch (operation) {
    case "account":
      path = `/me?fields=${encodeURIComponent(params.fields ?? "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website")}`;
      break;
    case "account-insights":
      path = `/me/insights?metric=${encodeURIComponent(params.metric ?? "reach")}&period=${encodeURIComponent(params.period ?? "week")}`;
      break;
    case "media":
      path = `/me/media?fields=${encodeURIComponent(params.fields ?? "id,caption,media_type,permalink,timestamp,like_count,comments_count")}&limit=${encodeURIComponent(params.limit ?? "50")}`;
      break;
    case "media-insights": {
      if (!params.mediaId) return err("params.mediaId required for media-insights", 400);
      path = `/${encodeURIComponent(params.mediaId)}/insights?metric=${encodeURIComponent(params.metric ?? "likes,comments,saved")}`;
      break;
    }
    case "validate":
      path = `/me?fields=id`;
      break;
    default:
      return err(`Unknown operation: ${operation}`, 400);
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = `${GRAPH_API_BASE}${path}${separator}access_token=${encodeURIComponent(accessToken)}`;

  try {
    const resp = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (operation === "validate") {
      return json({ data: { valid: resp.ok } });
    }
    if (!resp.ok) {
      return err("Instagram Graph API request failed", 502);
    }
    const data = await resp.json();
    return json({ data });
  } catch {
    return err("Instagram Graph API request timed out or failed", 502);
  }
});
