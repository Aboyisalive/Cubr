import { ArrowLeft, ArrowRight, Boxes, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/dashboard/StatCard";
import { useUiStore } from "@/store/uiStore";

type SolveResponse = {
  solution: string;
  moveCount: number;
  method: string;
  stages?: Array<{ name: string; moves: string }>;
};

function parseMoves(solution: string) {
  return solution.trim() ? solution.trim().split(/\s+/) : [];
}

export default function Solver() {
  const navigate = useNavigate();
  const session = useUiStore((state) => state.session);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.facelets) {
      setError("Scan a cube first to create a solve guide.");
      return;
    }

    let cancelled = false;
    setError(null);
    setResult(null);
    setMoveIndex(0);
    fetch("http://localhost:8080/api/solver/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facelets: session.facelets, method: "kociemba" }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to create a solve guide.");
        return payload as SolveResponse;
      })
      .then((payload) => {
        if (!cancelled) setResult(payload);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to create a solve guide.");
      });

    return () => {
      cancelled = true;
    };
  }, [session?.facelets]);

  const moves = useMemo(() => parseMoves(result?.solution ?? ""), [result?.solution]);
  const currentMove = moves[moveIndex];
  const completed = moveIndex >= moves.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.28em] text-white/50">Solver · Kociemba</p>
        <h1 className="flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
          <Boxes className="text-[#ff8d42]" size={28} />
          Follow the solve
        </h1>
      </header>

      <div className="mb-8 flex flex-wrap gap-4">
        <StatCard label="Method" value="Kociemba" />
        <StatCard label="Moves" value={String(result?.moveCount ?? 0)} />
        <StatCard label="Status" value={completed ? "Solved" : "In progress"} />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/50">
              Active solve
            </span>
          </div>
          <button type="button" onClick={() => navigate("/app/scan")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white hover:border-white/20">
            <ArrowLeft className="h-4 w-4" /> Scan again
          </button>
        </div>

        {error && (
          <div className="rounded-[22px] border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/60">Scanned cube solution</p>
                <p className="mt-1 text-sm text-[#ff8d42]">{result.moveCount} moves · follow each move in order</p>
              </div>
              <button type="button" onClick={() => setMoveIndex(0)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white hover:border-white/20">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>

            <div className="rounded-[26px] border border-[#ff8d42]/25 bg-[#ff8d42]/8 p-8 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#ffb07b]">
                {completed ? "Solved" : `Move ${moveIndex + 1} of ${moves.length}`}
              </p>
              <div className="mt-3 font-mono text-6xl font-semibold text-white">{currentMove ?? "✓"}</div>
              <p className="mt-3 text-sm text-white/65">
                {completed ? "The cube should now be solved." : "Turn the indicated face, then continue."}
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setMoveIndex((index) => Math.max(0, index - 1))} disabled={moveIndex === 0} className="flex-1 rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-white disabled:opacity-40">
                Previous
              </button>
              <button type="button" onClick={() => setMoveIndex((index) => Math.min(moves.length, index + 1))} disabled={completed} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff8d42] px-3 py-3 text-sm font-medium text-slate-950 disabled:opacity-40">
                Next move <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {moves.map((move, index) => (
                <button key={`${move}-${index}`} type="button" onClick={() => setMoveIndex(index)} className={`rounded-lg px-2 py-1 font-mono text-xs ${index === moveIndex ? "bg-[#ff8d42] text-slate-950" : index < moveIndex ? "bg-[#ff8d42]/10 text-[#ff8d42]" : "bg-black/10 text-white/70"}`}>
                  {move}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
