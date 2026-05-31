import { requireAuth } from "@/lib/auth";
import { NotificationPrefsClient } from "@/components/settings/NotificationPrefsClient";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  const user = await requireAuth();

  // Safely parse Json DB string/array
  let emailTypes: string[] = [];
  if (user.emailNotificationTypes) {
    try {
      if (typeof user.emailNotificationTypes === "string") {
        emailTypes = JSON.parse(user.emailNotificationTypes);
      } else if (Array.isArray(user.emailNotificationTypes)) {
        emailTypes = user.emailNotificationTypes as string[];
      }
    } catch (e) {
      console.error("Failed to parse emailNotificationTypes:", e);
    }
  }

  const initialPrefs = {
    inAppNotifications: user.inAppNotifications ?? true,
    emailNotificationTypes: emailTypes,
    notificationDigestFreq: user.notificationDigestFreq || "immediate",
  };

  return <NotificationPrefsClient initialPrefs={initialPrefs} />;
}
