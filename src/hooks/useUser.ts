import { useState, useEffect } from "react";
import { useUser as useClerkUser } from "@/lib/clerk-client";
import { useIsMockAuth } from "@/hooks/useIsMockAuth";

interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: "USER" | "ADMIN";
  subscription?: {
    status: string | null;
    stripePriceId: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

export function useUser() {
  const isMock = useIsMockAuth();
  const clerkResult = useClerkUser();
  
  const clerkLoaded = isMock ? true : clerkResult.isLoaded;
  const isSignedIn = isMock 
    ? (typeof document !== "undefined" && document.cookie.includes("mock_session=true")) 
    : clerkResult.isSignedIn;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!isSignedIn) {
       
      setUser(null);
      setLoading(false);
      return;
    }

    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/user/me");
        if (!response.ok) {
          throw new Error("Failed to fetch user profile from DB");
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [clerkLoaded, isSignedIn]);

  return {
    user,
    isLoading: loading || !clerkLoaded,
    error,
    isSignedIn,
  };
}

export default useUser;
