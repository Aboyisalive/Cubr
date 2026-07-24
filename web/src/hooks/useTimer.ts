import { useCallback, useEffect, useRef, useState } from "react";
import type { TimerEvent, TimerPhase } from "@shared/types/timer_event";

/**
 * WCA-style solve timer (Phase 3). A small phase machine driving the Timer UI;
 * emits contract-shaped TimerEvents. Inspection support is wired but off by default.
 */
export function useTimer(options?: { inspection?: boolean }) {
  const inspectionEnabled = options?.inspection ?? false;
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number>();

  const tick = useCallback(() => {
    setElapsedMs(performance.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    startRef.current = performance.now();
    setPhase("running");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setElapsedMs(performance.now() - startRef.current);
    setPhase("stopped");
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setElapsedMs(0);
    setPhase(inspectionEnabled ? "inspection" : "idle");
  }, [inspectionEnabled]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const event: TimerEvent = { phase, elapsedMs, at: performance.now() };
  return { phase, elapsedMs, event, start, stop, reset };
}
