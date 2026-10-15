"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { hasChosenLanguage, LANGUAGES, rememberLanguage } from "@/lib/languages";
import styles from "./LanguagePrompt.module.css";

/** First visit only: ask which language to use. The choice is remembered for a year. */
export default function LanguagePrompt() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hasChosenLanguage()) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    current.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && choose(locale);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choose(code: string) {
    rememberLanguage(code);
    setOpen(false);
    if (code !== locale) router.replace(pathname, { locale: code });
  }

  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      {/* Only the three languages are shown; the name is for screen readers */}
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Choisissez votre langue · Choose your language · Elige tu idioma"
      >
        <div className={styles.options}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              ref={l.code === locale ? current : undefined}
              type="button"
              lang={l.code}
              className={styles.option}
              onClick={() => choose(l.code)}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
