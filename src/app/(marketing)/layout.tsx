import MarketingNavbar from "@/components/shared/MarketingNavbar";
import Footer from "@/components/shared/Footer";
import { PageTransition } from "@/components/shared/PageTransition";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isE2ETestMode = process.env.E2E_TEST_MODE === "true";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300 overflow-x-clip">
      <MarketingNavbar authEnabled={!isE2ETestMode} />
      <main className="flex-1 flex flex-col pt-16">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
