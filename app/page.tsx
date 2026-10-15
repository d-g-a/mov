import MetalLogo from "@/components/MetalLogo";
import NewsletterForm from "@/components/NewsletterForm";
import styles from "./page.module.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/site";

// Structured data: tells search engines who LAMOVIDA is (name, logo, city,
// social profiles) and the site's name for results.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: ["LA MOVIDA", "LAMOVIDA Paris"],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/lamovida-logo.png`,
      description: SITE_DESCRIPTION,
      address: { "@type": "PostalAddress", addressLocality: "Paris", addressCountry: "FR" },
      sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.soundcloud],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: "LA MOVIDA",
      url: `${SITE_URL}/`,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <main className={styles.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className={styles.srOnly}>LAMOVIDA</h1>
      <p className={styles.srOnly}>{SITE_DESCRIPTION}. Collectif, Paris.</p>
      <MetalLogo />
      <NewsletterForm />
      <footer className={styles.footer}>
        <a href={SOCIAL_LINKS.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>
        </a>
        <a href={SOCIAL_LINKS.soundcloud} aria-label="SoundCloud" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="M1.5 14.5v2.5M3.5 12.5v4.5M5.5 11v6M7.5 10.5v6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9.5 17V9.6a5.2 5.2 0 0 1 9.6 2.2 2.6 2.6 0 1 1 .9 5.2Z" fill="currentColor"/></svg>
        </a>
      </footer>
    </main>
  );
}
