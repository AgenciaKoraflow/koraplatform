// Edge Function: instagram-credential
// Manages the single Instagram Graph API credential row (instagram_credentials).
// The raw access_token/app_secret NEVER leave this function — see instagram-proxy
// for the function that actually calls the Graph API on behalf of the frontend.
//
// { action: "status" }                                            → any authenticated user: connection metadata only
// { action: "connect", appId, appSecret, accessToken,
//   businessAccountId }                                           → admin only: encrypt + upsert

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── AES-256-GCM crypto helpers (inlined — _shared not bundled by CLI) ───────

const FORMAT_PREFIX = "v1:";
const IV_BYTES = 12;

function uint8ToBase64(arr: Uint8Array): string {
  let str = "";
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
  return btoa(str);
}

function base64ToUint8(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const keyB64 = Deno.env.get("KNOWLEDGE_ENCRYPTION_KEY");
  if (!keyB64) throw new Error("KNOWLEDGE_ENCRYPTION_KEY is not set");
  const keyBytes = base64ToUint8(keyB64);
  if (keyBytes.length !== 32) throw new Error("KNOWLEDGE_ENCRYPTION_KEY must be 32 bytes");
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${FORMAT_PREFIX}${uint8ToBase64(iv)}:${uint8ToBase64(new Uint8Array(ciphertextBuf))}`;
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

async function requireAuth(authHeader: string | null): Promise<string> {
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
  return user.id;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  let userId: string;
  try {
    userId = await requireAuth(req.headers.get("Authorization"));
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return err((e as Error).message, status);
  }

  let body: {
    action?: string;
    appId?: string;
    appSecret?: string;
    accessToken?: string;
    businessAccountId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, serviceKey);

  if (body.action === "status") {
    const { data: row } = await client
      .from("instagram_credentials")
      .select("business_account_id, token_updated_at")
      .order("token_updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ business_account_id: string; token_updated_at: string }>();

    return json({
      data: {
        connected: !!row,
        businessAccountId: row?.business_account_id ?? null,
        tokenUpdatedAt: row?.token_updated_at ?? null,
      },
    });
  }

  if (body.action === "connect") {
    // Defense in depth: don't rely solely on RLS for a live API secret — the app has
    // a history of RLS being loosened for other tables, so check the role here too.
    const { data: profile } = await client.from("profiles").select("role").eq("id", userId).single<{ role: string }>();
    if (profile?.role !== "admin") {
      return err("Apenas administradores podem gerenciar a credencial do Instagram", 403);
    }

    const { appId, appSecret, accessToken, businessAccountId } = body;
    if (!appId || !appSecret || !accessToken || !businessAccountId) {
      return err("appId, appSecret, accessToken e businessAccountId são obrigatórios", 400);
    }

    const [appSecretEncrypted, accessTokenEncrypted] = await Promise.all([
      encrypt(appSecret),
      encrypt(accessToken),
    ]);

    // Single-row credential store: replace whatever is there.
    await client.from("instagram_credentials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await client.from("instagram_credentials").insert({
      app_id: appId,
      app_secret_encrypted: appSecretEncrypted,
      access_token_encrypted: accessTokenEncrypted,
      business_account_id: businessAccountId,
      token_updated_at: new Date().toISOString(),
      updated_by: userId,
    });
    if (error) return err("Falha ao salvar credencial", 400);
    return json({ data: { ok: true } });
  }

  return err("Ação inválida", 400);
});
