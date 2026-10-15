// Languages offered in the menu and the first-visit chooser, named in their own language.
export const LANGUAGES = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
] as const;

// Set once the visitor has picked a language, so the chooser only shows on the first visit.
export const LANGUAGE_CHOSEN_COOKIE = "lamovida_lang_chosen";

const YEAR = 60 * 60 * 24 * 365;

/** Remember the visitor's language (read by next-intl on their next visit to "/"). */
export function rememberLanguage(code: string) {
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${YEAR}; samesite=lax`;
  document.cookie = `${LANGUAGE_CHOSEN_COOKIE}=1; path=/; max-age=${YEAR}; samesite=lax`;
}

export function hasChosenLanguage() {
  return document.cookie.split("; ").some((c) => c.startsWith(`${LANGUAGE_CHOSEN_COOKIE}=`));
}
