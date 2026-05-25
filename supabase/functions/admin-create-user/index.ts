// Edge Function: admin-create-user
// Only callable by authenticated users with role = 'admin'.
// Creates a new Supabase auth user + profile row with the specified role.
// The on_auth_user_created trigger handles profile creation via raw_user_meta_data.
// Returns a one-time temporary password; the user is forced to change it on first login.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Avoids ambiguous characters (0/O, 1/l/I) so the password is easy to transcribe.
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

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

  // Validate the calling user's session
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.slice(7);
  const { data: { user: callerUser }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !callerUser) {
    return err("Invalid or expired session", 401);
  }

  // Check that caller is an admin
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerUser.id)
    .single<{ role: string }>();

  if (profileError || !callerProfile || callerProfile.role !== "admin") {
    return err("Forbidden: admin access required", 403);
  }

  let body: { email?: string; full_name?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { email, full_name, role } = body;
  if (!email) return err("email is required", 400);
  if (!full_name) return err("full_name is required", 400);

  const validRoles = ["admin", "operador", "observador"];
  const targetRole = validRoles.includes(role ?? "") ? role : "observador";

  const tempPassword = generateTempPassword();

  // Create the auth user with a known password — no invite email is sent.
  // email_confirm: true marks the account as verified immediately.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: targetRole,
    },
  });

  if (createError) {
    // Surface duplicate email as a friendly message
    if (createError.message?.includes("already been registered")) {
      return err("Este e-mail já está cadastrado na plataforma.", 409);
    }
    return err(createError.message ?? "Failed to create user", 400);
  }

  return json({ user_id: created.user.id, temp_password: tempPassword });
});
