import { ArrowLeft, ArrowRight, Boxes, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300"><Boxes className="h-7 w-7" /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Solver · Kociemba</p>
            <h1 className="text-2xl font-semibold">Follow the solve</h1>
          </div>
        </div>
        <button type="button" onClick={() => navigate("/app/scan")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700">
          <ArrowLeft className="h-4 w-4" /> Scan again
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Scanned cube solution</p>
              <p className="mt-1 text-sm text-emerald-300">{result.moveCount} moves · follow each move in order</p>
            </div>
            <button type="button" onClick={() => setMoveIndex(0)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
              {completed ? "Solved" : `Move ${moveIndex + 1} of ${moves.length}`}
            </p>
            <div className="mt-3 font-mono text-6xl font-semibold text-white">{currentMove ?? "✓"}</div>
            <p className="mt-3 text-sm text-emerald-100/80">
              {completed ? "The cube should now be solved." : "Turn the indicated face, then continue."}
            </p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setMoveIndex((index) => Math.max(0, index - 1))} disabled={moveIndex === 0} className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-3 text-sm text-slate-100 disabled:opacity-40">
              Previous
            </button>
            <button type="button" onClick={() => setMoveIndex((index) => Math.min(moves.length, index + 1))} disabled={completed} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-3 text-sm font-medium text-slate-950 disabled:opacity-40">
              Next move <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {moves.map((move, index) => (
              <button key={`${move}-${index}`} type="button" onClick={() => setMoveIndex(index)} className={`rounded-md px-2 py-1 font-mono text-xs ${index === moveIndex ? "bg-emerald-400 text-slate-950" : index < moveIndex ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-300"}`}>
                {move}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
