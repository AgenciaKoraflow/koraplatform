interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory store — persists across requests within the same Edge Function instance.
// Not globally consistent across instances, but still meaningfully limits abuse.
const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window. */
  maxRequests: number;
  /** Window duration in milliseconds. Defaults to 60 000 (1 minute). */
  windowMs?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowMs ?? 60_000;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + windowMs,
  };
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/** 60 req/min per user — general operations. */
export const GENERAL_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };

/** 10 req/min per user — sensitive operations (get_password). */
export const SENSITIVE_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };
