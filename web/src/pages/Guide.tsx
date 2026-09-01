import { Check, Clock3, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Algorithm, AlgSet } from "@shared/types/algorithm";
import { api } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { StatCard } from "@/components/dashboard/StatCard";

type MethodId = "beginner" | "cfop" | "roux";

type Stage = {
  id: string;
  label: string;
  description: string;
  sets: AlgSet[];
};

const METHOD_STAGES: Record<MethodId, Stage[]> = {
  beginner: [
    { id: "cross", label: "Make the cross", description: "Build and align the first cross.", sets: ["CROSS"] },
    { id: "corners", label: "First-layer corners", description: "Complete the first layer with the corner trigger.", sets: ["BEGINNER"] },
    { id: "edges", label: "Second-layer edges", description: "Insert the middle-layer edges.", sets: ["BEGINNER"] },
    { id: "last-layer", label: "Last layer", description: "Orient and permute the final layer.", sets: ["BEGINNER"] },
  ],
  cfop: [
    { id: "cross", label: "Cross", description: "Build the cross on the bottom, plan it during inspection, and improve recognition before chasing advanced tricks.", sets: ["CROSS"] },
    { id: "f2l", label: "F2L", description: "Pair a corner and edge, then insert them together. Start intuitively before memorising advanced cases.", sets: ["F2L"] },
    { id: "oll", label: "OLL", description: "Orient the last layer. Start with 2-look OLL: orient the edges, then orient the corners.", sets: ["OLL"] },
    { id: "pll", label: "PLL", description: "Permute the last layer. Start with 2-look PLL: solve the corners, then solve the edges.", sets: ["PLL"] },
  ],
  roux: [
    { id: "first-block", label: "First block", description: "Build the first 1×2×3 block.", sets: [] },
    { id: "second-block", label: "Second block", description: "Complete the opposite 1×2×3 block.", sets: [] },
    { id: "cmll", label: "CMLL", description: "Solve the corners of the last layer.", sets: [] },
    { id: "lse", label: "LSE", description: "Finish the last six edges.", sets: [] },
  ],
};

const METHOD_LABELS: Record<MethodId, string> = {
  beginner: "Beginner",
  cfop: "CFOP",
  roux: "Roux",
};

const METHOD_DESCRIPTIONS: Record<MethodId, string> = {
  beginner: "Fundamentals first, with clear staged goals.",
  cfop: "Fast, structured, and built around recognition.",
  roux: "Block-based solving with an efficient endgame.",
};

function formatTime(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

export default function Guide() {
  const [method, setMethod] = useState<MethodId>("cfop");
  const [stageId, setStageId] = useState("cross");
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [attemptsByAlgorithm, setAttemptsByAlgorithm] = useState<Record<string, number[]>>({});
  const [error, setError] = useState<string | null>(null);

  const stages = METHOD_STAGES[method];
  const stage = stages.find((item) => item.id === stageId) ?? stages[0];
  const cases = useMemo(
    () => algorithms.filter((algorithm) => stage.sets.includes(algorithm.set)),
    [algorithms, stage],
  );
  const selected = cases.find((algorithm) => algorithm.id === selectedId) ?? cases[0];
  const running = startedAt !== null;
  const attempts = selected ? attemptsByAlgorithm[selected.id] ?? [] : [];
  const totalAttempts = Object.values(attemptsByAlgorithm).reduce((sum, list) => sum + list.length, 0);
  const methodCaseCount = algorithms.filter((algorithm) => stages.some((stageItem) => stageItem.sets.includes(algorithm.set))).length;

  useEffect(() => {
    setStageId(METHOD_STAGES[method][0].id);
    setSelectedId(null);
    setAttemptsByAlgorithm({});
    setStartedAt(null);
    setElapsed(0);
  }, [method]);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => setElapsed(performance.now() - startedAt), 10);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!selected) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "SELECT" || target?.tagName === "TEXTAREA") return;
      event.preventDefault();
      toggleTimer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, running, elapsed]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.get<Algorithm[]>(ENDPOINTS.algorithms)
      .then((items) => {
        if (!cancelled) setAlgorithms(items);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load the algorithm library.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectStage(nextStageId: string) {
    setStageId(nextStageId);
    setSelectedId(null);
    setAttemptsByAlgorithm({});
    resetTimer();
  }

  function resetTimer() {
    setStartedAt(null);
    setElapsed(0);
  }

  function resetPractice() {
    resetTimer();
    if (selected) {
      setAttemptsByAlgorithm((previous) => {
        const next = { ...previous };
        delete next[selected.id];
        return next;
      });
    }
  }

  function toggleTimer() {
    if (running) {
      const finalTime = elapsed;
      if (selected) {
        setAttemptsByAlgorithm((previous) => ({
          ...previous,
          [selected.id]: [finalTime, ...(previous[selected.id] ?? [])].slice(0, 5),
        }));
      }
      resetTimer();
      return;
    }
    setStartedAt(performance.now() - elapsed);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.28em] text-white/50">Wednesday · 22 Jul</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Method guide</h1>
      </header>

      <div className="mb-8 flex flex-wrap gap-4">
        <StatCard label="Methods" value={String(Object.keys(METHOD_LABELS).length)} />
        <StatCard label="Stages" value={String(stages.length)} />
        <StatCard label="Cases" value={String(methodCaseCount)} />
        <StatCard label="Practice" value={String(totalAttempts)} hint="tries" />
      </div>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Methods</h2>
          <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
            {(Object.keys(METHOD_LABELS) as MethodId[]).map((methodId) => (
              <button
                key={methodId}
                type="button"
                onClick={() => setMethod(methodId)}
                className={`group flex w-52 shrink-0 flex-col gap-3 rounded-[24px] border p-3 text-left transition-all ${method === methodId ? "border-[#ff8d42]/40 bg-[#ff8d42]/8 shadow-[0_14px_30px_rgba(255,141,66,0.18)]" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
              >
                <div className="flex h-16 items-center justify-center rounded-xl bg-[#ff8d42]/10 text-[#ff8d42]">
                  <span className="text-2xl font-display font-bold">{METHOD_LABELS[methodId].slice(0, 1)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-medium text-white">{METHOD_LABELS[methodId]}</p>
                  <p className="mt-2 text-sm text-white/60">{METHOD_DESCRIPTIONS[methodId]}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">{METHOD_LABELS[method]} path</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stages.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectStage(item.id)}
                className={`rounded-[24px] border p-4 text-left transition-all ${stage.id === item.id ? "border-[#ff8d42]/35 bg-[#ff8d42]/8 shadow-[0_12px_28px_rgba(255,141,66,0.12)]" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">Stage {index + 1}</span>
                  <span className="rounded-full bg-[#ff8d42]/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#ff8d42]">
                    {METHOD_LABELS[method]}
                  </span>
                </div>
                <p className="text-base font-medium text-white">{item.label}</p>
                <p className="mt-2 text-sm text-white/60">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Case library</h2>
          {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div>}
          {!error && cases.length === 0 && (
            <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-6 text-sm text-white/60">
              No cases are seeded for this {METHOD_LABELS[method]} stage yet. The stage is ready for its algorithm library.
            </div>
          )}

          {cases.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cases.map((algorithm) => (
                <button
                  key={algorithm.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(algorithm.id);
                    resetTimer();
                  }}
                  className={`rounded-[22px] border p-4 text-left transition-all ${selected?.id === algorithm.id ? "border-[#ff8d42]/40 bg-[#ff8d42]/8" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-medium text-white">{algorithm.name}</span>
                    {algorithm.mastery !== undefined && (
                      <span className="text-sm text-[#ff8d42]">{Math.round(algorithm.mastery * 100)}%</span>
                    )}
                  </div>
                  <p className="mt-3 font-mono text-xs leading-5 text-white/60">{algorithm.moves}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Practice case</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selected.name}</h3>
              </div>
              <div className="font-mono text-2xl text-[#ff8d42]">{formatTime(elapsed)}</div>
            </div>

            <div className="mt-4 rounded-[20px] border border-[#ff8d42]/20 bg-[#ff8d42]/6 p-4 font-mono text-sm text-[#ffb07b]">
              {selected.moves}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${running ? "bg-amber-400 text-slate-950" : "bg-[#ff8d42] text-slate-950"}`}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Stop attempt" : "Try algorithm"}
              </button>
              <button
                type="button"
                onClick={resetPractice}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-2 text-sm text-white hover:border-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <p className="mt-3 text-xs text-white/60">
              {running ? "Press Space to stop and record this attempt." : "Press Space to start an attempt."}
            </p>

            {attempts.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
                  <Clock3 className="h-3 w-3" />
                  Recent attempts
                </p>
                <div className="flex flex-wrap gap-2">
                  {attempts.map((attempt, index) => (
                    <span key={`${attempt}-${index}`} className="rounded-lg bg-black/10 px-2 py-1 font-mono text-xs text-[#ff8d42]">
                      {formatTime(attempt)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="flex items-center gap-2 text-xs text-white/55">
          <Check className="h-3 w-3 text-[#ff8d42]" />
          Select a case, read the algorithm, then repeat it until the movement feels automatic.
        </div>
      </div>
    </div>
  );
}
