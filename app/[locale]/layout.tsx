import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LanguagePrompt from "@/components/LanguagePrompt";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_SLOGAN, SITE_URL } from "@/lib/site";
import "../globals.css";

const OG_LOCALE = { fr: "fr_FR", en: "en_GB", es: "es_ES" } as const;

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Absolute URLs (canonical, hreflang alternates, share image) use SITE_URL
// (see lib/site.ts). The share image is public/share-image.png; its
// description is translated (meta.shareAlt).
export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const description = SITE_SLOGAN; // same French slogan in every language
  const shareImage = { url: "/share-image.png", width: 1200, height: 630, type: "image/png", alt: t("shareAlt") };

  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_NAME,
    description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: `/${locale}`,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])), "x-default": "/" },
    },
    robots: { index: true, follow: true },
    // Google Search Console "HTML tag" verification, set in Vercel if used
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      url: `/${locale}`,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title: SITE_NAME, description, images: [shareImage] },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
          <LanguageSwitcher />
          <LanguagePrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
