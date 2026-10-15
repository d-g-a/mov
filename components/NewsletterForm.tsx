"use client";

import { useState, type FormEvent } from "react";
import styles from "./NewsletterForm.module.css";

type State = "idle" | "sending" | "done" | "error";

const MESSAGES: Record<string, string> = {
  pending: "Check your inbox to confirm.",
  subscribed: "You’re on the list.",
  already: "You’re already on the list.",
  unsubscribed: "This email unsubscribed earlier, so it can’t be re-added here.",
  invalid_email: "That email doesn’t look right.",
  consent_required: "Tick the box to receive updates.",
  default: "Couldn’t sign you up. Try again in a moment.",
};

export default function NewsletterForm() {
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
        body: JSON.stringify({ email: data.get("email"), company: data.get("company"), consent }),
      });
      const json = (await res.json()) as { status?: string; error?: string };
      if (res.ok && json.status) {
        setState("done");
        setMessage(MESSAGES[json.status] ?? MESSAGES.subscribed);
        form.reset();
        setConsent(false);
      } else {
        setState("error");
        setMessage(MESSAGES[json.error ?? ""] ?? MESSAGES.default);
      }
    } catch {
      setState("error");
      setMessage(MESSAGES.default);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} data-state={state}>
      <label htmlFor="newsletter-email" className={styles.srOnly}>
        Email address for the LAMOVIDA newsletter
      </label>
      <div className={styles.field}>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="Newsletter"
          className={styles.input}
          disabled={state === "sending"}
        />
        <button
          type="submit"
          className={styles.submit}
          aria-label="Subscribe"
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
        <span>Stay in the loop: LAMOVIDA party dates, lineups and presale access, straight to your inbox.</span>
      </label>
      {/* Honeypot for bots: hidden from people and screen readers */}
      <input name="company" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />
      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
