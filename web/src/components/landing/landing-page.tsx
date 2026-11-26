import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  Box,
  Camera,
  GraduationCap,
  Moon,
  Puzzle,
  Timer,
  WifiOff,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { SOLVE_NOTATION } from '@/components/landing/cube-scrub'
import { ThemeToggle } from '@/components/theme-toggle'
import { useWaitlist } from '@/components/waitlist/waitlist-modal'
import logoUrl from '@/assets/cubr-logo.webp'

const STEPS = [
  {
    icon: Camera,
    title: 'Scan',
    text: 'Point your camera at a scrambled cube. cubr reads all six faces — you can fix any sticker it gets wrong.',
  },
  {
    icon: Box,
    title: 'See it in 3D',
    text: 'Your exact cube appears in interactive 3D, colors and all, ready to turn and inspect.',
  },
  {
    icon: Puzzle,
    title: 'Solve',
    text: 'Get a solution for your cube with a beginner method, or CFOP when you are ready for speed.',
  },
  {
    icon: GraduationCap,
    title: 'Learn',
    text: 'Follow the solution one named, explained step at a time until solving is yours, not memorized.',
  },
] as const

const FEATURES = [
  {
    icon: Zap,
    title: 'Fast everywhere',
    text: 'Solves in milliseconds and 3D that stays smooth on modest phones, not just flagships.',
  },
  {
    icon: GraduationCap,
    title: 'Teach, don\u2019t just solve',
    text: 'Every step has a name and a plain-language reason, with the pieces it moves highlighted.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    text: 'Your scans, solves and guides stay on the device, available with no connection at all.',
  },
  {
    icon: Moon,
    title: 'Dark and light, equally',
    text: 'Both themes are first-class, follow your system, and switch instantly from anywhere.',
  },
  {
    icon: Timer,
    title: 'Built to grow with you',
    text: 'Start with layer-by-layer, then graduate to CFOP and the pro tools on the roadmap.',
  },
  {
    icon: Camera,
    title: 'Your cube stays yours',
    text: 'Scanning happens on your device. Photos never leave your phone to be read.',
  },
] as const

function SiteHeader() {
  const { openWaitlist } = useWaitlist()
  return (
    <header className="flex items-center justify-between bg-background/75 px-4 py-3 backdrop-blur-md sm:px-6">
      <a href="#top" className="flex items-center gap-3" aria-label="cubr home">
        <img src={logoUrl} alt="" width={36} height={36} className="rounded-lg" />
        <span className="font-heading text-xl font-bold tracking-tight">cubr</span>
      </a>
      <nav aria-label="Page" className="hidden items-center gap-6 text-sm sm:flex">
        <a href="#how" className="text-muted-foreground hover:text-foreground">
          How it works
        </a>
        <a href="#features" className="text-muted-foreground hover:text-foreground">
          Features
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button type="button" onClick={openWaitlist}>
          Join the waitlist
        </Button>
      </div>
    </header>
  )
}

