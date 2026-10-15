import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const name = SITE_NAME;
const description = SITE_DESCRIPTION;
const title = name;

// The share image comes from app/opengraph-image.png and app/twitter-image.png
// (Next.js adds those tags itself). Absolute URLs and the canonical link use
// SITE_URL (see lib/site.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: name,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // Google Search Console "HTML tag" verification, set in Vercel if used
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    siteName: name,
    title,
    description,
    url: "/",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
