"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  ClerkProvider as RealClerkProvider,
  useUser as useRealUser,
  useAuth as useRealAuth,
  useClerk as useRealClerk,
  SignIn as RealSignIn,
  SignUp as RealSignUp,
  UserButton as RealUserButton,
} from "@clerk/nextjs";
import { useIsMockAuth } from "@/hooks/useIsMockAuth";
import { signOutMockUser } from "@/lib/actions/mock-auth";

type RealUserHookResult = ReturnType<typeof useRealUser>;
type RealAuthHookResult = ReturnType<typeof useRealAuth>;
type RealClerkHookResult = ReturnType<typeof useRealClerk>;

// Define the shape of our wrapper context.
// We intentionally keep the stored values `unknown` and cast at the hook boundary,
// because the mock implementations are only structurally compatible with Clerk's hook returns.
interface ClerkWrapperContextType {
  isMock: boolean;
  user: unknown;
  auth: unknown;
  clerk: unknown;
}

const ClerkWrapperContext = createContext<ClerkWrapperContextType | null>(null);

// This component runs ONLY when we are using real Clerk.
// It subscribes to the real Clerk hooks and passes them down via the context.
function ClerkStateSynchronizer({ children }: { children: React.ReactNode }) {
  const userResult = useRealUser();
  const authResult = useRealAuth();
  const clerkResult = useRealClerk();

  const contextValue = useMemo(() => ({
    isMock: false,
    user: userResult,
    auth: authResult,
    clerk: clerkResult,
  }), [userResult, authResult, clerkResult]);

  return (
    <ClerkWrapperContext.Provider value={contextValue}>
      {children}
    </ClerkWrapperContext.Provider>
  );
}

export function ClerkProvider({ children, ...props }: React.ComponentProps<typeof RealClerkProvider>) {
  const isMock = useIsMockAuth();
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Client-side cookie check for mock session status
  useEffect(() => {
    if (isMock) {
      const checkCookie = () => {
        const hasCookie = typeof document !== "undefined" && document.cookie.includes("mock_session=true");
        setIsSignedIn(hasCookie);
      };
      checkCookie();
      
      window.addEventListener("focus", checkCookie);
      return () => window.removeEventListener("focus", checkCookie);
    }
  }, [isMock]);

  const mockContextValue = useMemo(() => {
    const mockUser = isSignedIn
      ? {
          id: "mock_user_id",
          fullName: "Mock User",
          primaryEmailAddress: {
            emailAddress: "mock-user@example.com",
          },
        }
      : null;

    const mockAuth = {
      isLoaded: true,
      isSignedIn: isSignedIn,
      userId: isSignedIn ? "mock_user_id" : null,
      sessionId: isSignedIn ? "mock_session_id" : null,
      getToken: async () => "mock_token",
      signOut: async () => {
        await signOutMockUser();
      },
    };

    const mockClerk = {
      client: {},
      session: isSignedIn ? { id: "mock_session_id" } : null,
      user: mockUser,
      signOut: async () => {
        await signOutMockUser();
      },
      openSignIn: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      },
      openSignUp: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/sign-up";
        }
      },
    };

    return {
      isMock: true,
      user: {
        isLoaded: true,
        isSignedIn: isSignedIn,
        user: mockUser,
      },
      auth: mockAuth,
      clerk: mockClerk,
    };
  }, [isSignedIn]);

  if (isMock) {
    return (
      <ClerkWrapperContext.Provider value={mockContextValue}>
        {children}
      </ClerkWrapperContext.Provider>
    );
  }

  return (
    <RealClerkProvider {...props}>
      <ClerkStateSynchronizer>
        {children}
      </ClerkStateSynchronizer>
    </RealClerkProvider>
  );
}

export function useUser(): RealUserHookResult {
  const context = useContext(ClerkWrapperContext);
  if (!context) {
    type UnloadedUser = Extract<RealUserHookResult, { isLoaded: false }>;
    const fallbackUser: UnloadedUser = {
      isLoaded: false,
      isSignedIn: undefined,
      user: undefined,
    };
    return fallbackUser;
  }
  return context.user as RealUserHookResult;
}

export function useAuth(): RealAuthHookResult {
  const context = useContext(ClerkWrapperContext);
  if (!context) {
    type UnloadedAuth = Extract<RealAuthHookResult, { isLoaded: false }>;
    const has: UnloadedAuth["has"] = () => false;
    const fallbackAuth: UnloadedAuth = {
      isLoaded: false,
      isSignedIn: undefined,
      userId: undefined,
      sessionId: undefined,
      sessionClaims: undefined,
      actor: undefined,
      orgId: undefined,
      orgRole: undefined,
      orgSlug: undefined,
      has,
      signOut: async () => {},
      getToken: async () => null,
    };
    return fallbackAuth;
  }
  return context.auth as RealAuthHookResult;
}

export function useClerk(): RealClerkHookResult {
  const context = useContext(ClerkWrapperContext);
  if (!context) {
    return {
      client: {},
      session: null,
      user: null,
      signOut: async () => {},
      openSignIn: () => {},
      openSignUp: () => {},
    } as RealClerkHookResult;
  }
  return context.clerk as RealClerkHookResult;
}

export function SignIn(props: React.ComponentProps<typeof RealSignIn>) {
  const isMock = useIsMockAuth();
  if (isMock) {
    return (
      <div className="p-4 border border-zinc-800 bg-zinc-900 rounded-xl text-center text-xs">
        Mock SignIn Component (Use mock account button instead)
      </div>
    );
  }
  return <RealSignIn {...props} />;
}

export function SignUp(props: React.ComponentProps<typeof RealSignUp>) {
  const isMock = useIsMockAuth();
  if (isMock) {
    return (
      <div className="p-4 border border-zinc-800 bg-zinc-900 rounded-xl text-center text-xs">
        Mock SignUp Component (Use mock account button instead)
      </div>
    );
  }
  return <RealSignUp {...props} />;
}

export const UserButton = Object.assign(
  (props: React.ComponentProps<typeof RealUserButton>) => {
    const isMock = useIsMockAuth();
    if (isMock) {
      return null;
    }
    return <RealUserButton {...props} />;
  },
  {
    MenuItems: RealUserButton.MenuItems,
    Link: RealUserButton.Link,
    UserProfilePage: RealUserButton.UserProfilePage,
  }
) as typeof RealUserButton;
