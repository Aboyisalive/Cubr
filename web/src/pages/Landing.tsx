import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Gauge, GraduationCap, Mail, ScanLine, Timer } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { CubrScene } from "@/components/three/CubrScene";

const FLIERS = [
  { number: "01", icon: ScanLine, kicker: "Vision, in seconds", title: "See every turn before you make it.", body: "Show cubr a scramble. It reads the state, checks the details, and gives you a clear route out.", label: "Cube scan" },
  { number: "02", icon: Boxes, kicker: "A route, not a riddle", title: "Solutions that keep their cool.", body: "Move from a mixed state to an elegant sequence, one physical turn at a time.", label: "Smart solve" },
  { number: "03", icon: GraduationCap, kicker: "Practice with intent", title: "Build fluency, not just memorisation.", body: "Guided methods make every stage of CFOP feel legible, repeatable, and yours.", label: "Learn CFOP" },
  { number: "04", icon: Timer, kicker: "Pressure, measured", title: "The timer behind your next personal best.", body: "Inspection, session history, and the numbers that matter when your turns get faster.", label: "Timer + Pro" },
] as const;

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const range = element.scrollHeight - element.clientHeight;
    setScrollProgress(range > 0 ? element.scrollTop / range : 0);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative h-full overflow-hidden bg-[#020305]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <CubrScene scrollProgress={scrollProgress} className="h-full w-full" />
      </div>

      <div ref={scrollRef} className="relative z-10 h-full overflow-y-auto overflow-x-hidden text-white">
        <header className="mx-auto flex max-w-7xl items-center px-5 py-6 sm:px-8 lg:px-12">
          <Logo className="[&>span]:text-white" />
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <a className="hidden text-label-md text-white/55 transition-colors hover:text-white sm:block" href="#story">Explore</a>
            <a href="mailto:hello@cubr.app?subject=CUBR%20waitlist"><Button className="gap-2"><Mail size={15} />Join waitlist</Button></a>
          </div>
        </header>

        <main>
          <section className="mx-auto flex min-h-[88vh] max-w-7xl items-center px-5 pb-16 pt-10 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="type-caption mb-6 text-[#ff6b0f]">CUBR / THE CUBE, RECONSIDERED</p>
              <h1 className="font-display text-[clamp(3.25rem,8vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.065em] text-white">Scan, solve,<br />and master<br />the cube.</h1>
              <p className="type-body-lg mt-8 max-w-md text-white/58">A precision companion for the first solve, the next personal best, and everything between.</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="mailto:hello@cubr.app?subject=CUBR%20waitlist"><Button size="lg" className="gap-2"><Mail size={18} />Join the waitlist</Button></a>
                <a href="#story" className="inline-flex items-center gap-2 text-label-lg text-white/70 transition-colors hover:text-white">See what it does <ArrowRight size={17} /></a>
              </div>
            </div>
          </section>

          <section id="story" className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            {FLIERS.map(({ number, icon: Icon, kicker, title, body, label }, index) => (
              <article key={number} className={`relative flex min-h-[82vh] items-center border-t border-white/12 py-20 ${index % 2 ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xl ${index % 2 ? "lg:mr-[8%]" : "lg:ml-[4%]"}`}>
                  <div className="mb-10 flex items-center gap-4 text-white/42"><span className="font-display text-2xl tracking-[-0.05em]">{number}</span><span className="h-px w-12 bg-white/25" /><Icon size={18} /></div>
                  <p className="type-caption text-[#ff6b0f]">{kicker}</p>
                  <h2 className="mt-5 font-display text-[clamp(2.6rem,5.4vw,5.5rem)] font-bold leading-[0.96] tracking-[-0.06em] text-white">{title}</h2>
                  <p className="type-body-lg mt-7 max-w-md text-white/58">{body}</p>
                  <span className="mt-9 inline-flex border-b border-white/30 pb-2 text-label-md text-white/82">{label}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="mx-auto flex min-h-[88vh] max-w-7xl items-end px-5 pb-20 pt-28 sm:px-8 lg:px-12">
            <div className="w-full border-t border-white/15 pt-10 sm:flex sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="type-caption text-[#ff6b0f]">YOUR NEXT SOLVE STARTS HERE</p>
                <h2 className="mt-5 font-display text-[clamp(3rem,6vw,6.25rem)] font-bold leading-[0.93] tracking-[-0.07em]">Find the move<br />that changes everything.</h2>
              </div>
              <a className="mt-8 inline-block sm:mt-0" href="mailto:hello@cubr.app?subject=CUBR%20waitlist"><Button size="lg" className="gap-2"><Mail size={18} />Join the waitlist</Button></a>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-body-sm text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <Logo withWordmark className="[&>span]:text-white" />
            <div className="flex gap-6"><span>Privacy</span><span>Terms</span><span>© 2026 cubr</span></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
