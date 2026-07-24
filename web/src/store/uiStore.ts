import { create } from "zustand";

export type Theme = "light" | "dark";

/** The active cube session reflected by the persistent bottom mini-bar (Section 6.6). */
export interface CubeSession {
  id: string;
  label: string; // e.g. "In-progress solve"
  detail: string; // e.g. "CFOP · F2L stage · 00:42"
  /** Facelet color string for the chrome-framed swatch (URFDLB order, 54 chars). */
  facelets?: string;
}

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  session: CubeSession | null;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSession: (s: CubeSession | null) => void;
}

function readInitialTheme(): Theme {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("cubr-theme", theme);
    } catch {
      /* storage may be unavailable */
    }
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: readInitialTheme(),
  sidebarCollapsed: false,
  // Seeded demo session so the mini-bar is populated in the design build.
  session: {
    id: "demo",
    label: "In-progress solve",
    detail: "CFOP · F2L · 00:42",
    facelets: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSession: (session) => set({ session }),
}));
