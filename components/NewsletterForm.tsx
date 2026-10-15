"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import styles from "./NewsletterForm.module.css";

type State = "idle" | "sending" | "done" | "error";

// Response codes from /api/subscribe that have their own message (messages/*.json → newsletter.status)
const STATUS_KEYS = ["pending", "subscribed", "already", "unsubscribed", "invalid_email", "consent_required"];

export default function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const statusMessage = (code?: string) =>
    t(`status.${code && STATUS_KEYS.includes(code) ? code : "default"}`);

  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  // GDPR: explicit opt-in, never pre-ticked. Sending stays blocked until it's ticked.
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), company: data.get("company"), consent, language: locale }),
      });
      const json = (await res.json()) as { status?: string; error?: string };
      if (res.ok && json.status) {
        setState("done");
        setMessage(statusMessage(json.status));
        form.reset();
        setConsent(false);
      } else {
        setState("error");
        setMessage(statusMessage(json.error));
      }
    } catch {
      setState("error");
      setMessage(statusMessage());
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} data-state={state}>
      <label htmlFor="newsletter-email" className={styles.srOnly}>
        {t("label")}
      </label>
      <div className={styles.field}>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t("placeholder")}
          className={styles.input}
          disabled={state === "sending"}
        />
        <button
          type="submit"
          className={styles.submit}
          aria-label={t("submit")}
          disabled={state === "sending" || !consent}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      <label className={styles.consent}>
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={state === "sending"}
        />
        <span>{t("consent")}</span>
      </label>
      {/* Honeypot for bots: hidden from people and screen readers */}
      <input name="company" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />
      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
