import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Lê o JSON do corpo quando a Edge Function retorna 4xx/5xx (o cliente supabase só expõe "non-2xx" por padrão).
 */
export async function getFunctionsHttpErrorDetail(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const res = error.context as Response;
    const clone = res.clone();
    const text = await clone.text();
    if (!text) return null;
    try {
      const json = JSON.parse(text) as { error?: string; details?: string; hint?: string };
      const parts = [json.error, json.details, json.hint].filter(Boolean);
      return parts.length ? parts.join(" — ") : null;
    } catch {
      return text.slice(0, 500);
    }
  } catch {
    return null;
  }
}

export async function formatSupabaseInvokeError(error: unknown): Promise<string> {
  const detail = await getFunctionsHttpErrorDetail(error);
  if (detail) return detail;
  if (error instanceof Error) return error.message;
  return String(error);
}
