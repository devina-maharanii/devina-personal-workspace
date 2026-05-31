"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action to sign in a mock user by setting the mock_session cookie.
 * Redirects the user to the dashboard.
 */
export async function signInMockUser() {
  const cookieStore = await cookies();
  cookieStore.set("mock_session", "true", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  
  redirect("/dashboard");
}

/**
 * Server action to sign out the mock user by clearing the mock_session cookie.
 * Redirects the user back to the home page.
 */
export async function signOutMockUser() {
  const cookieStore = await cookies();
  cookieStore.delete("mock_session");
  
  redirect("/");
}
