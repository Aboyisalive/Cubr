import { Link } from "react-router-dom";
import { ScanLine, Boxes, GraduationCap, Gauge, Palette, Smartphone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChromeCube } from "@/components/brand/ChromeCube";

const FEATURES = [
  { icon: ScanLine, title: "Scan", body: "Point your camera at each face — cubr reads the state in seconds." },
  { icon: Boxes, title: "Solve", body: "Get an optimal, step-by-step solution from any scrambled state." },
  { icon: GraduationCap, title: "Learn", body: "Guided walkthroughs from your first solve through full CFOP." },
  { icon: Gauge, title: "Go Pro", body: "OLL/PLL/F2L trainers, WCA inspection, and Ao5/12/100 analytics." },
  { icon: Palette, title: "Theme it", body: "Custom color schemes and the signature chrome cube finish." },
];

/**
 * Public landing page (Section 7). Not gated. Header carries a prominent Login and
 * a distinct, secondary Download-for-Android CTA. Hero showcases the chrome cube —
 * the flagship place for the chrome accent (Section 5). Single background, both modes.
 */
export default function Landing() {
  return (
    <div className="min-h-full bg-bg-default">
      {/* Header nav */}
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 md:px-8">
        <Logo />
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" className="gap-2">
              <Smartphone size={18} />
              <span className="hidden sm:inline">Download for Android</span>
              <span className="sm:hidden">Android</span>
            </Button>
          </a>
          <Link to="/login">
            <Button variant="primary">Log in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div className="flex flex-col gap-6">
          <span className="type-caption w-fit rounded-full border border-border px-3 py-1 text-brand">
            Android + Web
          </span>
          <h1 className="type-display-lg text-text-primary">
            Scan, solve, and master the cube.
          </h1>
          <p className="type-body-lg max-w-md text-text-secondary">
            cubr is your full-featured speedcubing companion — from your very first
            solve to sub-10 splits and pro-level algorithm training.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg">Get started — it's free</Button>
            </Link>
            <a href="https://play.google.com/store" target="_blank" rel="noreferrer">
              <Button size="lg" variant="secondary" className="gap-2">
                <Smartphone size={18} />
                Get the Android app
              </Button>
            </a>
          </div>
        </div>

        {/* Flagship chrome cube render surface */}
        <div className="flex justify-center md:justify-end">
          <ChromeCube size={320} radiusClass="rounded-2xl" className="max-w-full" />
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
        <h2 className="type-heading-lg mb-8 text-text-primary">Everything the cube asks for</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-6"
            >
              <Icon className="text-brand" size={24} />
              <h3 className="type-heading-sm text-text-primary">{title}</h3>
              <p className="type-body-md text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 md:px-8">
          <Logo withWordmark />
          <p className="type-body-sm text-text-tertiary">© 2026 cubr</p>
        </div>
      </footer>
    </div>
  );
}
