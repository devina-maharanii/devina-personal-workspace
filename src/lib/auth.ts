import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import type { User as ClerkUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { cache, invalidateCache, CACHE_KEYS } from "./redis";
import { User, UserRole, Membership } from "@prisma/client";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cache as reactCache } from "react";
import { verifyApiKey } from "./crypto";
import { captureEvent } from "./posthog";
import { ANALYTICS_EVENTS } from "./constants";

export type MergedUser = User & {
  clerkUser: ClerkUser | null;
};

/**
 * Gets the current authenticated user's database record merged with their Clerk session data.
 * Cached in Redis for 60 seconds per Clerk user ID.
 * If user does not exist in DB but is logged in via Clerk, automatically syncs and creates the DB entry.
 * Filters out soft-deleted users.
 * Wrapped in React's request-scoped cache to prevent duplicate queries within a single request flow.
 * 
 * @returns {Promise<MergedUser | null>} The merged user profile or null if unauthenticated/deleted.
 */
export const getCurrentUser = reactCache(async (): Promise<MergedUser | null> => {
  const isMockAuthEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.NODE_ENV !== "test" &&
    (process.env.FORCE_MOCK_AUTH === "true" || process.env.E2E_TEST_MODE === "true");

  if (isMockAuthEnabled) {
    const cookieStore = await cookies();
    const hasMockSession = cookieStore.get("mock_session")?.value === "true";
    if (!hasMockSession) {
      return null;
    }

    let u = await db.user.findUnique({ where: { clerkId: "mock_user_id" } });
    if (!u) {
      u = await db.user.upsert({
        where: { clerkId: "mock_user_id" },
        create: {
          clerkId: "mock_user_id",
          email: "mock-admin@example.com",
          name: "Mock Admin",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          role: UserRole.ADMIN,
        },
        update: {},
      });
    }

    return {
      ...u,
      clerkUser: null,
    };
  }

  const { userId } = await auth();
  if (!userId) return null;

  // Get full Clerk profile details (needed for auto-sync)
  const clerkUser = await getClerkUser();
  if (!clerkUser) return null;

  // Cache the DB record for 60 s — hot path hit on every dashboard layout render
  const dbUser = await cache(
    CACHE_KEYS.userProfile(userId),
    async () => {
      let u = await db.user.findUnique({ where: { clerkId: userId } });

      // Filter out soft-deleted users
      if (u?.deletedAt) return null;

      // If user is authenticated in Clerk but not in DB, sync them
      if (!u) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) return null;

        u = await db.user.upsert({
          where: { clerkId: userId },
          create: {
            clerkId: userId,
            email,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
            avatarUrl: clerkUser.imageUrl || null,
            role: UserRole.USER,
            needsStripeCustomer: true,
          },
          update: {
            email,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
            avatarUrl: clerkUser.imageUrl || null,
          },
        });

        // Track signup event since they didn't exist in DB before this sync
        captureEvent(userId, ANALYTICS_EVENTS.USER_SIGNED_UP, {
          plan: "free",
        });
      }

      return u;
    },
    60, // 60 second TTL
  );

  if (!dbUser) return null;

  return {
    ...dbUser,
    clerkUser,
  };
});

/**
 * Ensures user is authenticated; if not, throws a Next.js redirect to `/sign-in`.
 * 
 * @returns {Promise<MergedUser>} The active merged user profile.
 */
export async function requireAuth(): Promise<MergedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

/**
 * Ensures user has an ADMIN role; if not, throws a Next.js redirect to `/dashboard`.
 * 
 * @returns {Promise<MergedUser>} The active admin user profile.
 */
export async function requireAdmin(): Promise<MergedUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Gets the user's membership details and role for a specific organization.
 * 
 * @param {string} orgId The database organization ID to query.
 * @returns {Promise<Membership | null>} The membership details or null if not a member.
 */
export async function getOrganizationMembership(orgId: string): Promise<Membership | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: orgId,
      },
    },
  });
}

/**
 * Resolves the user's currently selected organization using cookies,
 * falling back to the first membership, or creating a default personal organization if none exist.
 * Results are cached in Redis for 60 seconds to avoid repeated DB queries per layout render.
 * 
 * @param {string} userId The database user ID to query.
 */
export async function getActiveOrg(userId: string) {
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("selected_org_id")?.value ?? "default";

  return cache(
    CACHE_KEYS.activeOrg(userId, cookieOrgId),
    async () => {
      if (cookieOrgId !== "default") {
        const membership = await db.membership.findUnique({
          where: {
            userId_organizationId: {
              userId,
              organizationId: cookieOrgId,
            },
          },
          include: { organization: true },
        });
        if (membership) return membership.organization;
      }

      // Fallback to first organization membership
      const firstMembership = await db.membership.findFirst({
        where: { userId },
        include: { organization: true },
      });

      if (firstMembership) {
        return firstMembership.organization;
      }

      // Self-heal: Create a default personal organization if none exists
      const user = await db.user.findUnique({ where: { id: userId } });
      const org = await db.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
          data: {
            name: `${user?.name || "User"}'s Workspace`,
            slug: `${userId.slice(0, 8)}-workspace`,
            plan: "FREE",
            maxMembers: 5,
            maxAiCredits: 100,
            usedAiCredits: 0,
          },
        });

        // Create owner membership
        await tx.membership.create({
          data: {
            userId,
            organizationId: newOrg.id,
            role: "OWNER",
          },
        });

        return newOrg;
      });

      return org;
    },
    60, // 60 second TTL
  );
}

/**
 * Call after any mutation that changes the user's organization membership or profile.
 * Clears all Redis cache entries associated with the given user.
 */
export async function invalidateUserCache(
  clerkId: string,
  userId: string,
  orgId?: string,
) {
  const keys: string[] = [
    CACHE_KEYS.userProfile(clerkId),
    CACHE_KEYS.userMemberships(userId),
  ];
  if (orgId) {
    keys.push(CACHE_KEYS.activeOrg(userId, orgId));
    keys.push(CACHE_KEYS.activeOrg(userId, "default"));
  }
  await invalidateCache(keys);
}

/**
 * timing-safe developer API key authentication checker.
 * Extracts, prefix-matches, timing-safe compares (bcrypt), and validates expiration.
 */
export async function authenticateWithApiKey(req: Request): Promise<MergedUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return null;
    }

    const rawKey = authHeader.substring(7).trim();
    if (!rawKey) return null;

    const parts = rawKey.split("_");
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return null;
    }

    const keyPrefix = parts[0] + "_" + parts[1].slice(0, 6);

    // Find keys matching the prefix
    const keys = await db.apiKey.findMany({
      where: { keyPrefix },
      include: {
        user: true,
      },
    });

    for (const key of keys) {
      const isValid = verifyApiKey(rawKey, key.keyHash);
      if (isValid) {
        // Check expiration
        if (key.expiresAt && key.expiresAt < new Date()) {
          continue; // Key is expired
        }

        // Asynchronously update last used timestamp
        db.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        }).catch((err) => console.error("Error updating API key lastUsedAt:", err));

        // Format to MergedUser (clerkUser is null for external API keys)
        return {
          ...key.user,
          clerkUser: null,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("API Key authentication error:", error);
    return null;
  }
}
