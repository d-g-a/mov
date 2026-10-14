# LAMOVIDA — Landing page

Static landing page for the LAMOVIDA collective. No build step.

- `index.html` — content and sections (hero, manifesto, what we do, events, join, footer)
- `styles.css` — styles (colors and fonts are CSS variables at the top)
- `script.js` — mobile menu and the sign-up form

## Preview

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
```

## To customize

- Copy, events and dates in `index.html` are placeholders.
- Footer links (Instagram, SoundCloud, email) point to placeholders.
- The sign-up form only shows a confirmation message. Hook it up to your
  email provider (Mailchimp, Buttondown, Formspree, …) in `script.js`.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
