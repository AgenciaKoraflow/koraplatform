/**
 * migrate-passwords
 *
 * One-time migration: encrypts all plaintext passwords in knowledge_items
 * using AES-256-GCM (same algorithm as get-password).
 *
 * Safe to call multiple times — already-encrypted rows (prefix "v1:") are skipped.
 *
 * Invoke with:
 *   curl -X POST https://<project>.supabase.co/functions/v1/migrate-passwords \
 *     -H "X-Migration-Secret: <MIGRATION_SECRET>"
 *
 * Returns: { migrated: N, skipped: N, errors: [...] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── AES-256-GCM (inlined — same as get-password) ────────────────────────────

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
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-migration-secret",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const secret = req.headers.get("X-Migration-Secret");
  const expected = Deno.env.get("MIGRATION_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, serviceKey);

  // Fetch all rows that have a password but are not yet encrypted
  const { data: rows, error: fetchErr } = await client
    .from("knowledge_items")
    .select("id, password")
    .not("password", "is", null)
    .not("password", "like", `${FORMAT_PREFIX}%`)
    .limit(BATCH_SIZE);

  if (fetchErr) {
    return json({ error: `Fetch failed: ${fetchErr.message}` }, 500);
  }

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows ?? []) {
    const { id, password } = row as { id: string; password: string };

    if (!password || password.startsWith(FORMAT_PREFIX)) {
      skipped++;
      continue;
    }

    try {
      const encrypted = await encrypt(password);
      const { error: updateErr } = await client
        .from("knowledge_items")
        .update({ password: encrypted })
        .eq("id", id);

      if (updateErr) throw new Error(updateErr.message);
      migrated++;
    } catch (e) {
      errors.push(`${id}: ${String(e)}`);
    }
  }

  const remaining = (rows?.length ?? 0) === BATCH_SIZE
    ? "may have more rows — call again"
    : "done";

  return json({ migrated, skipped, errors, remaining });
});
