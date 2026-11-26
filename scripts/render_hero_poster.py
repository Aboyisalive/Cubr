#!/usr/bin/env python3
"""Render the F0.8 hero shader to a WebP poster, in pure Python.

Replicates the shader in web/src/components/landing/hero-shader.ts:
Reference A's horizontal, calmed light flow + Reference B's faint grid,
with `uBlock` coordinate quantization and cube-face token colors.

Usage:
  python3 scripts/render_hero_poster.py --out web/public/hero-poster.webp \
      --u-block 18 --time 4.0 --width 1280 --height 720
"""

from __future__ import annotations

import argparse
import math

from PIL import Image

# Streak colours = the logo's colours, sampled from Cubr-logo.png.
ORANGE = (1.0, 0.447, 0.0)      # logo orange #ff7200
CHROME = (0.33, 0.33, 0.335)    # logo grey #545455
BLUE = (0.996, 0.996, 0.996)    # logo white #fefefe
EXPOSURE = 0.5


def render(width: int, height: int, t_in: float, u_block: float) -> Image.Image:
    img = Image.new("RGB", (width, height))
    px = img.load()
    mn = min(width, height)
    t = t_in * 0.35

    for j in range(height):
        fcy = height - 0.5 - j  # gl_FragCoord is bottom-up
        for i in range(width):
            fcx = i + 0.5
            x = (fcx * 2 - width) / mn
            y = (fcy * 2 - height) / mn
            # Blocky background = per-block shading (no drawn lines;
            # the old sin/cos grid term made straight white lines).
            cx = math.floor(x * u_block) if u_block > 0 else 0
            cy = math.floor(y * u_block) if u_block > 0 else 0
            h = math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453
            block_shade = h - math.floor(h)

            d = math.hypot(x, y) * 0.04
            wave = 0.16
            line_a = min(0.013 / (abs(y + 0.17 + math.sin((x * (1 + d) + t) * 1.2) * wave) + 0.015), 1.2)
            line_b = min(0.013 / (abs(y + math.sin((x + t * 1.08) * 1.2) * wave) + 0.015), 1.2)
            line_c = min(0.013 / (abs(y - 0.17 + math.sin((x * (1 - d) + t * 0.92) * 1.2) * wave) + 0.015), 1.2)

            r = line_a * ORANGE[0] + line_b * CHROME[0] + line_c * BLUE[0] + block_shade * 0.03
            g = line_a * ORANGE[1] + line_b * CHROME[1] + line_c * BLUE[1] + block_shade * 0.03
            b = line_a * ORANGE[2] + line_b * CHROME[2] + line_c * BLUE[2] + block_shade * 0.035

            px[i, j] = (
                int((1 - math.exp(-max(r, 0.0) * EXPOSURE)) * 255),
                int((1 - math.exp(-max(g, 0.0) * EXPOSURE)) * 255),
                int((1 - math.exp(-max(b, 0.0) * EXPOSURE)) * 255),
            )
    return img


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--u-block", type=float, default=18)
    ap.add_argument("--time", type=float, default=4.0)
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=720)
    ap.add_argument("--quality", type=int, default=72)
    args = ap.parse_args()

    img = render(args.width, args.height, args.time, args.u_block)
    img.save(args.out, "WEBP", quality=args.quality, method=6)
    print(f"wrote {args.out} ({args.width}x{args.height}, uBlock={args.u_block}, t={args.time})")


if __name__ == "__main__":
    main()
