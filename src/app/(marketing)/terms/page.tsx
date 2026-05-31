import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import TermsContent from "./TermsContent";

export const metadata: Metadata = constructMetadata({
  title: "Terms of Service",
  description: "Terms and usage guidelines for AI SaaS Boilerplate Pro.",
  noIndex: true,
});

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950/20 text-white">
      <TermsContent />
    </main>
  );
}