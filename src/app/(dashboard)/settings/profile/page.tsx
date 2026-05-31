import { requireAuth } from "@/lib/auth";
import { ProfileSettingsClient } from "@/components/settings/ProfileSettingsClient";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await requireAuth();

  const initialUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    timezone: user.timezone,
  };

  return <ProfileSettingsClient initialUser={initialUser} />;
}
