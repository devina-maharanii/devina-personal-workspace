/**
 * @fileoverview Global type definitions for AI SaaS Boilerplate Pro.
 * These types define the core shapes of data flowing through the application.
 */

/**
 * Represents the structured response for any standard API endpoint.
 *
 * @template T - The type of the data returned upon a successful request.
 */
 
export interface ApiResponse<T = unknown> {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload data. Present if success is true. */
  data?: T;
  /** A human-readable error message. Present if success is false. */
  error?: string;
}

/**
 * Represents a normalized user session object extracted from the database or authentication provider.
 */
export interface UserSession {
  /** The unique identifier of the user (UUID format). */
  id: string;
  /** The primary email address of the user. */
  email: string;
  /** The user's full name, if provided. */
  name?: string;
  /** The URL to the user's avatar image. */
  imageUrl?: string;
  /** The current stripe subscription status of the user (e.g., 'active', 'past_due', 'canceled'). */
  subscriptionStatus?: string;
  /** The Stripe Price ID associated with their current subscription tier. */
  stripePriceId?: string;
  /** The timestamp when their current billing period ends. */
  currentPeriodEnd?: Date;
}

/**
 * Represents the configuration options for a rate limit operation.
 */
export interface RateLimitOptions {
  /** The maximum number of requests allowed in the given window. */
  limit: number;
  /** The sliding window duration (e.g., "60 s"). */
  window: string;
}

/**
 * Represents a standardized error object thrown from external integrations (e.g., Stripe, Clerk).
 */
export interface IntegrationError {
  /** The service that threw the error. */
  provider: "stripe" | "clerk" | "upstash" | "resend" | "ai";
  /** The error code returned by the service. */
  code: string;
  /** A descriptive message about what went wrong. */
  message: string;
}

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: string;
    };
  }
}
