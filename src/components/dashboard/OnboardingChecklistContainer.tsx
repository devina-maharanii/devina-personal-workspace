import { db } from "@/lib/db";
import OnboardingChecklist, { OnboardingItem } from "./OnboardingChecklist";

interface OnboardingChecklistContainerProps {
  organizationId: string;
  logo: string | null;
  onboardingCompleted: boolean;
  subscriptionStatus: string;
}

export default async function OnboardingChecklistContainer({
  organizationId,
  logo,
  onboardingCompleted,
  subscriptionStatus,
}: OnboardingChecklistContainerProps) {
  // If the organization already completed/dismissed onboarding, do not render the widget
  if (onboardingCompleted) {
    return null;
  }

  // Fetch status indicators in parallel
  const [membershipCount, invitationCount, aiUsageCount, publishedBlogCount] = await Promise.all([
    db.membership.count({ where: { organizationId } }),
    db.invitation.count({ where: { organizationId } }),
    db.aiUsageLog.count({ where: { organizationId } }),
    db.blogPost.count({ where: { organizationId, published: true } }),
  ]);

  const items: OnboardingItem[] = [
    {
      id: "logo",
      label: "Upload Workspace Logo",
      desc: "Customize your team's visual identity in settings.",
      completed: !!logo,
    },
    {
      id: "team",
      label: "Invite Team Member",
      desc: "Collaborate together by inviting teammates to the workspace.",
      completed: membershipCount > 1 || invitationCount > 0,
    },
    {
      id: "ai",
      label: "Make First AI Request",
      desc: "Run a query in the playground sandbox to test unified API wrapping.",
      completed: aiUsageCount > 0,
    },
    {
      id: "blog",
      label: "Publish a Blog Post",
      desc: "Write and launch your first content item using the built-in CMS.",
      completed: publishedBlogCount > 0,
    },
    {
      id: "payment",
      label: "Add Payment Method",
      desc: "Select a plan tier to unlock sandbox payment checkouts.",
      completed: subscriptionStatus !== "FREE",
    },
  ];

  return <OnboardingChecklist orgId={organizationId} items={items} />;
}
