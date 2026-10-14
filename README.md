# LAMOVIDA — site

Next.js (App Router) site for LAMOVIDA. The landing page is the collective's logo, extruded in chrome on a black stage, rendered with three.js.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## How the landing logo works

- `public/la-movida-logo.svg` — the original logo (white on transparent).
- `lib/logo.ts` — the same SVG as a string, parsed at runtime and extruded into 3D.
- `components/MetalLogo.tsx` — scene, material, and interaction.

Interaction:
- **Mouse:** the logo turns to face the cursor, and a light follows the cursor so highlights sweep across the bevels.
- **Drag (mouse or touch):** flick to spin. It coasts, then settles back facing front.
- **Click / tap:** a short pulse and light flash.
- **Idle:** after 3 seconds without input it floats and sways slowly.
- Respects `prefers-reduced-motion` and pauses rendering when the tab is hidden.

Tuning constants (tilt range, drag sensitivity, friction, idle delay) sit at the top of `MetalLogo.tsx`. Finish is set on the `MeshPhysicalMaterial` (color, roughness, clearcoat).
