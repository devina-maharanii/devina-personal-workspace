"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { SonnerToaster, toasterProps } from "@/lib/toast";
import { useUser } from "@/lib/clerk-client";
import * as Sentry from "@sentry/nextjs";
import { ScrollToTop } from "./ScrollToTop";

export function Providers({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      Sentry.setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      });
    } else {
      Sentry.setUser(null); // Clears user context on sign-out
    }
  }, [isSignedIn, user]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <SonnerToaster {...toasterProps} />
      <ScrollToTop />
    </ThemeProvider>
  );
}

export default Providers;

