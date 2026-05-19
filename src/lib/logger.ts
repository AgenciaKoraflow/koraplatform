type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

const SENSITIVE_KEYS = ["password", "token", "secret", "key", "authorization", "cookie", "auth", "credential"];

function sanitize(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).filter(([k]) =>
      !SENSITIVE_KEYS.some(blocked => k.toLowerCase().includes(blocked))
    )
  );
}

function log(level: LogLevel, message: string, context?: LogContext) {
  if (!isDev) return;

  const safe = context ? sanitize(context) : undefined;
  const fn =
    level === "error" ? console.error :
    level === "warn"  ? console.warn  :
    level === "debug" ? console.debug :
    console.info;

  fn(`[${level.toUpperCase()}]`, message, safe ?? "");
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),

  info: (message: string, context?: LogContext) =>
    log("info", message, context),

  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),

  error: (message: string, errorOrContext?: Error | LogContext) => {
    if (!isDev) return;
    if (errorOrContext instanceof Error) {
      console.error("[ERROR]", message, errorOrContext);
      return;
    }
    log("error", message, errorOrContext);
  },

  captureException: (error: unknown, context?: LogContext) => {
    if (!isDev) return;
    console.error("[EXCEPTION]", error, context ?? "");
  },
};
