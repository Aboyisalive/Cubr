import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ScanLine,
  Boxes,
  GraduationCap,
  Gauge,
  ArrowRight,
  Zap,
  Timer,
  BookOpen,
  Mail,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CubrScene } from "@/components/three/CubrScene";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Scan",
    body: "Point your camera at each face — cubr reads the state in seconds.",
  },
  {
    icon: Boxes,
    title: "Solve",
    body: "Get an optimal, step-by-step solution from any scrambled state.",
  },
  {
    icon: GraduationCap,
    title: "Learn",
    body: "Guided walkthroughs from your first solve through full CFOP.",
  },
  {
    icon: Gauge,
    title: "Go Pro",
    body: "OLL/PLL/F2L trainers, WCA inspection, and Ao5/12/100 analytics.",
  },
  {
    icon: Timer,
    title: "Timer",
    body: "Dedicated speedcubing timer with inspection, scrambles, and session stats.",
  },
  {
    icon: Zap,
    title: "Instant",
    body: "Blazing fast solve engine — solutions in milliseconds, not seconds.",
  },
];

const QUICK_ACTIONS = [
  { icon: ScanLine, label: "Scan Cube", desc: "Camera-based recognition", href: "#" },
  { icon: BookOpen, label: "Start Learning", desc: "Beginner to advanced", href: "#" },
  { icon: Timer, label: "Open Timer", desc: "Start a speedsolve", href: "#" },
];

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    setScrollProgress(el.scrollTop / maxScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative h-full">
      {/* 3D scene — fixed full-viewport background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <CubrScene scrollProgress={scrollProgress} className="h-full w-full" />
      </div>

      {/* Scrollable UI content */}
      <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto">
        {/* Spacer to give scroll room — 500vh total */}
        <div style={{ minHeight: "500vh" }}>
          {/* ── Header ── */}
          <header className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 md:px-8">
            <Logo />
            <div className="ml-auto flex items-center gap-3">
              <Button variant="ghost">Learn more</Button>
              <Button className="gap-2">
                <Mail size={16} />
                Join waitlist
              </Button>
            </div>
          </header>

          {/* ── Hero ── */}
          <section className="mx-auto flex min-h-[85vh] max-w-6xl items-center px-4 md:px-8">
            <div className="flex max-w-xl flex-col gap-6">
              <span className="type-caption w-fit rounded-full border border-white/20 px-3 py-1 text-[#FF6B0F]">
                Coming soon
              </span>
              <h1 className="type-display-lg text-white">
                Scan, solve, and master the cube.
              </h1>
              <p className="type-body-lg max-w-md text-white/60">
                cubr is your full-featured speedcubing companion — from your very
                first solve to sub-10 splits and pro-level algorithm training.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2">
                  <Mail size={18} />
                  Join the waitlist
                </Button>
                <Link to="/login">
                  <Button size="lg" variant="ghost" className="gap-2">
                    Learn more
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Quick actions ── */}
          <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href }) => (
                <Link key={label} to={href}>
                  <Card className="group flex items-center gap-4 p-5 transition-all hover:scale-[1.01] cursor-pointer bg-black/40 backdrop-blur-md border-white/10 text-white">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0F]/10 text-[#FF6B0F] transition-colors group-hover:bg-[#FF6B0F] group-hover:text-white">
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="type-label-lg">{label}</p>
                      <p className="type-body-sm text-white/50">{desc}</p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="ml-auto shrink-0 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-[#FF6B0F]"
                    />
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Feature grid ── */}
          <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
            <div className="mb-10 text-center">
              <h2 className="type-heading-lg text-white">
                Everything the cube asks for
              </h2>
              <p className="type-body-lg mt-2 text-white/50">
                One app. Every feature. From beginner to world-class.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <Card
                  key={title}
                  className="flex flex-col gap-3 bg-black/40 backdrop-blur-md border-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B0F]/10 text-[#FF6B0F]">
                    <Icon size={20} />
                  </div>
                  <h3 className="type-heading-sm text-white">{title}</h3>
                  <p className="type-body-md text-white/50">{body}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* ── CTA banner ── */}
          <section className="mx-auto max-w-6xl px-4 pb-32 md:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 p-8 text-center md:p-12">
              <div className="relative z-10 flex flex-col items-center gap-4">
                <h2 className="type-heading-lg text-white">
                  Ready to solve faster?
                </h2>
                <p className="type-body-lg max-w-md text-white/50">
                  Join the waitlist and be first to try cubr.
                </p>
                <Button size="lg" className="gap-2">
                  <Mail size={18} />
                  Join the waitlist
                </Button>
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="border-t border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
              <Logo withWordmark />
              <div className="flex gap-6">
                <span className="type-body-sm text-white/30 hover:text-white/60 cursor-pointer">
                  Privacy
                </span>
                <span className="type-body-sm text-white/30 hover:text-white/60 cursor-pointer">
                  Terms
                </span>
                <span className="type-body-sm text-white/30 hover:text-white/60 cursor-pointer">
                  GitHub
                </span>
              </div>
              <p className="type-body-sm text-white/30">&copy; 2026 cubr</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
