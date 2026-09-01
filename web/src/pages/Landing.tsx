import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, Boxes, GraduationCap, Mail, ScanLine, Timer } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { WaitlistForm } from "@/components/WaitlistForm";
import { CubrScene } from "@/components/three/CubrScene";

const FLIERS = [
  { number: "01", icon: ScanLine, kicker: "Vision, in seconds", title: "See every turn before you make it.", body: "Show cubr a scramble. It reads the state, checks the details, and gives you a clear route out.", label: "Cube scan" },
  { number: "02", icon: Boxes, kicker: "A route, not a riddle", title: "Solutions that keep their cool.", body: "Move from a mixed state to an elegant sequence, one physical turn at a time.", label: "Smart solve" },
  { number: "03", icon: GraduationCap, kicker: "Practice with intent", title: "Build fluency, not just memorisation.", body: "Guided methods make every stage of CFOP feel legible, repeatable, and yours.", label: "Learn CFOP" },
  { number: "04", icon: Timer, kicker: "Pressure, measured", title: "The timer behind your next personal best.", body: "Inspection, session history, and the numbers that matter when your turns get faster.", label: "Timer + Pro" },
] as const;

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const range = element.scrollHeight - element.clientHeight;
    setScrollProgress(range > 0 ? element.scrollTop / range : 0);
  }, []);

  const scrollToStory = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollRef.current?.querySelector("#story")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!waitlistOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWaitlistOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [waitlistOpen]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,126,50,0.18),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.14),transparent_20%),linear-gradient(180deg,#04070b_0%,#090d12_35%,#04070b_100%)]" />
        <CubrScene scrollProgress={scrollProgress} className="h-full w-full scale-[0.85] opacity-60" />
      </div>

      <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto overflow-x-hidden">
        <header className="mx-auto flex max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl shadow-[0_12px_30px_rgba(3,7,13,0.55)]">
            <Logo compact className="[&>span]:text-white" />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <a className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block" href="#story" onClick={scrollToStory}>Explore</a>
            <Button className="gap-2 rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.09]" onClick={() => setWaitlistOpen(true)}><Mail size={15} />Join waitlist</Button>
          </div>
        </header>

        <main>
          <section className="mx-auto flex min-h-[84vh] max-w-7xl items-center px-4 pb-12 pt-8 sm:px-6 lg:px-8">
            <div className="max-w-3xl rounded-[32px] border border-white/12 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(5,8,12,0.7)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <p className="mb-6 text-xs uppercase tracking-[0.28em] text-[#ff8d42]">CUBR / THE CUBE, RECONSIDERED</p>
              <h1 className="font-display text-[clamp(3.2rem,7vw,7.2rem)] font-semibold leading-[0.9] tracking-[-0.07em] text-white">Scan, solve,<br />and master<br />the cube.</h1>
              <p className="mt-8 max-w-xl text-base text-white/66 sm:text-lg">A precision companion for the first solve, the next personal best, and everything between.</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button size="lg" className="gap-2 rounded-full bg-[#ff8d42] text-[#120d0b] shadow-[0_12px_24px_rgba(255,141,66,0.35)] hover:bg-[#ff9a59]" onClick={() => setWaitlistOpen(true)}><Mail size={18} />Join the waitlist</Button>
                <a href="#story" onClick={scrollToStory} className="inline-flex items-center gap-2 text-sm font-medium text-white/72 transition-colors hover:text-white">See what it does <ArrowRight size={17} /></a>
              </div>
            </div>
          </section>

          <section id="story" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
            {FLIERS.map(({ number, icon: Icon, kicker, title, body, label }, index) => (
              <article key={number} className={`relative flex min-h-[72vh] items-center py-12 ${index % 2 ? "justify-end" : "justify-start"}`}>
                <div className={`w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8 ${index % 2 ? "lg:mr-[6%]" : "lg:ml-[4%]"}`}>
                  <div className="mb-6 flex items-center gap-4 text-white/40">
                    <span className="font-display text-2xl tracking-[-0.04em]">{number}</span>
                    <span className="h-px w-12 bg-white/20" />
                    <Icon size={18} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[#ff8d42]">{kicker}</p>
                  <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-white">{title}</h2>
                  <p className="mt-7 max-w-md text-base text-white/62">{body}</p>
                  <span className="mt-9 inline-flex border-b border-white/25 pb-2 text-sm font-medium text-white/75">{label}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="mx-auto flex min-h-[72vh] max-w-7xl items-end px-4 pb-20 pt-10 sm:px-6 lg:px-8">
            <div className="w-full rounded-[30px] border border-white/10 bg-white/[0.02] p-6 shadow-[0_18px_60px_rgba(3,7,13,0.7)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#ff8d42]">Your next solve starts here</p>
                  <h2 className="mt-5 font-display text-[clamp(2.6rem,5vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-white">Find the move<br />that changes everything.</h2>
                </div>
                <Button size="lg" className="gap-2 rounded-full bg-[#ff8d42] text-[#140e0b] shadow-[0_12px_24px_rgba(255,141,66,0.3)] hover:bg-[#ff9a59]" onClick={() => setWaitlistOpen(true)}><Mail size={18} />Join the waitlist</Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-black/10 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <Logo withWordmark compact className="[&>span]:text-white" />
            <div className="flex gap-6"><span>Privacy</span><span>Terms</span><span>© 2026 cubr</span></div>
          </div>
        </footer>
      </div>

      {waitlistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setWaitlistOpen(false);
          }}
        >
          <section
            className="w-full max-w-md rounded-[28px] border border-white/12 bg-[#0b0f13]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.72)] backdrop-blur-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-title"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#ff8d42]">CUBR / EARLY ACCESS</p>
                <h2 id="waitlist-title" className="mt-2 text-2xl font-semibold text-white">Join the waitlist</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl text-white/60 transition hover:bg-white/8 hover:text-white"
                aria-label="Close waitlist dialog"
                onClick={() => setWaitlistOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <WaitlistForm />
          </section>
        </div>
      )}
    </div>
  );
}
