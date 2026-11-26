// ESLint for the generated TypeScript client package.
// Generated sources (src/, dist/) are produced by @hey-api/openapi-ts and
// are never hand-edited, so they are not linted; generation correctness is
// enforced by `npm run build` / `typecheck` plus the golden contract.
// Hand-written files in this package (this config, openapi-ts.config.ts)
// ARE linted. The web app gets its own lint config in F0.5.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['src/**', 'dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['*.ts', '*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
);
