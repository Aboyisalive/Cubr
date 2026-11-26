/**
 * Hero shader (F0.8, reworked per the hero brief):
 * - Light flow from Reference A (three glowing channel lines), rotated
 *   to run horizontally and calmed down: slower time, gentler wave
 *   amplitude and distortion, softer falloff.
 * - The blocky background stays as per-block shading quantized by
 *   `uBlock` (tuned to 18 — see render_hero_poster.py history).
 *   Reference B's grid term was removed: its sin/cos lines drew
 *   straight white lines across the middle of the page.
 * - Channels are remapped to cube-face token colors (orange brand,
 *   chrome-white, cube blue) via uColorA/B/C uniforms, then
 *   exponentially tonemapped to match the poster renderer exactly.
 * Raw WebGL2 — Three.js is used only by the scroll cube below.
 */
export const HERO_UBLOCK = 18
export const HERO_POSTER_TIME = 8.5

export const HERO_VERTEX_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

export const HERO_FRAGMENT_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform float uBlock;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
#define FC gl_FragCoord.xy
#define R resolution
#define MN min(R.x, R.y)

void main() {
  vec2 p = (FC * 2. - R) / MN;

  // The blocky background: per-block shading quantized by uBlock
  // (subtle dark tiles, no drawn lines — the old sin/cos grid term
  // produced straight white lines across the middle and is gone).
  // The light flow uses smooth coordinates and stays clear.
  vec2 cell = uBlock > 0. ? floor(p * uBlock) : vec2(0.);
  float blockShade = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);

  // Horizontal, calm light flow (from Reference A, slowed and softened).
  float t = time * .35;
  float d = length(p) * .04;
  float wave = .16;
  float lineA = min(.013 / (abs(p.y + .17 + sin((p.x * (1. + d) + t) * 1.2) * wave) + .015), 1.2);
  float lineB = min(.013 / (abs(p.y + sin((p.x + t * 1.08) * 1.2) * wave) + .015), 1.2);
  float lineC = min(.013 / (abs(p.y - .17 + sin((p.x * (1. - d) + t * .92) * 1.2) * wave) + .015), 1.2);

  vec3 col = lineA * uColorA + lineB * uColorB + lineC * uColorC;
  col += blockShade * vec3(.03, .03, .033);
  col = 1. - exp(-max(col, vec3(0.)) * .5);
  O = vec4(col, 1.);
}
`

/** Streak colours = the logo's colours, sampled from Cubr-logo.png:
 * orange #ff7200, grey #545455, white #fefefe (bottom to top). */
export const HERO_COLORS: [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]] = [
  [1.0, 0.447, 0.0], // logo orange #ff7200
  [0.33, 0.33, 0.335], // logo grey #545455
  [0.996, 0.996, 0.996], // logo white #fefefe
]
