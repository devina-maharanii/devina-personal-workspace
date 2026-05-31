import { getAllSubscriptions } from "@/lib/actions/admin";
import { SubscriptionsPageClient } from "@/components/admin/SubscriptionsPageClient";

export const dynamic = "force-dynamic";

/**
 * Server page component that resolves active Stripe customer seats.
 */
export default async function AdminSubscriptionsPage() {
  const result = await getAllSubscriptions({
    page: 1,
    limit: 10,
    plan: "ALL",
    status: "ALL",
  });

  return (
    <SubscriptionsPageClient 
      initialSubscriptions={result.subscriptions} 
      initialPagination={result.pagination} 
    />
  );
}
