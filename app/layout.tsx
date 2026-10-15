import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL) };

// The real root layout (with <html>) is app/[locale]/layout.tsx, so each
// language gets its own lang attribute. This one only passes children through.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
