// Edge Function: change-password
// Validates password strength, checks against recent password history (PBKDF2),
// updates the Supabase auth password, and records the new hash in password_history.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

// PBKDF2 hash using user_id as salt — prevents cross-user rainbow tables.
// We keep 10 previous hashes to prevent reuse of recent passwords.
async function hashPassword(password: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = encoder.encode(userId.replace(/-/g, ""));
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
  if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula.";
  if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "A senha deve conter pelo menos um caractere especial.";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return err("Authentication required", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate caller session
  const token = authHeader.slice(7);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return err("Invalid or expired session", 401);
  }

  let body: { new_password?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { new_password } = body;
  if (!new_password) return err("new_password is required", 400);

  const strengthError = validatePasswordStrength(new_password);
  if (strengthError) return err(strengthError, 422);

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Fetch recent password hashes for this user (last 10)
  const { data: history } = await adminClient
    .from("password_history")
    .select("password_hash")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (history && history.length > 0) {
    const newHash = await hashPassword(new_password, user.id);
    const isReused = history.some((row: { password_hash: string }) => row.password_hash === newHash);
    if (isReused) {
      return err("A nova senha não pode ser igual a uma senha utilizada anteriormente.", 422);
    }
  }

  // Update the auth password via admin API
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password: new_password,
  });
  if (updateError) {
    return err(updateError.message ?? "Failed to update password", 400);
  }

  // Mark first_login as done and record password change timestamp
  await adminClient
    .from("profiles")
    .update({ first_login: false, password_changed_at: new Date().toISOString() })
    .eq("id", user.id);

  // Store the new hash in history
  const newHash = await hashPassword(new_password, user.id);
  await adminClient.from("password_history").insert({ user_id: user.id, password_hash: newHash });

  // Keep only the 10 most recent entries — clean up older ones
  const { data: allHistory } = await adminClient
    .from("password_history")
    .select("id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (allHistory && allHistory.length > 10) {
    const toDelete = allHistory.slice(10).map((r: { id: string }) => r.id);
    await adminClient.from("password_history").delete().in("id", toDelete);
  }

  return json({ ok: true });
});
