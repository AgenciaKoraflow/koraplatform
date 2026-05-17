import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ZodError } from "https://esm.sh/zod@3.23.8";
import { encrypt, decrypt, isEncrypted } from "./crypto.ts";
import {
  RequestSchema,
  TABLE_ALLOWED_ACTIONS,
  sanitizePayload,
  sanitizeFilters,
  type Table,
  type Action,
} from "../_shared/schemas.ts";
import { checkRateLimit, GENERAL_LIMIT, SENSITIVE_LIMIT } from "../_shared/rateLimit.ts";
import { audit, auditConfigError } from "../_shared/audit.ts";

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-migration-secret",
};

// ─── Response helpers ─────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(message: string, status: number): Response {
  return json({ error: message }, status);
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface KnowledgeRow {
  id: string;
  password: string | null;
  [key: string]: unknown;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

interface AuthResult {
  userId: string;
  token: string;
}

/**
 * Validates the request JWT against the main Supabase project.
 * Returns userId on success; throws with a user-safe message on failure.
 *
 * OWASP A01: Broken Access Control — every mutating request requires a valid session.
 */
async function requireAuth(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  const token = authHeader.slice(7);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    auditConfigError("SUPABASE_URL or SUPABASE_ANON_KEY not configured");
    throw Object.assign(new Error("Server configuration error"), { status: 500 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) {
    throw Object.assign(new Error("Invalid or expired session"), { status: 401 });
  }

  return { userId: user.id, token };
}

// ─── Knowledge item password helpers ─────────────────────────────────────────

function stripPassword(row: KnowledgeRow): Record<string, unknown> {
  const { password, ...rest } = row;
  return { ...rest, has_password: password !== null && password !== "" };
}

// ─── Action handlers ──────────────────────────────────────────────────────────

async function handleSelect(
  client: SupabaseClient,
  table: Table,
  filters: Record<string, unknown> | undefined,
): Promise<Response> {
  let query = client.from(table).select("*");

  if (filters) {
    const safe = sanitizeFilters(table, filters);
    for (const [key, value] of Object.entries(safe)) {
      query = query.eq(key, value as string);
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    // Never forward raw DB error messages — they may contain schema info.
    return err("Query failed", 400);
  }

  if (table === "knowledge_items" && rows) {
    return json({ data: (rows as KnowledgeRow[]).map(stripPassword) });
  }
  return json({ data: rows });
}

async function handleInsert(
  client: SupabaseClient,
  table: Table,
  rawData: Record<string, unknown>,
): Promise<Response> {
  const payload = sanitizePayload(table, rawData);

  if (table === "knowledge_items" && payload.password) {
    payload.password = await encrypt(String(payload.password));
  }

  const { data: rows, error } = await client.from(table).insert(payload).select();
  if (error) return err("Insert failed", 400);

  if (table === "knowledge_items" && rows) {
    return json({ data: (rows as KnowledgeRow[]).map(stripPassword) });
  }
  return json({ data: rows });
}

async function handleUpdate(
  client: SupabaseClient,
  table: Table,
  id: string,
  rawData: Record<string, unknown>,
): Promise<Response> {
  const payload = sanitizePayload(table, rawData);

  if (table === "knowledge_items") {
    if ("password" in payload && payload.password) {
      payload.password = await encrypt(String(payload.password));
    } else {
      // Never touch the password column unless the caller explicitly set one.
      delete payload.password;
    }
  }

  const { data: rows, error } = await client.from(table).update(payload).eq("id", id).select();
  if (error) return err("Update failed", 400);

  if (table === "knowledge_items" && rows) {
    return json({ data: (rows as KnowledgeRow[]).map(stripPassword) });
  }
  return json({ data: rows });
}

async function handleDelete(
  client: SupabaseClient,
  table: Table,
  id: string,
): Promise<Response> {
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) return err("Delete failed", 400);
  return json({ data: null });
}

async function handleGetPassword(
  client: SupabaseClient,
  id: string,
): Promise<Response> {
  const { data: row, error } = await client
    .from("knowledge_items")
    .select("password")
    .eq("id", id)
    .single<KnowledgeRow>();

  if (error) return err("Record not found", 404);
  if (!row?.password) return json({ data: null });

  const plaintext = await decrypt(row.password);
  return json({ data: { password: plaintext } });
}

async function handleMigrateEncryptPasswords(
  client: SupabaseClient,
  migrationSecret: string | null,
): Promise<Response> {
  const expected = Deno.env.get("MIGRATION_SECRET");
  if (!expected || migrationSecret !== expected) {
    return err("Unauthorized", 401);
  }

  const { data: rows, error } = await client
    .from("knowledge_items")
    .select("id, password")
    .not("password", "is", null);

  if (error) return err("Migration query failed", 400);

  let migrated = 0;
  for (const row of (rows ?? []) as KnowledgeRow[]) {
    if (row.password && !isEncrypted(row.password)) {
      const encrypted = await encrypt(row.password);
      await client.from("knowledge_items").update({ password: encrypted }).eq("id", row.id);
      migrated++;
    }
  }

  return json({ data: { migrated } });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ── 1. External DB config ──────────────────────────────────────────────────
  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!extUrl || !extKey) {
    auditConfigError("EXTERNAL_SUPABASE_URL or EXTERNAL_SUPABASE_SERVICE_ROLE_KEY not configured");
    return err("External DB not configured", 500);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // ── 2. Migration endpoint (separate secret, no user auth) ─────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return err(formatZodError(parsed.error), 422);
  }

  const { action, table, data, id, filters } = parsed.data as {
    action: Action;
    table: Table;
    data?: Record<string, unknown>;
    id?: string;
    filters?: Record<string, unknown>;
  };

  if (action === "migrate_encrypt_passwords") {
    audit({ action, table, userId: null, ip, userAgent, outcome: "success" });
    const client = createClient(extUrl, extKey);
    return handleMigrateEncryptPasswords(client, req.headers.get("X-Migration-Secret"));
  }

  // ── 3. Auth — all other actions require a valid session ───────────────────
  let auth: { userId: string; token: string };
  try {
    auth = await requireAuth(req.headers.get("Authorization"));
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    audit({ action, table, userId: null, ip, userAgent, outcome: "denied", errorCode: "AUTH_FAILED" });
    return err((e as Error).message, status);
  }

  const { userId } = auth;

  // ── 4. Action/table permission matrix ─────────────────────────────────────
  if (!TABLE_ALLOWED_ACTIONS[table].has(action as Action)) {
    audit({ action, table, recordId: id, userId, ip, userAgent, outcome: "denied", errorCode: "ACTION_NOT_ALLOWED" });
    return err(`Action '${action}' is not allowed on '${table}'`, 403);
  }

  // ── 5. Rate limiting ───────────────────────────────────────────────────────
  const limitConfig = action === "get_password" ? SENSITIVE_LIMIT : GENERAL_LIMIT;
  const rl = checkRateLimit(`${userId}:${action}`, limitConfig);
  if (!rl.allowed) {
    audit({ action, table, userId, ip, userAgent, outcome: "denied", errorCode: "RATE_LIMITED" });
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rl.resetAt),
      },
    });
  }

  // ── 6. Dispatch ────────────────────────────────────────────────────────────
  const client = createClient(extUrl, extKey);

  try {
    let response: Response;

    if (action === "get_password") {
      if (!id) return err("id required for get_password", 400);
      response = await handleGetPassword(client, id);
    } else if (action === "select") {
      response = await handleSelect(client, table, filters);
    } else if (action === "insert") {
      if (!data) return err("data required for insert", 400);
      response = await handleInsert(client, table, data);
    } else if (action === "update") {
      if (!id) return err("id required for update", 400);
      if (!data) return err("data required for update", 400);
      response = await handleUpdate(client, table, id, data);
    } else if (action === "delete") {
      if (!id) return err("id required for delete", 400);
      response = await handleDelete(client, table, id);
    } else {
      return err("Unknown action", 400);
    }

    audit({
      action,
      table,
      recordId: id,
      userId,
      ip,
      userAgent,
      outcome: response.ok ? "success" : "error",
    });

    return response;
  } catch (e) {
    audit({ action, table, recordId: id, userId, ip, userAgent, outcome: "error", errorCode: "HANDLER_EXCEPTION" });
    console.error(JSON.stringify({ level: "ERROR", fn: "external-db", action, table, message: String(e) }));
    return err("Internal server error", 500);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatZodError(error: ZodError): string {
  return error.issues
    .map((i: { path: (string | number)[]; message: string }) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
}
