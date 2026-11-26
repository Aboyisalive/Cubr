import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import logoUrl from '@/assets/cubr-logo.webp'

const CUBE_FACES = [
  { name: 'White', className: 'bg-cube-white' },
  { name: 'Yellow', className: 'bg-cube-yellow' },
  { name: 'Red', className: 'bg-cube-red' },
  { name: 'Orange', className: 'bg-cube-orange' },
  { name: 'Blue', className: 'bg-cube-blue' },
  { name: 'Green', className: 'bg-cube-green' },
] as const

function ScaffoldPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="cubr logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-heading text-xl font-bold tracking-tight">
            cubr
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-10 sm:px-6">
        <section className="rounded-xl border border-border bg-card p-6 text-card-foreground">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Web scaffold
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Vite, React, strict TypeScript, Tailwind v4 and shadcn/ui are
            wired up. The landing page lands in F0.7; this page proves the
            theme system.
          </p>

          <div className="mt-6">
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Cube-face tokens
            </h2>
            <ul className="mt-3 flex flex-wrap gap-3">
              {CUBE_FACES.map((face) => (
                <li key={face.name} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`inline-block size-6 rounded-md border border-border ${face.className}`}
                  />
                  <span className="text-sm">{face.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 font-mono text-sm text-muted-foreground">
            Notation font check: R U&apos; F2 L D&apos; B2
          </p>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ScaffoldPage />
    </ThemeProvider>
  )
}
