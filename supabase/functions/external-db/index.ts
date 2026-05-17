import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt, decrypt, isEncrypted } from "./crypto.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-secret",
};

type Action =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "get_password"
  | "migrate_encrypt_passwords";

type Table =
  | "clients"
  | "projects"
  | "tasks"
  | "contracts"
  | "knowledge_items"
  | "support_tickets";

interface RequestBody {
  action: Action;
  table: Table;
  data?: Record<string, unknown>;
  id?: string;
  filters?: Record<string, unknown>;
}

interface KnowledgeRow {
  id: string;
  password: string | null;
  [key: string]: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function stripPassword(row: KnowledgeRow): Record<string, unknown> {
  const { password, ...rest } = row;
  return { ...rest, has_password: password !== null && password !== "" };
}

async function handleGetPassword(
  client: SupabaseClient,
  id: string,
  authHeader: string | null,
): Promise<Response> {
  if (!authHeader) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const { data: row, error } = await client
    .from("knowledge_items")
    .select("password")
    .eq("id", id)
    .single<KnowledgeRow>();

  if (error) return jsonResponse({ error: error.message }, 400);
  if (!row?.password) return jsonResponse({ data: null });

  const plaintext = await decrypt(row.password);
  return jsonResponse({ data: { password: plaintext } });
}

async function handleMigrateEncryptPasswords(
  client: SupabaseClient,
  migrationSecret: string | null,
): Promise<Response> {
  const expectedSecret = Deno.env.get("MIGRATION_SECRET");
  if (!expectedSecret || migrationSecret !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: rows, error } = await client
    .from("knowledge_items")
    .select("id, password")
    .not("password", "is", null);

  if (error) return jsonResponse({ error: error.message }, 400);

  let migrated = 0;
  for (const row of (rows ?? []) as KnowledgeRow[]) {
    if (row.password && !isEncrypted(row.password)) {
      const encryptedPw = await encrypt(row.password);
      await client
        .from("knowledge_items")
        .update({ password: encryptedPw })
        .eq("id", row.id);
      migrated++;
    }
  }

  return jsonResponse({ data: { migrated } });
}

async function handleSelect(
  client: SupabaseClient,
  table: Table,
  filters: Record<string, unknown> | undefined,
): Promise<Response> {
  let query = client.from(table).select("*");
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value as string);
    }
  }

  const { data: rows, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 400);

  if (table === "knowledge_items" && rows) {
    return jsonResponse({ data: (rows as KnowledgeRow[]).map(stripPassword) });
  }
  return jsonResponse({ data: rows });
}

async function handleInsert(
  client: SupabaseClient,
  table: Table,
  data: Record<string, unknown>,
): Promise<Response> {
  const payload = { ...data };

  if (table === "knowledge_items" && payload.password) {
    payload.password = await encrypt(String(payload.password));
  }

  const { data: rows, error } = await client.from(table).insert(payload).select();
  if (error) return jsonResponse({ error: error.message }, 400);

  if (table === "knowledge_items" && rows) {
    return jsonResponse({ data: (rows as KnowledgeRow[]).map(stripPassword) });
  }
  return jsonResponse({ data: rows });
}

async function handleUpdate(
  client: SupabaseClient,
  table: Table,
  id: string,
  data: Record<string, unknown>,
): Promise<Response> {
  const payload = { ...data };

  if (table === "knowledge_items") {
    if ("password" in payload && payload.password) {
      payload.password = await encrypt(String(payload.password));
    } else {
      // Never clear or touch password when not explicitly provided
      delete payload.password;
    }
  }

  const { data: rows, error } = await client.from(table).update(payload).eq("id", id).select();
  if (error) return jsonResponse({ error: error.message }, 400);

  if (table === "knowledge_items" && rows) {
    return jsonResponse({ data: (rows as KnowledgeRow[]).map(stripPassword) });
  }
  return jsonResponse({ data: rows });
}

async function handleDelete(
  client: SupabaseClient,
  table: Table,
  id: string,
): Promise<Response> {
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) return jsonResponse({ error: error.message }, 400);
  return jsonResponse({ data: null });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!extUrl || !extKey) {
      return jsonResponse({ error: "External DB not configured" }, 500);
    }

    const client = createClient(extUrl, extKey);

    const body = (await req.json()) as RequestBody;
    const { action, table, data, id, filters } = body;

    if (action === "get_password") {
      if (!id) return jsonResponse({ error: "id required for get_password" }, 400);
      return handleGetPassword(client, id, req.headers.get("Authorization"));
    }

    if (action === "migrate_encrypt_passwords") {
      return handleMigrateEncryptPasswords(
        client,
        req.headers.get("X-Migration-Secret"),
      );
    }

    if (action === "select") {
      return handleSelect(client, table, filters);
    }

    if (action === "insert") {
      if (!data) return jsonResponse({ error: "data required for insert" }, 400);
      return handleInsert(client, table, data);
    }

    if (action === "update") {
      if (!id) return jsonResponse({ error: "id required for update" }, 400);
      if (!data) return jsonResponse({ error: "data required for update" }, 400);
      return handleUpdate(client, table, id, data);
    }

    if (action === "delete") {
      if (!id) return jsonResponse({ error: "id required for delete" }, 400);
      return handleDelete(client, table, id);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
});