function Hero() {
  const { openWaitlist } = useWaitlist()
  return (
    // The hero is dark in both themes: it sits on the WebGL2 shader
    // (F0.8). Scoping `.dark` here flips the semantic tokens for this
    // section only, and Tailwind's dark: variant follows the same class.
    <section className="dark text-foreground" aria-label="cubr">
      <div className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative mx-auto w-full max-w-3xl border border-border p-2">
          <div className="border border-border px-4 py-10 sm:px-6 sm:py-12">
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <p className="text-xs font-medium text-success">Waitlist open</p>
            </div>

            <h1 className="text-center font-heading text-5xl font-extrabold tracking-tighter text-balance sm:text-7xl">
              Scan it. See it. Solve it.
            </h1>
            <p className="mx-auto mt-4 max-w-xl px-2 text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
              Point your camera at a scrambled cube, watch it in 3D, and learn
              the solution one step at a time.
            </p>

            <div className="mt-8 flex justify-center">
              <LiquidButton
                type="button"
                size="xl"
                onClick={openWaitlist}
                aria-haspopup="dialog"
              >
                Join the waitlist
              </LiquidButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const ScrollCube = lazy(() => import('./scroll-cube'))

/**
 * One blended scroll journey behind a single sticky cube:
 * - the four "How it works" step slides cycle a repetitive algorithm
 *   (R U R' U' x3) scrubbed over the already-scrambled cube, while the
 * - six "Why cubr?" slides solve the combined state to solved.
 * Scroll progress is written to a ref by a passive listener — React
 * never re-renders for it. Three.js lazy-loads as the section nears.
 */
function Journey() {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const [cubeRequested, setCubeRequested] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const requester = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCubeRequested(true)
      },
      { rootMargin: '800px' },
    )
    requester.observe(section)

    let ticking = false
    const update = () => {
      ticking = false
      const rect = section.getBoundingClientRect()
      const total = Math.max(1, section.offsetHeight - window.innerHeight)
      progressRef.current = Math.min(1, Math.max(0, -rect.top / total))
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      requester.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-label="How cubr works and why"
      className="relative border-t border-border bg-muted/30"
    >
      <div id="how" className="scroll-mt-16 px-4 pt-16 sm:px-6 sm:pt-20">
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          From scrambled to solved, in four steps
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-base text-muted-foreground">
          Keep scrolling — the cube behind you is working through an
          algorithm, then solves itself while you read why cubr exists.
        </p>
      </div>

      {/* Sticky cube stage behind all ten slides: the cube itself is
          fully opaque, but it always stays behind the text (z-0 here,
          slide content is z-10 with solid panels). */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden"
      >
        <div className="absolute inset-0">
          {cubeRequested && (
            <Suspense fallback={null}>
              <ScrollCube progressRef={progressRef} />
            </Suspense>
          )}
        </div>
      </div>

      <ol className="relative z-10">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex min-h-[100svh] items-center px-4 py-16 sm:px-6"
          >
            <article
              className={`w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm backdrop-blur ${
                index % 2 === 0 ? 'mr-auto' : 'ml-auto'
              }`}
            >
              <div className="flex items-center justify-between">
                <step.icon aria-hidden className="size-7 text-primary" />
                <span className="font-mono text-sm text-muted-foreground">
                  Step {index + 1} / 4
                </span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {step.text}
              </p>
              <p className="mt-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Algorithm: R U R&prime; U&prime; — cycle {index + 1} of 3
              </p>
            </article>
          </li>
        ))}
      </ol>

      <div id="features" className="relative z-10 scroll-mt-16 px-4 pt-8 sm:px-6">
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Why cubr
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-base text-muted-foreground">
          Six reasons, one solving cube.
        </p>
      </div>

      <ol className="relative z-10">
        {FEATURES.map((feature, index) => (
          <li
            key={feature.title}
            className="flex min-h-[100svh] items-center px-4 py-16 sm:px-6"
          >
            <article
              className={`w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm backdrop-blur ${
                index % 2 === 0 ? 'mr-auto' : 'ml-auto'
              }`}
            >
              <div className="flex items-center justify-between">
                <feature.icon aria-hidden className="size-7 text-primary" />
                <span className="font-mono text-sm text-muted-foreground">
                  {String(index + 1).padStart(2, '0')} / 06
                </span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {feature.text}
              </p>
              <p className="mt-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Solving: {SOLVE_NOTATION[index]}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FinalCta() {
  const { openWaitlist } = useWaitlist()
  return (
    <section aria-labelledby="cta-title" className="dark relative z-20 bg-background/85 px-4 py-16 text-foreground sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="cta-title"
          className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          Be first to solve with cubr
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
          Join the waitlist and we&apos;ll email you the moment cubr launches.
        </p>
        <div className="mt-8 flex justify-center">
          <LiquidButton
            type="button"
            size="xl"
            onClick={openWaitlist}
            aria-haspopup="dialog"
          >
            Join the waitlist
          </LiquidButton>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-border bg-background/75 px-4 py-8 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="" width={28} height={28} className="rounded-md" />
          <span className="font-heading text-base font-bold">cubr</span>
        </div>
        <nav aria-label="Footer" className="flex gap-5 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#top" className="hover:text-foreground">Back to top</a>
        </nav>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} cubr
        </p>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div id="top" className="min-h-svh text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Journey />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
