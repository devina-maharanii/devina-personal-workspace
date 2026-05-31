import HeroSection from "@/components/marketing/HeroSection";
import LogoCloud from "@/components/marketing/LogoCloud";
import FeaturesGrid from "@/components/marketing/FeaturesGrid";
import DemoSection from "@/components/marketing/DemoSection";
import BentoGridSection from "@/components/marketing/BentoGridSection";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import CTASection from "@/components/marketing/CTASection";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Devina Maharani | Personal AI Workspace & SaaS Platform",
  description:
    "Explore the personal AI workspace and workspace SaaS built by Devina Maharani. Includes custom AI chat, multimodal vision engines, text summarization, and security logs.",
});

/**
 * LandingPage serves as the root marketing route folder tree layout page.
 * Merges high-fidelity interactive sections into a fluid unified scroll page.
 */
export default function LandingPage() {
  return (
    <div className="w-full bg-background flex flex-col justify-start transition-colors duration-300">
      {/* 1. Hero Folder Viewfold */}
      <HeroSection />

      {/* 2. Customer Trust Logos Cloud */}
      <LogoCloud />

      {/* 3. Prebuilt Platform Demo tab panels */}
      <DemoSection />

      {/* 4. Core SaaS Capabilities Grid */}
      <FeaturesGrid />

      {/* 5. Performance and Scale Bento Modules */}
      <BentoGridSection />

      {/* 6. Social Review Recommendations */}
      <TestimonialsSection />

      {/* 7. Conversion SignUp Actions CTA */}
      <CTASection />
    </div>
  );
}
