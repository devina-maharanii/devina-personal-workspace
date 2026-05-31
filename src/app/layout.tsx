import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@/lib/clerk-client";
import "./globals.css";
import { constructMetadata } from "@/lib/seo";
import Providers from "@/components/shared/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = constructMetadata({
  title: "Devina Maharani",
  description: "Devina Maharani's Personal AI Workspace & SaaS Platform",
});

const isMockAuthEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.FORCE_MOCK_AUTH === "true" || process.env.E2E_TEST_MODE === "true");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {isMockAuthEnabled && (
          <script dangerouslySetInnerHTML={{ __html: "window.__FORCE_MOCK_AUTH__ = true;" }} />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  return <ClerkProvider>{content}</ClerkProvider>;
}

