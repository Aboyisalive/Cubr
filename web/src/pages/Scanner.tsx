import { ArrowRight, Camera, Check, ScanLine, Video, Webcam } from "lucide-react";
import { useMemo, useState } from "react";
import { useCamera } from "@/hooks/useCamera";

type FaceId = "U" | "R" | "F" | "D" | "L" | "B";
type FaceGrid = Array<Array<string>>;

type FaceState = {
  label: string;
  center: FaceId;
  prompt: string;
};

const FACE_ORDER: FaceId[] = ["U", "R", "F", "D", "L", "B"];

const FACE_META: Record<FaceId, FaceState> = {
  U: { label: "Up", center: "U", prompt: "Center the U face toward the camera and keep the U sticker centered." },
  R: { label: "Right", center: "R", prompt: "Turn the cube to face the right side directly at the camera." },
  F: { label: "Front", center: "F", prompt: "Keep the front face centered and square in the preview." },
  D: { label: "Down", center: "D", prompt: "Flip the cube so the Down face is readable and centered." },
  L: { label: "Left", center: "L", prompt: "Rotate to the left face and frame the center sticker clearly." },
  B: { label: "Back", center: "B", prompt: "Use the back face; the B center should be the anchor sticker." },
};

const COLOR_SEQUENCE = ["", "U", "R", "F", "D", "L", "B"] as const;
const COLOR_STYLES: Record<string, string> = {
  U: "bg-sky-400 text-sky-950",
  R: "bg-red-500 text-white",
  F: "bg-emerald-500 text-emerald-950",
  D: "bg-yellow-300 text-yellow-950",
  L: "bg-orange-500 text-white",
  B: "bg-violet-500 text-white",
  "": "bg-slate-800 text-slate-500",
};

const emptyFace = (): FaceGrid => Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ""));
const createFaceMap = (): Record<FaceId, FaceGrid> => ({
  U: emptyFace(),
  R: emptyFace(),
  F: emptyFace(),
  D: emptyFace(),
  L: emptyFace(),
  B: emptyFace(),
});

function cycleSticker(color: string) {
  const index = COLOR_SEQUENCE.indexOf(color as (typeof COLOR_SEQUENCE)[number]);
  return COLOR_SEQUENCE[(index + 1) % COLOR_SEQUENCE.length];
}

function buildFacelets(captureMap: Record<FaceId, FaceGrid>) {
  const faceRows = FACE_ORDER.map((faceId) => captureMap[faceId].flat().join(""));
  return faceRows.join("");
}

