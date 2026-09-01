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
    <div className="flex flex-col gap-10 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-1">
        <p className="type-caption text-text-tertiary">Wednesday · 22 Jul</p>
        <h1 className="type-heading-lg text-text-primary">Method guide</h1>
      </header>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Methods" value={String(Object.keys(METHOD_LABELS).length)} />
        <StatCard label="Stages" value={String(stages.length)} />
        <StatCard label="Cases" value={String(methodCaseCount)} />
        <StatCard label="Practice" value={String(totalAttempts)} hint="tries" />
      </div>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="type-heading-sm text-text-primary">Methods</h2>
          <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
            {(Object.keys(METHOD_LABELS) as MethodId[]).map((methodId) => (
              <button
                key={methodId}
                type="button"
                onClick={() => setMethod(methodId)}
                className={`group flex w-52 shrink-0 flex-col gap-3 rounded-xl border p-3 text-left transition-colors ${method === methodId ? "border-border-strong bg-surface-raised" : "border-border bg-surface-raised hover:border-border-strong"}`}
              >
                <div className="flex h-16 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <span className="text-2xl font-display font-bold">{METHOD_LABELS[methodId].slice(0, 1)}</span>
                </div>
                <div className="min-w-0">
                  <p className="type-label-md text-text-primary">{METHOD_LABELS[methodId]}</p>
                  <p className="type-body-sm text-text-secondary">{METHOD_DESCRIPTIONS[methodId]}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="type-heading-sm text-text-primary">{METHOD_LABELS[method]} path</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stages.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectStage(item.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${stage.id === item.id ? "border-border-strong bg-surface-raised" : "border-border bg-surface-raised hover:border-border-strong"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="type-caption text-text-secondary">Stage {index + 1}</span>
                  <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand">
                    {METHOD_LABELS[method]}
                  </span>
                </div>
                <p className="type-label-md text-text-primary">{item.label}</p>
                <p className="mt-2 type-body-sm text-text-secondary">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="type-heading-sm text-text-primary">Case library</h2>
          {error && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div>}
          {!error && cases.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface-raised p-6 text-sm text-text-secondary">
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
                  className={`rounded-xl border p-4 text-left transition-colors ${selected?.id === algorithm.id ? "border-brand bg-brand/5" : "border-border bg-surface-raised hover:border-border-strong"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="type-label-md text-text-primary">{algorithm.name}</span>
                    {algorithm.mastery !== undefined && (
                      <span className="type-body-sm text-brand">{Math.round(algorithm.mastery * 100)}%</span>
                    )}
                  </div>
                  <p className="mt-3 font-mono text-xs leading-5 text-text-secondary">{algorithm.moves}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <section className="rounded-2xl border border-border bg-surface-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="type-caption text-text-tertiary">Practice case</p>
                <h3 className="type-heading-sm text-text-primary">{selected.name}</h3>
              </div>
              <div className="font-mono text-2xl text-brand">{formatTime(elapsed)}</div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface-base p-4 font-mono text-sm text-brand/90">
              {selected.moves}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${running ? "bg-amber-400 text-slate-950" : "bg-brand text-slate-950"}`}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Stop attempt" : "Try algorithm"}
              </button>
              <button
                type="button"
                onClick={resetPractice}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-base px-4 py-2 text-sm text-text-primary hover:border-border-strong"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <p className="mt-3 text-xs text-text-secondary">
              {running ? "Press Space to stop and record this attempt." : "Press Space to start an attempt."}
            </p>

            {attempts.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-tertiary">
                  <Clock3 className="h-3 w-3" />
                  Recent attempts
                </p>
                <div className="flex flex-wrap gap-2">
                  {attempts.map((attempt, index) => (
                    <span key={`${attempt}-${index}`} className="rounded-md bg-surface-base px-2 py-1 font-mono text-xs text-brand">
                      {formatTime(attempt)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Check className="h-3 w-3 text-brand" />
          Select a case, read the algorithm, then repeat it until the movement feels automatic.
        </div>
      </div>
    </div>
  );
}
