 
import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PaymentError,
  RateLimitError,
  InternalServerError,
  handleApiError,
} from "@/lib/errors";

// ─── Error class hierarchy ─────────────────────────────────────────────────────

describe("AppError", () => {
  it("stores message, code, and statusCode", () => {
    const err = new AppError("Something failed", "BAD_REQUEST", 400);
    expect(err.message).toBe("Something failed");
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.statusCode).toBe(400);
  });

  it("is an instance of Error", () => {
    expect(new AppError("x", "INTERNAL_ERROR", 500)).toBeInstanceOf(Error);
  });

  it("stores optional details", () => {
    const err = new AppError("Validation failed", "VALIDATION_ERROR", 422, { field: "email" });
    expect(err.details).toEqual({ field: "email" });
  });
});

describe("Error subclasses", () => {
  const cases = [
    { Cls: BadRequestError, code: "BAD_REQUEST", status: 400 },
    { Cls: ValidationError, code: "VALIDATION_ERROR", status: 422 },
    { Cls: AuthError, code: "AUTH_ERROR", status: 401 },
    { Cls: ForbiddenError, code: "FORBIDDEN", status: 403 },
    { Cls: NotFoundError, code: "NOT_FOUND", status: 404 },
    { Cls: ConflictError, code: "CONFLICT", status: 409 },
    { Cls: PaymentError, code: "PAYMENT_ERROR", status: 402 },
    { Cls: RateLimitError, code: "RATE_LIMIT_ERROR", status: 429 },
    { Cls: InternalServerError, code: "INTERNAL_ERROR", status: 500 },
  ] as const;

  for (const { Cls, code, status } of cases) {
    it(`${Cls.name} has code="${code}" and statusCode=${status}`, () => {
      const err = new Cls();
      expect(err.code).toBe(code);
      expect(err.statusCode).toBe(status);
      expect(err).toBeInstanceOf(AppError);
    });
  }
});

// ─── handleApiError ────────────────────────────────────────────────────────────

describe("handleApiError", () => {
  it("maps AppError to correct status and JSON body", async () => {
    const err = new ValidationError("Email is invalid", { field: "email" });
    const res = handleApiError(err);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.error).toBe("Email is invalid");
    expect(body.details).toEqual({ field: "email" });
  });

  it("maps NotFoundError to 404", async () => {
    const res = handleApiError(new NotFoundError("Resource not found"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  it("maps RateLimitError to 429", async () => {
    const res = handleApiError(new RateLimitError());
    expect(res.status).toBe(429);
  });

  it("returns 500 for unknown errors", async () => {
    const res = handleApiError(new Error("boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("returns 500 for non-Error values", async () => {
    const res = handleApiError("just a string");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("omits details key when none provided", async () => {
    const res = handleApiError(new NotFoundError());
    const body = await res.json();
    expect(body).not.toHaveProperty("details");
  });
});
