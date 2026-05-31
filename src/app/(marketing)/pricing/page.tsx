import PricingClient from "./PricingClient";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Subscription Pricing Plans",
  description: "Get started with Boilerplate Pro. Review monthly and annual subscriptions featuring sandbox payment checkouts and Clerk authorization roles.",
  canonical: "https://boilerplate-pro.com/pricing",
});

export default function PricingPage() {
  const isE2ETestMode = process.env.E2E_TEST_MODE === "true";

  return <PricingClient authEnabled={!isE2ETestMode} />;
}
