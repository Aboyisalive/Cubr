/** Format a solve time (ms) as speedcubers read it: "8.42", "1:03.91". */
export function formatTime(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return totalSeconds.toFixed(2);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");
  return `${minutes}:${seconds}`;
}

/** Compact large counts: 1284 → "1,284". */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
