# LA MOVIDA — site

Next.js (App Router) site for LA MOVIDA, a Latin electronic music collective in Paris. The landing page is the collective's logo extruded in chrome with three.js.

## Git workflow (required)

- **Every change reaches `main` through a branch and a pull request.** Never commit or push directly to `main`, and never merge into `main` locally.
- Create a branch from the latest `main` for each change, push it, and open a PR. Merge only through the PR.
- Never force-push to `main` or rewrite its history.

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # run before pushing; it also typechecks
```

## Layout

- `app/` — layout, page and global styles.
- `components/MetalLogo.tsx` — three.js scene, chrome material, lighting and pointer interaction. Tuning constants (tilt, spin, friction, idle delay, light tints) are at the top.
- `lib/logo.ts` — the logo SVG as a string, parsed at runtime. Keep it in sync with `public/la-movida-logo.svg`.

## Notes

- Logo shapes come from `path.toShapes()`, which handles the SVG's holes correctly on three.js 0.186 (`SVGLoader.createShapes()` is deprecated there). Older three.js versions, e.g. 0.160, invert the holes and fill in the ring's center and the insides of O, D and A, so check this after any three.js downgrade.
- The rounded chrome look comes from `lib/roundedNormalMap.ts`: a normal map built from the logo's distance field, applied to the front and back faces. Tune it with `ROUNDING` in `MetalLogo.tsx` (`radius` = width of the rounded shoulder, `height` = how pronounced it is).
