// Edge Function: get-password
// Read mode:  { id }           → validate JWT, decrypt and return password
// Write mode: { id, password } → validate JWT, encrypt and save password
// Requires a valid user session in both modes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt, decrypt } from "../_shared/crypto.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

  let body: { id?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { id, password } = body;
  if (!id) return err("id required", 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, serviceKey);

  // Write mode: encrypt and save
  if (password !== undefined && password !== null) {
    const encrypted = await encrypt(String(password));
    const { error } = await client
      .from("knowledge_items")
      .update({ password: encrypted })
      .eq("id", id);
    if (error) return err("Failed to save password", 400);
    return json({ data: { ok: true } });
  }

  // Read mode: fetch and decrypt
  const { data: row, error } = await client
    .from("knowledge_items")
    .select("password")
    .eq("id", id)
    .single<{ password: string | null }>();

  if (error) return err("Record not found", 404);
  if (!row?.password) return json({ data: null });

  const plaintext = await decrypt(row.password);
  return json({ data: { password: plaintext } });
});