export default function Scanner() {
  const {
    videoRef,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    active,
    error,
    loading,
    start,
    stop,
    refreshDevices,
  } = useCamera();

  const [captures, setCaptures] = useState<Record<FaceId, FaceGrid>>(createFaceMap);
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [status, setStatus] = useState<string>("Waiting for a face scan.");
  const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [solve, setSolve] = useState<{ solution: string; moveCount: number; method: string; stages: Array<{ name: string; moves: string }> } | null>(null);

  const currentFace = FACE_ORDER[currentFaceIndex];
  const currentMeta = FACE_META[currentFace];
  const allComplete = useMemo(() => FACE_ORDER.every((faceId) => captureMapIsComplete(captures[faceId])), [captures]);

  function captureMapIsComplete(face: FaceGrid) {
    return face.flat().some((cell) => cell !== "") && face.every((row) => row.every((cell) => cell !== ""));
  }

  function updateSticker(row: number, col: number) {
    setCaptures((prev) => {
      const next = prev[currentFace].map((r) => [...r]);
      next[row][col] = cycleSticker(next[row][col]);
      return { ...prev, [currentFace]: next };
    });
  }

  function nextFace() {
    if (currentFaceIndex < FACE_ORDER.length - 1) {
      setCurrentFaceIndex((index) => index + 1);
      setStatus(`Face ${FACE_META[FACE_ORDER[currentFaceIndex + 1]].label} ready.`);
      return;
    }
    setStatus("All six faces are mapped.");
  }

  function markCurrentFaceComplete() {
    const face = captures[currentFace];
    if (!captureMapIsComplete(face)) {
      setStatus(`Finish ${currentMeta.label} face before continuing.`);
      return;
    }
    if (currentFaceIndex < FACE_ORDER.length - 1) {
      setStatus(`Saved ${currentMeta.label}. Move to the next face.`);
      setCurrentFaceIndex((index) => index + 1);
      return;
    }
    setStatus("All six faces captured. Validate the assembled state.");
  }

  async function validateFacelets() {
    const facelets = buildFacelets(captures);
    if (facelets.length !== 54) {
      setValidation({ valid: false, message: "All six faces need to be filled before validation." });
      setSolve(null);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8001/api/scan/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facelets }),
      });
      const payload = await response.json();
      const next = {
        valid: payload.valid,
        message: payload.valid ? "State is structurally valid." : payload.errors[0]?.message ?? "Invalid state.",
      };
      setValidation(next);
      if (payload.valid) {
        setStatus("Validated; solving from the scanned cube state.");
        await solveFacelets(facelets);
      } else {
        setSolve(null);
      }
    } catch {
      setValidation({ valid: false, message: "Scanner service unavailable at 127.0.0.1:8001." });
      setSolve(null);
    }
  }

  async function solveFacelets(facelets: string) {
    try {
      const response = await fetch("http://localhost:8080/api/solver/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facelets, method: "beginner" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setSolve(null);
        setValidation({ valid: false, message: payload.error ?? "Unable to solve the scanned state." });
        return;
      }
      setSolve(payload);
      setStatus(`Solved: ${payload.solution || "no moves needed"}`);
    } catch {
      setSolve(null);
      setValidation({ valid: false, message: "Backend solver is unavailable at localhost:8080." });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
          <ScanLine className="h-7 w-7" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Phase 5 · Scanner</p>
          <h1 className="text-2xl font-semibold">Live face-by-face scan</h1>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Camera className="h-4 w-4 text-emerald-300" />
              <span>Webcam input</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <Webcam className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedDeviceId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setSelectedDeviceId(nextId);
                    if (active && nextId) {
                      void start(nextId);
                    }
                  }}
                  className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                  disabled={devices.length === 0 || loading}
                >
                  {devices.length === 0 ? <option value="">No camera detected</option> : devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                  ))}
                </select>
              </label>

              {!active ? (
                <button type="button" onClick={() => void start(selectedDeviceId || undefined)} disabled={loading || devices.length === 0} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Opening…" : "Start scan"}
                </button>
              ) : (
                <button type="button" onClick={stop} className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700">
                  Stop camera
                </button>
              )}
              <button type="button" onClick={() => void refreshDevices()} className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700">
                Detect devices
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950">
            {active ? (
              <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full bg-black object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-slate-950 text-slate-400">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Video className="h-8 w-8 text-slate-500" />
                  <p className="max-w-md text-sm text-slate-400">Pick a webcam and line up the current face with the center marker.</p>
                </div>
              </div>
            )}
          </div>

          {(error || loading) && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {loading ? "Opening webcam…" : error}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Current step</p>
              <h2 className="text-xl font-semibold text-white">{currentMeta.label} face</h2>
            </div>
            <div className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              {currentFaceIndex + 1} / {FACE_ORDER.length}
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-slate-200">
            {currentMeta.prompt}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-slate-950 p-3">
            {captures[currentFace].map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${currentFace}-${rowIndex}-${colIndex}`}
                  type="button"
                  onClick={() => updateSticker(rowIndex, colIndex)}
                  className={`flex aspect-square items-center justify-center rounded-lg border border-white/10 text-xs font-semibold transition ${COLOR_STYLES[cell] ?? "bg-slate-800 text-slate-500"}`}
                >
                  {cell || "•"}
                </button>
              )),
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={markCurrentFaceComplete} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400">
              {currentFaceIndex === FACE_ORDER.length - 1 ? "Finish scan" : "Save face"}
            </button>
            <button type="button" onClick={nextFace} className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700">
              Skip to next face
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-300">{status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FACE_ORDER.map((faceId) => (
                <span key={faceId} className={`rounded-full border px-2 py-1 text-xs ${captureMapIsComplete(captures[faceId]) ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-800 text-slate-300"}`}>
                  {FACE_META[faceId].label}
                </span>
              ))}
            </div>
          </div>

          {allComplete && (
            <div className="mt-4 space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-emerald-200">
                <Check className="h-4 w-4" />
                <span className="font-medium">Six faces captured.</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-[11px] text-slate-200 break-all">
                {buildFacelets(captures)}
              </div>
              <button type="button" onClick={validateFacelets} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
                Validate + solve <ArrowRight className="h-4 w-4" />
              </button>
              {validation && (
                <div className={`rounded-lg border px-3 py-2 text-sm ${validation.valid ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
                  {validation.message}
                </div>
              )}
              {solve && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  <div className="font-medium">Solution</div>
                  <div className="mt-1 font-mono text-xs break-all">{solve.solution}</div>
                  <div className="mt-2 text-xs text-emerald-200/90">{solve.moveCount} moves · {solve.method}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
