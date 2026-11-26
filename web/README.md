# web/ — web client

TypeScript, React, Vite, Three.js (landing 3D arrives later; the MVP hero is
raw WebGL2 — see F0.8). Strict TypeScript, route-level code splitting: the
landing page loads instantly and heavy scenes lazy-load after first paint.
Offline history in IndexedDB (F4.6).

## F0.5: scaffold (landed)

- Vite + React 19 + strict TypeScript; `@` → `src/` alias in both
  `vite.config.ts` and `tsconfig.app.json`.
- Tailwind v4 (`@tailwindcss/vite`) + shadcn/ui (Vite/radix setup,
  `components.json`): `cn` in `src/lib/utils.ts` (clsx + tailwind-merge),
  components in `src/components/ui/` (Button so far).
- **Design tokens** in `src/styles/tokens.css`: Primitives (orange sampled
  from the logo `#ff7200`, neutrals, cube faces, chrome ramp, status) →
  Semantic/Light (`:root`) → Semantic/Dark (`.dark`), exposed as CSS
  variables and mapped to Tailwind utilities (`bg-background`,
  `text-primary`, `bg-cube-blue`, …). Tailwind's `dark:` variant uses the
  same `.dark` class as the toggle (`@custom-variant` in `src/index.css`).
- **Fonts, self-hosted** via Fontsource: Space Grotesk (headings), Inter
  Variable (UI), JetBrains Mono Variable (notation), system fallbacks in
  the token stacks. No Google Fonts requests.
- **Theme**: `ThemeProvider` (`src/components/theme-provider.tsx`) respects
  `prefers-color-scheme`, persists the choice in `localStorage`
  (`cubr-theme`), follows live OS changes in `system` mode, and an inline
  script in `index.html` applies the theme before first paint.
  `ThemeToggle` is a labelled icon button with `aria-pressed`.
- The current page is a themed scaffold placeholder (logo, token swatches,
  notation sample). The landing page replaces it in F0.7.

## F0.7: landing page (landed)

- `src/components/landing/landing-page.tsx`: header (logo, nav, theme
  toggle, CTA), hero, four-step core loop, feature highlights, final CTA,
  footer. Copy is placeholder text supplied by the product brief.
- Hero: Reference A layout (double-bordered centered card, extrabold
  tight-tracked headline, muted subtext, pulsing "Waitlist open" pill,
  `LiquidButton` xl rounded-full). The hero is scoped `.dark` in both
  themes — semantic tokens flip for the section only — pending the F0.8
  WebGL2 shader behind it (a static block-grid stands in for now).
- `LiquidButton` (`src/components/ui/liquid-glass-button.tsx`): the
  Reference A button with the SVG glass filter rendered once in `App`
  (`<GlassFilter />`), never per button. The filter is Chromium-only, so
  the button also carries a translucent fill + border + blur fallback for
  Safari/Firefox, plus a visible focus ring.
- One shared signup modal (`src/components/waitlist/waitlist-modal.tsx`,
  native `<dialog>`: Esc/backdrop close, focus moved to the email field)
  serves every CTA. Inline validation on blur, re-validation on input,
  API typed errors surfaced next to the field or as a form alert, success
  state on completion. Client logic in `src/lib/waitlist.ts` runs on the
  generated API client (`src/lib/api.ts`, `VITE_API_URL` base URL).
- Audit (ux-designer workflow in place of the uninstalled
  web-design-guidelines skill): fixed dialog focus management and
  reduced-motion on the status ping; contrast, labels, alt text, target
  sizes and heading order verified.

## F0.8: hero shader + scroll cube (landed)

- **Hero background**: raw WebGL2 (no Three.js) in
  `src/components/landing/shader-background.tsx`, shader source in
  `hero-shader.ts`. Originally Reference B's tunnel; reworked (user
  brief) to Reference A's flowing light — horizontal, calmed (slowed
  time, gentler wave, softer falloff, channels slightly separated) —
  over the kept blocky background: `uBlock` coordinate quantization
  (tuned to **18** from rendered candidates) plus Reference B's faint
  grid. Channels are remapped to token colors (orange / chrome-white /
  cube blue) via uniforms and tonemapped to match the poster exactly.
- **Performance**: `antialias: false`, 0.75 render scale stepping down
  (0.6/0.5/0.35) when average frame time exceeds ~20 ms, DPR capped at
  1.5, paused off-screen (IntersectionObserver) and on hidden tabs, one
  static frame under `prefers-reduced-motion`. The render loop reads
  refs only — no React state.
- **Poster/fallback**: `public/hero-poster.webp` (1280×720, 6.4 KB,
  rendered by the script above from the same shader math, at the calm
  t=8.5 frame) is preloaded, painted first (LCP element), and stays
  forever if WebGL2 is missing or the shader fails. The shader
  lazy-loads on idle after first paint and fades in, so the CTA is
  interactive before it arrives.
- **Scroll cube** (user addition): "Why cubr?" is six full-screen slides
  with a sticky Three.js cube behind them (`scroll-cube.tsx`, lazy chunk,
  loaded when the section nears). Scroll progress (ref, passive listener)
  scrubs the solve — notation captioned on each slide — computed
  deterministically from the solved state by `cube-scrub.ts`
  (unit-tested: progress 1 = solved slots, 0 = scrambled, clamping).
  Initial JS stays at ~90 KB gz; Three.js (127 KB gz) never enters the
  initial bundle.
- **Blended journey** (user addition, after F0.8): the four "How it
  works" steps and the six "Why cubr?" slides are one continuous scroll
  section behind the *same* sticky cube. During the step slides the cube
  cycles a repetitive algorithm — the sexy move `R U R' U'` three times,
  scrubbed over the scrambled state, captioned per slide — then hands
  off into the Why slides, which solve the combined 24-move state
  (scramble + loop) to solved. Still one WebGL context, one lazy chunk,
  and the render loop stays out of React state.
- **Cube refinement** (user brief): cubies are rounded
  (`RoundedBoxGeometry`) with beveled sticker slabs instead of flat
  planes — same silhouette, softer hand — and the front face is the
  logo's grey `#545455` rather than green (the cube-green token is
  unchanged elsewhere), with the solved pose turned to the logo's view:
  white top, orange left face, grey front.

```sh
just dev-web     # vite dev server
npm run lint     # eslint
npm run typecheck
npm test         # vitest (theme resolution)
npm run build    # tsc + vite build
```

Web enters cubes by manual entry on the 3D cube (F1.7); webcam scanning
comes later. Cube behavior comes from the TypeScript mirror of cube-core
(F1.6) and the generated API client (`shared/api/gen/typescript`, F0.3).
