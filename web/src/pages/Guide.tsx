import { Check, Clock3, GraduationCap, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Algorithm, AlgSet } from "@shared/types/algorithm";
import { api } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";

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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300"><GraduationCap className="h-7 w-7" /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Guide engine</p>
          <h1 className="text-2xl font-semibold">Learn by method and stage</h1>
        </div>
      </div>

      {method === "cfop" && (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">CFOP overview</p>
            <h2 className="mt-1 text-xl font-semibold">Cross · F2L · OLL · PLL</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              CFOP solves the cube in four connected phases. The goal is not to memorise everything at once:
              establish a reliable cross, learn intuitive F2L, then build your last-layer algorithm set.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Cross", "Solve the four cross edges, preferably on the bottom."],
                ["F2L", "Solve the first two layers as four corner-edge pairs."],
                ["OLL", "Use 2-look OLL first: edges, then corners."],
                ["PLL", "Use 2-look PLL first: corners, then edges."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <p className="font-medium text-emerald-200">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-emerald-500/20 pt-4 text-sm leading-6 text-slate-300">
              <span className="font-medium text-white">Practice advice: </span>
              prioritise OLL and PLL recognition, then invest time in F2L. F2L may feel slower at first;
              consistent repetition is what turns recognition into speed. Learn finger tricks alongside the
              algorithms, and consider advanced Cross, F2L, Full OLL, and Full PLL once your fundamentals are stable.
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Adapted and curated from{" "}
              <a className="text-emerald-300 underline decoration-emerald-300/40 underline-offset-2 hover:text-emerald-200" href="https://jperm.net/3x3/cfop" target="_blank" rel="noreferrer">
                J Perm’s “CFOP Speedsolving Method”
              </a>
              . Used as an instructional reference; wording and practice flow are Cubr’s.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Choose a method</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(METHOD_LABELS) as MethodId[]).map((methodId) => (
            <button key={methodId} type="button" onClick={() => setMethod(methodId)} className={`rounded-lg px-4 py-2 text-sm font-medium ${method === methodId ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}>
              {METHOD_LABELS[methodId]}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
          <p className="px-2 pb-2 text-xs uppercase tracking-[0.2em] text-slate-400">{METHOD_LABELS[method]} stages</p>
          <div className="space-y-1">
            {stages.map((item, index) => (
              <button key={item.id} type="button" onClick={() => selectStage(item.id)} className={`w-full rounded-lg px-3 py-3 text-left ${stage.id === item.id ? "bg-emerald-500/15 text-emerald-200" : "text-slate-300 hover:bg-slate-800"}`}>
                <span className="mr-2 text-xs text-slate-500">{index + 1}</span>{item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stage {stages.indexOf(stage) + 1}</p>
            <h2 className="mt-1 text-xl font-semibold">{stage.label}</h2>
            <p className="mt-1 text-sm text-slate-400">{stage.description}</p>
          </div>

          {error && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div>}
          {!error && cases.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
              No cases are seeded for this {METHOD_LABELS[method]} stage yet. The stage is ready for its algorithm library.
            </div>
          )}

          {cases.length > 0 && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cases.map((algorithm) => (
                  <button key={algorithm.id} type="button" onClick={() => { setSelectedId(algorithm.id); resetTimer(); }} className={`rounded-xl border p-4 text-left transition ${selected?.id === algorithm.id ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-slate-950/60 hover:border-emerald-500/40"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-white">{algorithm.name}</span>
                      {algorithm.mastery !== undefined && <span className="text-xs text-emerald-300">{Math.round(algorithm.mastery * 100)}%</span>}
                    </div>
                    <p className="mt-3 font-mono text-xs leading-5 text-slate-300">{algorithm.moves}</p>
                  </button>
                ))}
              </div>

              {selected && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Practice case</p>
                      <h3 className="mt-1 text-lg font-semibold">{selected.name}</h3>
                    </div>
                    <div className="font-mono text-2xl text-white">{formatTime(elapsed)}</div>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-950/80 p-4 font-mono text-sm text-emerald-100">{selected.moves}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={toggleTimer} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${running ? "bg-amber-400 text-slate-950" : "bg-emerald-500 text-slate-950"}`}>
                      {running ? <><Pause className="h-4 w-4" /> Stop attempt</> : <><Play className="h-4 w-4" /> Try algorithm</>}
                    </button>
                    <button type="button" onClick={resetPractice} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"><RotateCcw className="h-4 w-4" /> Reset</button>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {running ? "Press Space to stop and record this attempt." : "Press Space to start an attempt."}
                  </p>
                  {attempts.length > 0 && (
                    <div className="mt-4 border-t border-emerald-500/20 pt-3">
                      <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Clock3 className="h-3 w-3" /> Recent attempts</p>
                      <div className="flex flex-wrap gap-2">
                        {attempts.map((attempt, index) => <span key={`${attempt}-${index}`} className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-emerald-200">{formatTime(attempt)}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500"><Check className="h-3 w-3 text-emerald-400" /> Select a case, read the algorithm, then repeat it until the motion feels automatic.</div>
        </main>
      </div>
    </div>
  );
}
