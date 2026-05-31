import { Metadata } from "next";
import { SITE_CONFIG } from "./constants";

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
  keywords?: string[];
}

/**
 * Builds Next.js App Router metadata object with secure and optimized defaults.
 */
export function constructMetadata({
  title,
  description = SITE_CONFIG.description,
  image = SITE_CONFIG.ogImage,
  noIndex = false,
  canonical,
  keywords = ["SaaS", "Boilerplate", "Next.js", "AI", "Stripe", "Auth"],
}: MetadataProps = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.name;

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      images: [
        {
          url: image,
        },
      ],
      url: canonical || SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@boilerplate_pro",
    },
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: canonical || SITE_CONFIG.url,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
  };
}

/**
 * Constructs a dynamic OG Image URL pointing to our edge API endpoint.
 */
export function generateOgImageUrl(_title: string, _description?: string, _type?: string) {
  // Use a static fallback OG image to avoid requiring Edge runtime API routes in dev.
  // Dynamic images can be reintroduced later via a separate service if desired.
  return `${SITE_CONFIG.url}/og.png`;
}
