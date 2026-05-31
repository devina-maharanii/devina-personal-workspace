import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Server page component that redirects /settings to /settings/profile.
 */
export default async function SettingsPage() {
  redirect("/settings/profile");
}
