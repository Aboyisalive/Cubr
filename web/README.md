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
