import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import React from 'react';

// Import email templates
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { InviteEmail } from "@/emails/InviteEmail";
import { SubscriptionConfirmEmail } from "@/emails/SubscriptionConfirmEmail";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { WeeklyDigestEmail } from "@/emails/WeeklyDigestEmail";
import { LowCreditsEmail } from "@/emails/LowCreditsEmail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  try {
    // 1. Authorize - only super admins can view email previews
    await requireAdmin();

    const { template } = await params;

    let component: React.ReactElement;

    // 2. Map template name to component with mock data
    switch (template.toLowerCase()) {
      case "welcome":
        component = React.createElement(WelcomeEmail, {
          name: "John Doe",
          dashboardUrl: "https://app.saasplatform.com/dashboard",
        });
        break;

      case "invite":
        component = React.createElement(InviteEmail, {
          inviterName: "Sarah Jenkins",
          organizationName: "Aether Labs",
          inviteLink: "https://app.saasplatform.com/invite/preview-token-xyz",
        });
        break;

      case "subscription-confirm":
        component = React.createElement(SubscriptionConfirmEmail, {
          name: "John Doe",
          planName: "Pro Enterprise Monthly",
          price: "$99.00/mo",
          amountPaid: "$99.00",
          nextBillingDate: "June 20, 2026",
          features: [
            "Unlimited AI Prompts & Credits",
            "128MB Maximum File uploads limits",
            "Custom organization dashboards",
            "SLA Uptime Guarantee",
            "Dedicated Account Manager",
          ],
        });
        break;

      case "payment-failed":
        component = React.createElement(PaymentFailedEmail, {
          name: "John Doe",
          planName: "Pro Tier",
          amount: "$29.00",
          updateBillingUrl: "https://app.saasplatform.com/settings/billing",
          gracePeriodEnd: "May 27, 2026",
        });
        break;

      case "weekly-digest":
        component = React.createElement(WeeklyDigestEmail, {
          name: "John Doe",
          orgName: "Aether Labs",
          aiRequestsCount: 1840,
          tokensUsed: "1,245,600",
          storageUsed: "2.8 GB",
          activeMembersCount: 12,
          dashboardUrl: "https://app.saasplatform.com/dashboard",
        });
        break;

      case "low-credits":
        component = React.createElement(LowCreditsEmail, {
          name: "John Doe",
          orgName: "Aether Labs",
          remainingCredits: 4200,
          totalCredits: 100000,
          pricingUrl: "https://app.saasplatform.com/settings/billing",
        });
        break;

      default:
        return new NextResponse(
          `<html>
            <body style="background-color: #09090b; color: #fafafa; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <h2 style="color: #ef4444;">Template Not Found: "${template}"</h2>
              <p style="color: #a1a1aa;">Available preview templates are:</p>
              <ul style="color: #6366f1; font-weight: bold; line-height: 2;">
                <li><a href="/api/email-preview/welcome" style="color: inherit; text-decoration: none;">welcome</a></li>
                <li><a href="/api/email-preview/invite" style="color: inherit; text-decoration: none;">invite</a></li>
                <li><a href="/api/email-preview/subscription-confirm" style="color: inherit; text-decoration: none;">subscription-confirm</a></li>
                <li><a href="/api/email-preview/payment-failed" style="color: inherit; text-decoration: none;">payment-failed</a></li>
                <li><a href="/api/email-preview/weekly-digest" style="color: inherit; text-decoration: none;">weekly-digest</a></li>
                <li><a href="/api/email-preview/low-credits" style="color: inherit; text-decoration: none;">low-credits</a></li>
              </ul>
            </body>
          </html>`,
          { status: 404, headers: { "Content-Type": "text/html" } }
        );
    }

    // 3. Render template to HTML string and return response
    const { renderToString } = await import("react-dom/server");
    const htmlString = renderToString(component);
    return new NextResponse(htmlString, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
   
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
    return new NextResponse(
      `<html>
        <body style="background-color: #09090b; color: #fafafa; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px;">
          <h2 style="color: #ef4444;">Authorization or Rendering Error</h2>
          <pre style="background-color: #18181b; border: 1px solid #27272a; padding: 16px; border-radius: 8px; color: #a1a1aa; max-width: 600px; overflow-x: auto;">${message}</pre>
        </body>
      </html>`,
      { status, headers: { "Content-Type": "text/html" } }
    );
  }
}
