import { ApiKeysClient } from "@/components/settings/ApiKeysClient";

export const dynamic = "force-dynamic";

export default async function ApiKeysSettingsPage() {
  return <ApiKeysClient />;
}
