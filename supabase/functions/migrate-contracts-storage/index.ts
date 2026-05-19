/**
 * migrate-contracts-storage
 *
 * One-time migration: uploads base64 PDFs from the contracts table to
 * Supabase Storage and replaces them with storage paths.
 *
 * Prerequisites:
 *   1. Run supabase/external-db-migrations/0001_add_contracts_storage_columns.sql
 *      in the external Supabase project SQL editor.
 *   2. Deploy the contracts-documents bucket migration.
 *
 * Invoke with:
 *   curl -X POST https://<main-project>.functions.supabase.co/migrate-contracts-storage \
 *     -H "X-Migration-Secret: <MIGRATION_SECRET>"
 *
 * Safe to call multiple times — already-migrated rows are skipped.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-secret",
};

const BUCKET = "contracts-documents";
const BATCH_SIZE = 5;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface ContractRow {
  id: string;
  document_name: string | null;
  document_data: string | null;
  document_type: string | null;
  signed_document_data: string | null;
  document_storage_path: string | null;
  signed_document_storage_path: string | null;
}

function base64ToUint8Array(base64: string): Uint8Array {
  // Strip data URI prefix if present
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function mimeFromDataUri(dataUri: string | null, fallback = "application/pdf"): string {
  if (!dataUri) return fallback;
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : fallback;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const secret = req.headers.get("X-Migration-Secret");
  const expected = Deno.env.get("MIGRATION_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  // ── Config ───────────────────────────────────────────────────────────────────
  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  const mainUrl = Deno.env.get("SUPABASE_URL");
  const mainKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!extUrl || !extKey || !mainUrl || !mainKey) {
    return json({ error: "Missing environment variables" }, 500);
  }

  const extClient = createClient(extUrl, extKey);
  const mainClient = createClient(mainUrl, mainKey);

  // ── Fetch unmigrated contracts ────────────────────────────────────────────────
  const { data: rows, error: fetchErr } = await extClient
    .from("contracts")
    .select("id, document_name, document_data, document_type, signed_document_data, document_storage_path, signed_document_storage_path")
    .or("document_data.not.is.null,signed_document_data.not.is.null")
    .is("document_storage_path", null)
    .limit(100);

  if (fetchErr) {
    return json({ error: `Failed to fetch contracts: ${fetchErr.message}` }, 500);
  }

  const contracts = (rows ?? []) as ContractRow[];
  let migratedDocs = 0;
  let migratedSigned = 0;
  const errors: string[] = [];

  // ── Process in batches ────────────────────────────────────────────────────────
  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (contract) => {
      const update: Record<string, unknown> = {};

      // Migrate original document
      if (contract.document_data && !contract.document_storage_path) {
        try {
          const bytes = base64ToUint8Array(contract.document_data);
          const mime = mimeFromDataUri(contract.document_data, contract.document_type ?? "application/pdf");
          const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1] || "bin";
          const path = `contracts/${contract.id}/v1/${Date.now()}.${ext}`;

          const { error: uploadErr } = await mainClient.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: mime, cacheControl: "3600", upsert: false });

          if (uploadErr) throw uploadErr;

          update.document_storage_path = path;
          update.document_version = 1;
          update.document_data = null;
          migratedDocs++;
        } catch (e) {
          errors.push(`${contract.id} document: ${String(e)}`);
        }
      }

      // Migrate signed document
      if (contract.signed_document_data && !contract.signed_document_storage_path) {
        try {
          const bytes = base64ToUint8Array(contract.signed_document_data);
          const path = `contracts/${contract.id}/v1/${Date.now()}_signed.pdf`;

          const { error: uploadErr } = await mainClient.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: "application/pdf", cacheControl: "3600", upsert: false });

          if (uploadErr) throw uploadErr;

          update.signed_document_storage_path = path;
          update.signed_document_data = null;
          migratedSigned++;
        } catch (e) {
          errors.push(`${contract.id} signed: ${String(e)}`);
        }
      }

      if (Object.keys(update).length > 0) {
        const { error: updateErr } = await extClient
          .from("contracts")
          .update(update)
          .eq("id", contract.id);

        if (updateErr) {
          errors.push(`${contract.id} DB update: ${updateErr.message}`);
        }
      }
    }));
  }

  return json({
    processed: contracts.length,
    migratedDocs,
    migratedSigned,
    errors,
    remaining: contracts.length === 100 ? "more rows exist — run again" : "done",
  });
});
