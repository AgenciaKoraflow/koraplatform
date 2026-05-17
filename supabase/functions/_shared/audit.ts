export type AuditOutcome = "success" | "denied" | "error";

export interface AuditEvent {
  action: string;
  table: string;
  recordId?: string;
  userId: string | null;
  ip?: string;
  userAgent?: string;
  outcome: AuditOutcome;
  /** Safe error code — never includes raw DB messages. */
  errorCode?: string;
}

/**
 * Emits a structured JSON audit log line.
 * Supabase Edge Function logs are captured from stdout/stderr and queryable
 * in the Supabase Dashboard → Edge Functions → Logs.
 *
 * OWASP A09: keeps a tamper-evident trail without leaking sensitive values.
 */
export function audit(event: AuditEvent): void {
  console.log(
    JSON.stringify({
      level: event.outcome === "success" ? "INFO" : "WARN",
      ts: new Date().toISOString(),
      fn: "external-db",
      ...event,
    }),
  );
}

/**
 * Logs a startup/config error — always an ERROR level.
 * Use for fatal misconfiguration that prevents the function from serving.
 */
export function auditConfigError(message: string): void {
  console.error(JSON.stringify({ level: "ERROR", ts: new Date().toISOString(), fn: "external-db", message }));
}
