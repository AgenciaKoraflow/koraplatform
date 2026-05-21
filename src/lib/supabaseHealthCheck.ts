import { supabase } from '@/integrations/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  timestamp: string;
  status: 'healthy' | 'warning' | 'error';
  connection: ConnectionStatus;
  database: DatabaseStatus;
  persistence: PersistenceStatus;
  functions: FunctionsStatus;
  summary: string;
  durationMs: number;
}

export interface ConnectionStatus {
  connected: boolean;
  latency: number;
  error?: string;
}

export interface DatabaseStatus {
  reachable: boolean;
  tables: TableStatus[];
  error?: string;
}

export interface TableStatus {
  name: string;
  accessible: boolean;
  latency: number;
  count?: number;
  lastChecked: string;
  error?: string;
}

export interface PersistenceStatus {
  working: boolean;
  writeTime: number;
  readTime: number;
  readValue?: string;
  error?: string;
}

export interface FunctionsStatus {
  accessible: boolean;
  available: string[];
  latency: number;
  error?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CHECK_TIMEOUT_MS = 8_000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 400;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number, delayMs: number): Promise<T> {
  let lastErr: Error = new Error('No attempts made');
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

function structuredLog(
  level: 'INFO' | 'WARN' | 'ERROR',
  component: string,
  data: Record<string, unknown>,
): void {
  const entry = JSON.stringify({
    level,
    ts: new Date().toISOString(),
    component: `health-check.${component}`,
    ...data,
  });
  if (level === 'ERROR') console.error(entry);
  else if (level === 'WARN') console.warn(entry);
  else console.log(entry);
}

// ─── Connection check ──────────────────────────────────────────────────────────

async function checkConnection(): Promise<ConnectionStatus> {
  const start = Date.now();
  try {
    const { error } = await withTimeout(
      supabase.from('system_health_checks').select('id', { count: 'exact', head: true }).limit(1),
      CHECK_TIMEOUT_MS,
      'connection',
    );
    const latency = Date.now() - start;
    if (error) return { connected: false, latency, error: error.message };
    return { connected: true, latency };
  } catch (e) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// ─── Database tables check (parallel) ─────────────────────────────────────────

const MONITORED_TABLES = [
  'financial_transactions',
  'okr_objectives',
  'okr_updates',
  'signature_audit_log',
] as const;

async function checkDatabase(): Promise<DatabaseStatus> {
  const settled = await Promise.allSettled(
    MONITORED_TABLES.map(async (table): Promise<TableStatus> => {
      const start = Date.now();
      try {
        const { count, error } = await withTimeout(
          supabase.from(table).select('*', { count: 'exact', head: true }).limit(1),
          CHECK_TIMEOUT_MS,
          `table:${table}`,
        );
        const latency = Date.now() - start;
        if (error) {
          return { name: table, accessible: false, latency, lastChecked: new Date().toISOString(), error: error.message };
        }
        return { name: table, accessible: true, latency, count: count ?? 0, lastChecked: new Date().toISOString() };
      } catch (e) {
        return {
          name: table,
          accessible: false,
          latency: Date.now() - start,
          lastChecked: new Date().toISOString(),
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );

  const tables: TableStatus[] = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          name: MONITORED_TABLES[i],
          accessible: false,
          latency: 0,
          lastChecked: new Date().toISOString(),
          error: String((r as PromiseRejectedResult).reason),
        },
  );

  const allAccessible = tables.every(t => t.accessible);
  return {
    reachable: allAccessible,
    tables,
    error: allAccessible ? undefined : 'Some tables are not accessible',
  };
}

// ─── Persistence check (isolated table) ────────────────────────────────────────
// Uses system_health_checks instead of clients to avoid polluting production data.

async function checkPersistence(): Promise<PersistenceStatus> {
  // Use UUID + timestamp to guarantee uniqueness across concurrent/retried probes.
  const testId = `hc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const testValue = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `val_${Date.now()}`;

  try {
    const writeStart = Date.now();
    const { error: writeError } = await withTimeout(
      (supabase.from as (t: string) => ReturnType<typeof supabase.from>)('system_health_checks')
        .insert({ id: testId, value: testValue }),
      CHECK_TIMEOUT_MS,
      'persistence:write',
    );
    const writeTime = Date.now() - writeStart;

    if (writeError) {
      return { working: false, writeTime, readTime: 0, error: `Write failed: ${writeError.message}` };
    }

    const readStart = Date.now();
    const { data, error: readError } = await withTimeout(
      (supabase.from as (t: string) => ReturnType<typeof supabase.from>)('system_health_checks')
        .select('value')
        .eq('id', testId)
        .single(),
      CHECK_TIMEOUT_MS,
      'persistence:read',
    );
    const readTime = Date.now() - readStart;

    // Always clean up — even if read failed.
    await (supabase.from as (t: string) => ReturnType<typeof supabase.from>)('system_health_checks')
      .delete()
      .eq('id', testId)
      .catch(() => null);

    if (readError) {
      return { working: false, writeTime, readTime, error: `Read failed: ${readError.message}` };
    }

    const row = data as { value: string } | null;
    return { working: row?.value === testValue, writeTime, readTime, readValue: row?.value };
  } catch (e) {
    // Best-effort cleanup on unexpected errors.
    await (supabase.from as (t: string) => ReturnType<typeof supabase.from>)('system_health_checks')
      .delete()
      .eq('id', testId)
      .catch(() => null);
    return { working: false, writeTime: 0, readTime: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Edge functions check (real probe) ────────────────────────────────────────
// Sends a request that triggers schema validation (422), proving the runtime
// is alive. FunctionsFetchError means the function is unreachable.

async function checkFunctions(): Promise<FunctionsStatus> {
  const start = Date.now();
  try {
    const { error } = await withTimeout(
      supabase.functions.invoke('external-db', {
        body: { action: '__health_probe__', table: '__probe__' },
      }),
      CHECK_TIMEOUT_MS,
      'functions:external-db',
    );

    const latency = Date.now() - start;

    // FunctionsFetchError = DNS / network failure — runtime unreachable.
    // FunctionsHttpError (4xx/5xx) = runtime IS alive, probe was rejected as expected.
    if (error && (error as { name?: string }).name === 'FunctionsFetchError') {
      return { accessible: false, available: [], latency, error: 'Edge function unreachable' };
    }

    return { accessible: true, available: ['external-db'], latency };
  } catch (e) {
    return {
      accessible: false,
      available: [],
      latency: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// ─── Orchestration ─────────────────────────────────────────────────────────────

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startMs = Date.now();
  const timestamp = new Date().toISOString();

  structuredLog('INFO', 'start', { timestamp });

  const [connection, database, persistence, functions] = await Promise.all([
    withRetry(checkConnection, RETRY_ATTEMPTS, RETRY_DELAY_MS),
    withRetry(checkDatabase, RETRY_ATTEMPTS, RETRY_DELAY_MS),
    withRetry(checkPersistence, RETRY_ATTEMPTS, RETRY_DELAY_MS),
    withRetry(checkFunctions, RETRY_ATTEMPTS, RETRY_DELAY_MS),
  ]);

  let status: 'healthy' | 'warning' | 'error' = 'healthy';
  const issues: string[] = [];

  if (!connection.connected) {
    status = 'error';
    issues.push('database connection failed');
  }

  if (!database.reachable) {
    if (status !== 'error') status = 'error';
    issues.push('tables not fully accessible');
  }

  if (!persistence.working) {
    if (status !== 'error') status = 'error';
    issues.push('persistence test failed');
  }

  if (!functions.accessible) {
    if (status === 'healthy') status = 'warning';
    issues.push('edge functions unreachable');
  }

  const inaccessibleCount = database.tables.filter(t => !t.accessible).length;
  if (inaccessibleCount > 0 && status === 'healthy') {
    status = 'warning';
    issues.push(`${inaccessibleCount} table(s) inaccessible`);
  }

  if (connection.latency > 1000 && status === 'healthy') {
    status = 'warning';
    issues.push(`high latency: ${connection.latency}ms`);
  }

  const durationMs = Date.now() - startMs;
  const summary =
    status === 'healthy'
      ? `All systems operational — ${connection.latency}ms latency, ${durationMs}ms total`
      : `${status === 'warning' ? 'Warning' : 'Error'}: ${issues.join('; ')}`;

  structuredLog(status === 'error' ? 'ERROR' : status === 'warning' ? 'WARN' : 'INFO', 'result', {
    status,
    durationMs,
    latency: connection.latency,
    issues,
  });

  return { timestamp, status, connection, database, persistence, functions, summary, durationMs };
}

export async function logHealthCheck(): Promise<void> {
  const result = await performHealthCheck();

  structuredLog(
    result.status === 'error' ? 'ERROR' : result.status === 'warning' ? 'WARN' : 'INFO',
    'log',
    {
      status: result.status,
      durationMs: result.durationMs,
      summary: result.summary,
      connection: { connected: result.connection.connected, latencyMs: result.connection.latency },
      database: {
        reachable: result.database.reachable,
        tableCount: result.database.tables.length,
        inaccessible: result.database.tables.filter(t => !t.accessible).map(t => t.name),
      },
      persistence: {
        working: result.persistence.working,
        writeMs: result.persistence.writeTime,
        readMs: result.persistence.readTime,
      },
      functions: {
        accessible: result.functions.accessible,
        available: result.functions.available,
        latencyMs: result.functions.latency,
      },
    },
  );
}
