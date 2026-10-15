import { defineRouting } from "next-intl/routing";

// French by default (the collective is in Paris), English for international
// visitors, Spanish for the Latin community. URLs: /fr, /en, /es.
export const routing = defineRouting({
  locales: ["fr", "en", "es"],
  defaultLocale: "fr",
  // Remember the chosen language for a year
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
