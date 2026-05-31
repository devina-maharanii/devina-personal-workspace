import pino, { Logger } from "pino";
import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

// ─── Base Pino Logger ──────────────────────────────────────────────────────────

export const logger: Logger = pino({
  level: isDev ? "debug" : (process.env.LOG_LEVEL ?? "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    service: "ai-saas-boilerplate-pro",
  },
});

// ─── Structured Child-Logger Factory ──────────────────────────────────────────

export interface LogContext {
  userId?: string;
  orgId?: string;
  action?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Creates a child logger pre-populated with structured context fields.
 * Use this inside server actions and API routes to enrich log entries.
 *
 * @example
 * ```ts
 * const log = createLogger({ userId: user.id, action: "updateProfile" });
 * log.info("Profile updated");
 * log.error({ err }, "Failed to update profile");
 * ```
 */
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

// ─── Duration Helper ───────────────────────────────────────────────────────────

/**
 * Wraps an async function to measure and log its execution duration.
 *
 * @example
 * ```ts
 * const result = await logDuration("fetchAnalytics", () => db.query(...));
 * ```
 */
export async function logDuration<T>(
  label: string,
  fn: () => Promise<T>,
  context?: LogContext,
): Promise<T> {
  const log = context ? createLogger(context) : logger;
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    log.info({ label, durationMs }, `${label} completed in ${durationMs}ms`);
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    log.error({ label, durationMs, err }, `${label} failed after ${durationMs}ms`);
    throw err;
  }
}

// ─── Production Error Forwarding to Sentry ────────────────────────────────────

/**
 * Logs a structured error and forwards it to Sentry in production.
 * Accepts the same arguments as `logger.error()` but enriches the Sentry
 * report with the `context` fields.
 */
export function logError(
  err: unknown,
  message: string,
  context?: LogContext,
): void {
  const log = context ? createLogger(context) : logger;
  log.error({ err, ...context }, message);

  if (!isDev) {
    Sentry.withScope((scope) => {
      if (context?.userId) scope.setUser({ id: context.userId });
      if (context?.orgId) scope.setTag("orgId", context.orgId as string);
      if (context?.action) scope.setTag("action", context.action as string);
      
      const errorObj = err instanceof Error ? err : new Error(message);
      Sentry.captureException(errorObj, {
        extra: context as Record<string, unknown>,
      });
    });
  }
}

export default logger;
