// Edge Function: sign-contract (verify_jwt = false)
// Handles public contract-signing flow — no user auth required.
// All DB access is via service role on the main project.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Fields a signing client is allowed to set on a contract.
const CONTRACT_SIGNING_FIELDS = new Set([
  "client_signed_at",
  "client_signature_data",
  "client_signer_name",
  "client_signer_email",
  "client_cpf",
  "status",
  "fully_signed_at",
  "signed_document_data",
  "document_data",
]);

async function handleSelectContracts(
  client: SupabaseClient,
  filters: Record<string, unknown>,
): Promise<Response> {
  const token = filters.signature_link_token as string | undefined;
  if (!token) return err("signature_link_token required", 400);

  const { data, error } = await client
    .from("contracts")
    .select("*")
    .eq("signature_link_token", token);

  if (error) return err("Query failed", 400);
  return json({ data: data ?? [] });
}

async function handleSelectClients(
  client: SupabaseClient,
  filters: Record<string, unknown>,
  token: string,
): Promise<Response> {
  // Verify the token maps to a real contract before returning client data.
  const { data: contractRows, error: tokenErr } = await client
    .from("contracts")
    .select("id")
    .eq("signature_link_token", token)
    .limit(1);

  if (tokenErr || !contractRows || contractRows.length === 0) {
    return err("Invalid token", 403);
  }

  const clientId = filters.id as string | undefined;
  if (!clientId) return err("id required", 400);

  const { data, error } = await client
    .from("clients")
    .select("*")
    .eq("id", clientId);

  if (error) return err("Query failed", 400);
  return json({ data: data ?? [] });
}

async function handleGetDocumentUrl(
  client: SupabaseClient,
  token: string,
): Promise<Response> {
  const { data: rows, error } = await client
    .from("contracts")
    .select("document_storage_path, signed_document_storage_path, signature_link_expires_at")
    .eq("signature_link_token", token);

  if (error || !rows || rows.length === 0) return err("Contract not found", 404);

  const contract = rows[0] as {
    document_storage_path: string | null;
    signed_document_storage_path: string | null;
    signature_link_expires_at: string | null;
  };

  if (
    contract.signature_link_expires_at &&
    new Date(contract.signature_link_expires_at) < new Date()
  ) {
    return err("Signature link expired", 403);
  }

  const path = contract.signed_document_storage_path || contract.document_storage_path;
  if (!path) return err("No stored document for this contract", 404);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return err("Storage not configured", 500);

  const storageClient = createClient(supabaseUrl, serviceKey);
  const { data: signed, error: signErr } = await storageClient.storage
    .from("contracts-documents")
    .createSignedUrl(path, 3600);

  if (signErr || !signed) return err("Failed to generate document URL", 500);
  return json({ signedUrl: signed.signedUrl });
}

async function handleSignContract(
  client: SupabaseClient,
  token: string,
  rawData: Record<string, unknown>,
): Promise<Response> {
  const { data: rows, error } = await client
    .from("contracts")
    .select("id, signature_link_expires_at, client_signed_at")
    .eq("signature_link_token", token);

  if (error || !rows || rows.length === 0) return err("Contract not found", 404);

  const contract = rows[0] as {
    id: string;
    signature_link_expires_at: string | null;
    client_signed_at: string | null;
  };

  if (contract.client_signed_at) return err("Contract already signed", 409);

  if (
    contract.signature_link_expires_at &&
    new Date(contract.signature_link_expires_at) < new Date()
  ) {
    return err("Signature link expired", 403);
  }

  const payload = Object.fromEntries(
    Object.entries(rawData).filter(([k]) => CONTRACT_SIGNING_FIELDS.has(k)),
  );

  const { data: updated, error: updateError } = await client
    .from("contracts")
    .update(payload)
    .eq("id", contract.id)
    .select();

  if (updateError) return err("Sign failed", 400);
  return json({ data: updated });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return err("Server not configured", 500);

  const client = createClient(supabaseUrl, serviceKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { action, table, filters, data, token } = body as {
    action?: string;
    table?: string;
    filters?: Record<string, unknown>;
    data?: Record<string, unknown>;
    token?: string;
  };

  if (!action) return err("action required", 400);

  if (action === "select" && table === "contracts") {
    if (!filters) return err("filters required", 400);
    return handleSelectContracts(client, filters);
  }

  if (action === "select" && table === "clients") {
    if (!token) return err("token required", 400);
    if (!filters) return err("filters required", 400);
    return handleSelectClients(client, filters, token);
  }

  if (action === "get_document_url") {
    if (!token) return err("token required", 400);
    return handleGetDocumentUrl(client, token);
  }

  if (action === "sign_contract") {
    if (!token) return err("token required", 400);
    if (!data) return err("data required", 400);
    return handleSignContract(client, token, data);
  }

  return err("Unknown action", 400);
});
