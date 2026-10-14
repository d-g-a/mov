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
          Instagram
        </a>
      </footer>
    </main>
  );
}
