import { ArrowRight, Camera, Check, ScanLine, Video, Webcam } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCamera } from "@/hooks/useCamera";
import { useUiStore } from "@/store/uiStore";

type FaceId = "U" | "R" | "F" | "D" | "L" | "B";
type FaceGrid = Array<Array<string>>;

type FaceState = {
  label: string;
  center: FaceId;
  prompt: string;
};

type SolveMethod = "beginner" | "kociemba";

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
  const navigate = useNavigate();
  const setSession = useUiStore((state) => state.setSession);
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
  const [solveMethod, setSolveMethod] = useState<SolveMethod>("kociemba");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [trackingBox, setTrackingBox] = useState({ left: 20, top: 20, size: 60 });

  const currentFace = FACE_ORDER[currentFaceIndex];
  const currentMeta = FACE_META[currentFace];
  const allComplete = useMemo(() => FACE_ORDER.every((faceId) => captureMapIsComplete(captures[faceId])), [captures]);

  useEffect(() => {
    if (!active) {
      setTrackingBox({ left: 20, top: 20, size: 60 });
      return;
    }

    let frameId = 0;
    let lastUpdate = 0;
    const track = (time: number) => {
      const video = videoRef.current;
      const canvas = trackingCanvasRef.current;
      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0 && time - lastUpdate > 120) {
        lastUpdate = time;
        const sampleWidth = 160;
        const sampleHeight = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * sampleWidth));
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, sampleWidth, sampleHeight);
          const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
          let minX = sampleWidth;
          let minY = sampleHeight;
          let maxX = 0;
          let maxY = 0;
          let matches = 0;
          for (let y = 0; y < sampleHeight; y += 2) {
            for (let x = 0; x < sampleWidth; x += 2) {
              const offset = (y * sampleWidth + x) * 4;
              const red = pixels[offset] / 255;
              const green = pixels[offset + 1] / 255;
              const blue = pixels[offset + 2] / 255;
              const value = Math.max(red, green, blue);
              const chroma = value - Math.min(red, green, blue);
              if (chroma < 0.16 || value < 0.22) continue;
              matches += 1;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
          if (matches > 80) {
            const padding = 0.08;
            const sourceLeft = Math.max(0, minX / sampleWidth - padding);
            const sourceTop = Math.max(0, minY / sampleHeight - padding);
            const sourceRight = Math.min(1, maxX / sampleWidth + padding);
            const sourceBottom = Math.min(1, maxY / sampleHeight + padding);
            const sourceSize = Math.max(sourceRight - sourceLeft, sourceBottom - sourceTop);
            const centerX = (sourceLeft + sourceRight) / 2;
            const centerY = (sourceTop + sourceBottom) / 2;
            setTrackingBox((previous) => {
              const next = {
                left: Math.max(2, Math.min(98 - sourceSize * 100, (centerX - sourceSize / 2) * 100)),
                top: Math.max(2, Math.min(98 - sourceSize * 100, (centerY - sourceSize / 2) * 100)),
                size: Math.min(96, sourceSize * 100),
              };
              return {
                left: previous.left * 0.65 + next.left * 0.35,
                top: previous.top * 0.65 + next.top * 0.35,
                size: previous.size * 0.65 + next.size * 0.35,
              };
            });
          }
        }
      }
      frameId = requestAnimationFrame(track);
    };
    frameId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frameId);
  }, [active, videoRef]);

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
    setStatus("All six faces captured. Validating and solving...");
    void validateFacelets(captures);
  }

  async function captureCurrentFace() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!active || !video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus("Start the camera and wait for the preview before capturing.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("This browser cannot capture a camera frame.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) {
      setStatus("Unable to capture the current camera frame.");
      return;
    }

    const form = new FormData();
    form.append("face", currentFace);
    form.append("image", blob, `${currentFace.toLowerCase()}-face.jpg`);
    setStatus(`Detecting ${currentMeta.label} face...`);
    try {
      const response = await fetch("http://127.0.0.1:8001/api/scan/frame", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.detail ?? "Unable to detect this face.");
        return;
      }
      const detected = String(payload.facelets ?? "");
      if (detected.length !== 9) {
        setStatus("The detector did not find a complete 3x3 face. Reframe the cube and try again.");
        return;
      }
      const next = Array.from({ length: 3 }, (_, row) => detected.slice(row * 3, row * 3 + 3).split(""));
      setCaptures((prev) => ({ ...prev, [currentFace]: next }));
      setStatus(`Detected ${currentMeta.label} (${Math.round(Number(payload.confidence ?? 0) * 100)}% confidence). Confirm or correct the colors, then save.`);
    } catch (captureError) {
      setStatus(captureError instanceof TypeError
        ? "Scanner service unavailable. Start the vision service on 127.0.0.1:8001 and reload the page."
        : "Unable to process this camera frame.");
    }
  }

  async function validateFacelets(captureMap = captures) {
    const facelets = buildFacelets(captureMap);
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
        body: JSON.stringify({ facelets, method: solveMethod }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setSolve(null);
        setValidation({ valid: false, message: payload.error ?? "Unable to solve the scanned state." });
        return;
      }
      setSolve(payload);
      setStatus(`${solveMethod === "beginner" ? "Beginner method" : "Kociemba"} solved: ${payload.solution || "no moves needed"}`);
      setSession({
        id: "scanned-cube",
        label: "Scanned cube",
        detail: `${payload.method} · ${payload.moveCount} moves`,
        facelets,
      });
      navigate("/app/solver");
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

          <div className="relative mx-auto aspect-square w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-slate-950">
            {active ? (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full bg-black object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-950 text-slate-400">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Video className="h-8 w-8 text-slate-500" />
                  <p className="max-w-md text-sm text-slate-400">Pick a webcam and line up the current face with the center marker.</p>
                </div>
              </div>
            )}
            {active && (
              <div
                className="pointer-events-none absolute rounded-xl border-2 border-emerald-300/80 transition-[left,top,width,height] duration-150"
                style={{
                  left: `${trackingBox.left}%`,
                  top: `${trackingBox.top}%`,
                  width: `${trackingBox.size}%`,
                  height: `${trackingBox.size}%`,
                }}
              >
                <div className="absolute inset-1/3 border-x border-emerald-300/50" />
                <div className="absolute inset-y-0 left-1/3 border-l border-emerald-300/50" />
                <div className="absolute inset-y-0 left-2/3 border-l border-emerald-300/50" />
                <div className="absolute inset-x-0 top-1/3 border-t border-emerald-300/50" />
                <div className="absolute inset-x-0 top-2/3 border-t border-emerald-300/50" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={trackingCanvasRef} className="hidden" />
          <button type="button" onClick={() => void captureCurrentFace()} disabled={!active || loading} className="mt-3 w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
            Capture {currentMeta.label} face
          </button>

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

          <div className="mb-2 text-xs text-slate-400">Detected colors appear below. Tap any sticker to cycle its color before saving.</div>
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
              <button type="button" onClick={() => void validateFacelets()} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
                Validate + solve <ArrowRight className="h-4 w-4" />
              </button>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                Method
                <select
                  value={solveMethod}
                  onChange={(event) => setSolveMethod(event.target.value as SolveMethod)}
                  className="rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="beginner">Beginner · staged</option>
                  <option value="kociemba">Kociemba · shortest</option>
                </select>
              </label>
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
                  {solve.stages?.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-emerald-500/20 pt-2">
                      <div className="text-xs font-medium text-emerald-200">Stages and algorithms</div>
                      {solve.stages.map((stage) => (
                        <div key={stage.name} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-emerald-200/80">{stage.name}</span>
                          <span className="font-mono text-right text-emerald-100">{stage.moves || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
