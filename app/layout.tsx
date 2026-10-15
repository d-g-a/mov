import type { Metadata, Viewport } from "next";
import "./globals.css";

const name = "LAMOVIDA";
const description = "Musiques électroniques d'Amérique Latine";
const title = name;

// The share image comes from app/opengraph-image.png and app/twitter-image.png
// (Next.js adds those tags itself). On Vercel the absolute URLs use the
// production domain automatically.
export const metadata: Metadata = {
  title,
  description,
  applicationName: name,
  openGraph: {
    type: "website",
    siteName: name,
    title,
    description,
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
