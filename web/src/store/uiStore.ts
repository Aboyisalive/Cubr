import { create } from "zustand";

export type Theme = "light" | "dark";
export type VisualTheme = "liquid-glass" | "material3";

/** The active cube session reflected by the persistent bottom mini-bar (Section 6.6). */
export interface CubeSession {
  id: string;
  label: string;
  detail: string;
  facelets?: string;
}

interface UiState {
  theme: Theme;
  visualTheme: VisualTheme;
  sidebarCollapsed: boolean;
  session: CubeSession | null;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setVisualTheme: (v: VisualTheme) => void;
  toggleSidebar: () => void;
  setSession: (s: CubeSession | null) => void;
}

function readInitialTheme(): Theme {
  return "dark";
}

function readInitialVisualTheme(): VisualTheme {
  return "liquid-glass";
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

function applyVisualTheme(vt: VisualTheme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-visual-theme", vt);
    try {
      localStorage.setItem("cubr-visual-theme", vt);
    } catch {
      /* storage may be unavailable */
    }
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: readInitialTheme(),
  visualTheme: readInitialVisualTheme(),
  sidebarCollapsed: false,
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
  setVisualTheme: (v) => {
    applyVisualTheme(v);
    set({ visualTheme: v });
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSession: (session) => set({ session }),
}));
