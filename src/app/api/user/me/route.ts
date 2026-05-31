import { NextResponse } from "next/server";
import { getCurrentUser, authenticateWithApiKey } from "@/lib/auth";
 

export async function GET(req: Request) {
  try {
    // Try Clerk session auth first, fallback to developer API keys
    let user = await getCurrentUser();
    if (!user) {
      user = await authenticateWithApiKey(req);
    }

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        ...user,
        imageUrl: user.avatarUrl,
        subscription: {
          status: user.subscriptionStatus,
          stripePriceId: user.stripePriceId,
          currentPeriodEnd: user.currentPeriodEnd?.toISOString() || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in /api/user/me:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
