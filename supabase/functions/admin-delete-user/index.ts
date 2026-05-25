// Edge Function: admin-delete-user
// Only callable by authenticated users with role = 'admin'.
// Deletes a Supabase auth user (cascades to profiles via ON DELETE CASCADE).

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

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Check that caller is an admin
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", callerUser.id)
    .single<{ role: string }>();

  if (profileError || !callerProfile || callerProfile.role !== "admin") {
    return err("Forbidden: admin access required", 403);
  }

  let body: { user_id?: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { user_id } = body;
  if (!user_id) return err("user_id is required", 400);

  // Prevent self-deletion
  if (user_id === callerUser.id) {
    return err("Não é possível excluir sua própria conta.", 400);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);

  if (deleteError) {
    console.error("admin-delete-user error:", JSON.stringify(deleteError));
    return err(deleteError.message ?? "Failed to delete user", 400);
  }

  return json({ success: true });
});
