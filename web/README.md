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
