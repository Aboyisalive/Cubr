/**
 * Cube state contract — shared across web (and mirrored by Go `cube-core` and the
 * Kociemba solver service). A 3x3x3 state is expressed as a 54-character facelet
 * string in URFDLB face order (standard for Kociemba/two-phase solvers).
 */

/** The six faces, in canonical URFDLB order. */
export type Face = "U" | "R" | "F" | "D" | "L" | "B";

export const FACE_ORDER: readonly Face[] = ["U", "R", "F", "D", "L", "B"] as const;

/** Physical cube-face colors (Section 2 palette citizens). */
export type CubeColor = "white" | "yellow" | "red" | "orange" | "green" | "blue";

/**
 * Default Western ("BOY") color scheme, mapping each face to its center color.
 * Used to render facelet letters as palette colors.
 */
export const DEFAULT_SCHEME: Record<Face, CubeColor> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};

/**
 * 54-char facelet string in URFDLB order. Each face is 9 stickers read row-major
 * (top-left → bottom-right). A solved cube is "UUUUUUUUURRRRRRRRRFFFFFFFFF...".
 */
export type Facelets = string;

export const SOLVED_FACELETS: Facelets =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

export interface CubeState {
  facelets: Facelets;
  /** Optional non-default color scheme (cube theming, Section 5). */
  scheme?: Record<Face, CubeColor>;
}

/** Result of validating a manually-entered or scanned state (Phase 1/2). */
export interface ValidationResult {
  valid: boolean;
  /** Machine-readable reason codes, e.g. "COLOR_COUNT", "PARITY", "CENTERS". */
  errors: ValidationError[];
}

export interface ValidationError {
  code: string;
  message: string;
  /** Facelet indices (0–53) implicated, when known. */
  facelets?: number[];
}
