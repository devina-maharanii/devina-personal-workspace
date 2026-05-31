import { SecuritySettingsClient } from "@/components/settings/SecuritySettingsClient";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  return <SecuritySettingsClient />;
}
