import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

// ─── Error Code Registry ───────────────────────────────────────────────────────

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "RATE_LIMIT_ERROR"
  | "INTERNAL_ERROR";

// ─── Base Error Class ──────────────────────────────────────────────────────────

/**
 * Base application error class.
 * All custom errors extend this and carry a machine-readable `code` alongside
 * a human-readable `message` and an HTTP `statusCode`.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Specific Error Subclasses ─────────────────────────────────────────────────

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", details?: unknown) {
    super(message, "BAD_REQUEST", 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, "AUTH_ERROR", 401, details);
  }
}

/** @deprecated Use AuthError — kept for backward compat */
export class UnauthorizedError extends AuthError {}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found", details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, "CONFLICT", 409, details);
  }
}

export class PaymentError extends AppError {
  constructor(message = "Payment failed", details?: unknown) {
    super(message, "PAYMENT_ERROR", 402, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too Many Requests", details?: unknown) {
    super(message, "RATE_LIMIT_ERROR", 429, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error", details?: unknown) {
    super(message, "INTERNAL_ERROR", 500, details);
  }
}

// ─── API Error Response Shape ──────────────────────────────────────────────────

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Route Handler error middleware.
 *
 * Converts any thrown error into a consistent JSON response:
 * `{ error: string, code: string, details?: any }`
 *
 * Unknown errors are forwarded to Sentry before returning a 500.
 *
 * @example
 * ```ts
 * export async function GET(req: Request) {
 *   try {
 *     // ...
 *   } catch (err) {
 *     return handleApiError(err);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown, req?: Request): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    if (error.statusCode === 500) {
      Sentry.withScope((scope) => {
        if (req) {
          scope.setContext("request", {
            url: req.url,
            method: req.method,
            headers: Object.fromEntries(req.headers.entries()),
          });
        }
        Sentry.captureException(error);
      });
    }

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details !== undefined && { details: error.details }),
      },
      { status: error.statusCode },
    );
  }

  // Unknown / unexpected errors — report to Sentry with request context
  Sentry.withScope((scope) => {
    if (req) {
      scope.setContext("request", {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
      });
    }
    Sentry.captureException(error);
  });

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return NextResponse.json(
    { error: message, code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
