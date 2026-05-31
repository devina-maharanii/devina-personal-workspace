import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import PrivacyContent from "./PrivacyContent";

export const metadata: Metadata = constructMetadata({
  title: "Privacy Policy",
  description: "How AI SaaS Boilerplate Pro collects, uses, and protects data.",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950/20 text-white">
      <PrivacyContent />
    </main>
  );
}