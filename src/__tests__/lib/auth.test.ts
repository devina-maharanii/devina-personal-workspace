import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock external dependencies before importing auth ─────────────────────────

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
   
  cache: vi.fn((key: string, fn: () => unknown) => fn()),
  invalidateCache: vi.fn(),
  CACHE_KEYS: {
    userProfile: (id: string) => `user:${id}`,
    activeOrg: (uid: string, oid: string) => `org:${uid}:${oid}`,
    userMemberships: (id: string) => `memberships:${id}`,
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
  })),
}));

import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  requireAuth,
  requireAdmin,
  getOrganizationMembership,
} from "@/lib/auth";

type AuthReturn = Awaited<ReturnType<typeof auth>>;
type MembershipReturn = Awaited<ReturnType<typeof db.membership.findUnique>>;

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const clerkUserMock = getClerkUser as unknown as ReturnType<typeof vi.fn>;
const dbUserFindUniqueMock = db.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const dbMembershipFindUniqueMock = db.membership.findUnique as unknown as ReturnType<typeof vi.fn>;

// ─── Helper fixtures ──────────────────────────────────────────────────────────

const mockClerkUser = {
  id: "clerk_123",
  firstName: "Jane",
  lastName: "Doe",
  imageUrl: "https://example.com/avatar.jpg",
  emailAddresses: [{ emailAddress: "jane@example.com" }],
};

const mockDbUser = {
  id: "db_user_1",
  clerkId: "clerk_123",
  email: "jane@example.com",
  name: "Jane Doe",
  role: "USER",
  deletedAt: null,
};

const mockAdminUser = { ...mockDbUser, role: "ADMIN" };

// ─── getCurrentUser ───────────────────────────────────────────────────────────

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not authenticated", async () => {
     
    authMock.mockResolvedValue({ userId: null });
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("returns null when Clerk user is missing", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" });
    clerkUserMock.mockResolvedValue(null);
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("returns merged user when found in DB", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue(mockDbUser);

    const result = await getCurrentUser();
    expect(result).not.toBeNull();
    expect(result!.email).toBe("jane@example.com");
    expect(result!.clerkUser).toEqual(mockClerkUser);
  });

  it("returns null for soft-deleted users", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue({
      ...mockDbUser,
      deletedAt: new Date(),
    });

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });
});

// ─── requireAuth ──────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to /sign-in when not authenticated", async () => {
     
    authMock.mockResolvedValue({ userId: null } as AuthReturn);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("returns user when authenticated", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue(mockDbUser);

    const result = await requireAuth();
    expect(result.id).toBe("db_user_1");
  });
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to /dashboard when user is not an admin", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue(mockDbUser); // role: USER

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("returns user when user is an admin", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue(mockAdminUser);

    const result = await requireAdmin();
    expect(result.role).toBe("ADMIN");
  });
});

// ─── getOrganizationMembership ────────────────────────────────────────────────

describe("getOrganizationMembership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when user is not authenticated", async () => {
     
    authMock.mockResolvedValue({ userId: null } as AuthReturn);
    const result = await getOrganizationMembership("org_1");
    expect(result).toBeNull();
  });

  it("returns null when user is not a member of the org", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue(mockDbUser);
    dbMembershipFindUniqueMock.mockResolvedValue(null);

    const result = await getOrganizationMembership("org_not_joined");
    expect(result).toBeNull();
  });

  it("returns membership when user belongs to the org", async () => {
     
    authMock.mockResolvedValue({ userId: "clerk_123" } as AuthReturn);
    clerkUserMock.mockResolvedValue(mockClerkUser);
    dbUserFindUniqueMock.mockResolvedValue(mockDbUser);

    const mockMembership = {
      userId: "db_user_1",
      organizationId: "org_1",
      role: "OWNER",
    };
     
    dbMembershipFindUniqueMock.mockResolvedValue(
      mockMembership as MembershipReturn
    );

    const result = await getOrganizationMembership("org_1");
    expect(result).toEqual(mockMembership);
  });
});
