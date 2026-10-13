// Edge Function: sign-contract (verify_jwt = false)
// Handles public contract-signing flow — no user auth required.
// All DB access is via service role on the main project.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildSignedPdf } from "./signed-pdf.ts";

const BUCKET = "contracts-documents";

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

interface SignerMeta {
  ip: string | null;
  userAgent: string | null;
}

function getSignerMeta(req: Request): SignerMeta {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || req.headers.get("x-real-ip") || null,
    userAgent: req.headers.get("user-agent"),
  };
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Generates the signed PDF (signatures stamped + signature report page),
 * stores it and returns its storage path. The original file is never modified.
 */
async function generateSignedDocument(
  client: SupabaseClient,
  contract: Record<string, unknown>,
  clientMeta: SignerMeta,
): Promise<{ path: string; hash: string | null }> {
  const str = (key: string) => (contract[key] as string | null | undefined) ?? null;

  let original: Uint8Array | null = null;
  const originalPath = str("document_storage_path");
  if (originalPath) {
    const { data: file, error } = await client.storage.from(BUCKET).download(originalPath);
    if (error || !file) throw new Error(`Original document download failed: ${error?.message}`);
    original = new Uint8Array(await file.arrayBuffer());
  } else if (str("document_data")) {
    original = dataUrlToBytes(str("document_data")!);
  }

  const { pdf, hash } = await buildSignedPdf({
    original,
    originalType: str("document_type") ?? "",
    documentName: str("document_name") ?? "",
    contractId: contract.id as string,
    contractTitle: str("title") ?? "Contrato",
    createdAt: str("created_at"),
    contractor: {
      role: "Contratada",
      name: str("koraflow_signer_name") ?? str("contractor_signer_name") ?? "Koraflow",
      email: str("koraflow_signer_email") ?? str("contractor_signer_email"),
      signedAt: str("koraflow_signed_at") ?? str("contractor_signed_at") ?? "",
      signatureData: str("koraflow_signature_data") ?? str("contractor_signature_data"),
    },
    client: {
      role: "Contratante",
      name: str("client_signer_name") ?? "",
      email: str("client_signer_email"),
      cpf: str("client_cpf"),
      signedAt: str("client_signed_at") ?? "",
      signatureData: str("client_signature_data"),
      ip: clientMeta.ip,
      userAgent: clientMeta.userAgent,
    },
  });

  const path = `contracts/${contract.id}/signed/${Date.now()}.pdf`;
  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`Signed document upload failed: ${uploadError.message}`);
  return { path, hash };
}

/** Rebuilds the signed PDF of a fully signed contract. Staff only (requires a user session). */
async function handleRegenerateSignedDocument(
  client: SupabaseClient,
  req: Request,
  contractId: string,
): Promise<Response> {
  const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return err("Unauthorized", 401);
  const { data: userData, error: userError } = await client.auth.getUser(jwt);
  if (userError || !userData?.user) return err("Unauthorized", 401);

  const { data: rows, error } = await client.from("contracts").select("*").eq("id", contractId);
  if (error || !rows || rows.length === 0) return err("Contract not found", 404);
  const contract = rows[0] as Record<string, unknown>;
  if (!contract.client_signed_at) return err("Contract not fully signed", 409);

  // IP and device were recorded when the client signed.
  const { data: audit } = await client
    .from("signature_audit_log")
    .select("ip_address, user_agent")
    .eq("contract_id", contractId)
    .eq("event_type", "client_signed")
    .order("created_at", { ascending: false })
    .limit(1);
  const meta: SignerMeta = {
    ip: (audit?.[0]?.ip_address as string | null) ?? null,
    userAgent: (audit?.[0]?.user_agent as string | null) ?? null,
  };

  try {
    const { path } = await generateSignedDocument(client, contract, meta);
    const { error: updateError } = await client
      .from("contracts")
      .update({ signed_document_storage_path: path })
      .eq("id", contractId);
    if (updateError) return err("Update failed", 400);
    return json({ path });
  } catch (e) {
    console.error("Signed document generation failed:", e);
    return err("Failed to generate signed document", 500);
  }
}

async function handleSignContract(
  client: SupabaseClient,
  token: string,
  rawData: Record<string, unknown>,
  meta: SignerMeta,
): Promise<Response> {
  const { data: rows, error } = await client
    .from("contracts")
    .select("*")
    .eq("signature_link_token", token);

  if (error || !rows || rows.length === 0) return err("Contract not found", 404);

  const contract = rows[0] as Record<string, unknown> & {
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

  // The signing moment is set by the server, not by the browser.
  const now = new Date().toISOString();
  payload.client_signed_at = now;
  payload.fully_signed_at = now;
  payload.status = "signed";

  // A failure here must not block the signature: the document can be regenerated later.
  let documentHash: string | null = null;
  try {
    const signed = await generateSignedDocument(client, { ...contract, ...payload }, meta);
    payload.signed_document_storage_path = signed.path;
    documentHash = signed.hash;
  } catch (e) {
    console.error("Signed document generation failed:", e);
  }

  const { data: updated, error: updateError } = await client
    .from("contracts")
    .update(payload)
    .eq("id", contract.id)
    .select();

  if (updateError) {
    console.error("Sign failed:", updateError.message);
    return err("Sign failed", 400);
  }

  const { error: auditError } = await client.from("signature_audit_log").insert({
    contract_id: contract.id,
    event_type: "client_signed",
    ip_address: meta.ip,
    user_agent: meta.userAgent,
    event_data: {
      signer_name: payload.client_signer_name ?? null,
      signer_email: payload.client_signer_email ?? null,
      original_document_sha256: documentHash,
      signed_document_storage_path: payload.signed_document_storage_path ?? null,
    },
  });
  if (auditError) console.error("Audit log failed:", auditError.message);

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

  const { action, table, filters, data, token, contractId } = body as {
    action?: string;
    table?: string;
    filters?: Record<string, unknown>;
    data?: Record<string, unknown>;
    token?: string;
    contractId?: string;
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
    return handleSignContract(client, token, data, getSignerMeta(req));
  }

  if (action === "regenerate_signed_document") {
    if (!contractId) return err("contractId required", 400);
    return handleRegenerateSignedDocument(client, req, contractId);
  }

  return err("Unknown action", 400);
});
