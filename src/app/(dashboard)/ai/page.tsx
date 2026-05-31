import { requireAuth, getActiveOrg } from "@/lib/auth";
import ChatLayout from "@/components/chat/ChatLayout";

export const dynamic = "force-dynamic";

export default async function AiChatPage() {
  const user = await requireAuth();
  const org = await getActiveOrg(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">AI Chat</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Have an interactive, contextual conversation with premium Claude models.
        </p>
      </div>

      <ChatLayout
        userAvatar={user.avatarUrl}
        usedAiCredits={org.usedAiCredits}
        maxAiCredits={org.maxAiCredits}
      />
    </div>
  );
}
