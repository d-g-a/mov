// Shared site facts for metadata, the sitemap and structured data.

export const SITE_NAME = "LAMOVIDA";
// The project's slogan, used as the description in every language (it stays in French)
export const SITE_SLOGAN = "Musiques électroniques d'Amérique Latine";

// Canonical address. Set SITE_URL in Vercel once the site has its own domain
// (e.g. https://lamovida.paris); until then Vercel's production domain is used.
export const SITE_URL = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/lamovida.paris/",
  soundcloud: "https://soundcloud.com/lamovidaparis",
};
