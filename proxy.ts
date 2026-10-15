import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Sends "/" to the visitor's language (saved choice, else browser language,
// else French) and keeps the locale prefix on every page.
export default createMiddleware(routing);

export const config = {
  // Skip the API, Next internals and files with an extension (icons, robots.txt, sitemap.xml…)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
