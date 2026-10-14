import MetalLogo from "@/components/MetalLogo";
import NewsletterForm from "@/components/NewsletterForm";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.srOnly}>LA MOVIDA</h1>
      <MetalLogo />
      <NewsletterForm />
      <footer className={styles.footer}>
        <a href="https://www.instagram.com/lamovida.paris/" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>
          Instagram
        </a>
        <a href="https://soundcloud.com/lamovidaparis" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M1.5 14.5v2.5M3.5 12.5v4.5M5.5 11v6M7.5 10.5v6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9.5 17V9.6a5.2 5.2 0 0 1 9.6 2.2 2.6 2.6 0 1 1 .9 5.2Z" fill="currentColor"/></svg>
          SoundCloud
        </a>
      </footer>
    </main>
  );
}
