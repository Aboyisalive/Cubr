from __future__ import annotations

from collections import Counter
from colorsys import rgb_to_hsv
from io import BytesIO
from typing import Any

from PIL import Image

VALID_COLORS = set("URFDLB")
CENTER_INDEXES = [4, 13, 22, 31, 40, 49]
FACE_COLORS = "URFDLB"


def validate_facelets(facelets: str) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []

    def fail(code: str, message: str, facelets_idx: list[int] | None = None) -> None:
        payload: dict[str, Any] = {"code": code, "message": message}
        if facelets_idx is not None:
            payload["facelets"] = facelets_idx
        errors.append(payload)

    if len(facelets) != 54:
        fail("BAD_LENGTH", f"facelet string must be 54 characters, got {len(facelets)}")
        return {"valid": False, "errors": errors}

    if any(ch not in VALID_COLORS for ch in facelets):
        bad = [i for i, ch in enumerate(facelets) if ch not in VALID_COLORS]
        fail("BAD_CHARS", "invalid facelet character detected", bad)
        return {"valid": False, "errors": errors}

    counts = Counter(facelets)
    for color in "URFDLB":
        if counts.get(color, 0) != 9:
            fail("COLOR_COUNT", f"expected 9 {color} stickers, got {counts.get(color, 0)}")

    for i, face in enumerate("URFDLB"):
        if facelets[CENTER_INDEXES[i]] != face:
            fail("BAD_CENTERS", f"center of face {i} must be {face}", [CENTER_INDEXES[i]])

    return {"valid": len(errors) == 0, "errors": errors}


def _classify_rgb(rgb: tuple[float, float, float]) -> tuple[str, float]:
    red, green, blue = rgb
    hue, saturation, value = rgb_to_hsv(red, green, blue)
    degrees = hue * 360

    if value < 0.18:
        return "B", 0.1
    if saturation < 0.2 and value > 0.55:
        return "U", min(1.0, 0.55 + value * 0.45)
    if 35 <= degrees < 75:
        return "D", min(1.0, 0.55 + saturation * 0.45)
    if 75 <= degrees < 175:
        return "F", min(1.0, 0.55 + saturation * 0.45)
    if 175 <= degrees < 270:
        return "B", min(1.0, 0.55 + saturation * 0.45)
    if 20 <= degrees < 45:
        return "L", min(1.0, 0.55 + saturation * 0.45)
    return "R", min(1.0, 0.55 + saturation * 0.45)


def detect_face(image_bytes: bytes, face: str) -> dict[str, Any]:
    if face not in FACE_COLORS:
        raise ValueError("face must be one of U, R, F, D, L, B")

    try:
        with Image.open(BytesIO(image_bytes)) as img:
            img.verify()
        with Image.open(BytesIO(image_bytes)) as img:
            rgb = img.convert("RGB")
            width, height = rgb.size
    except Exception as exc:  # pragma: no cover - defensive path
        raise ValueError(f"invalid image payload: {exc}") from exc

    # The web overlay asks the user to fill the central 60% of the preview
    # with one face. Sample the middle of each grid cell so borders and the
    # surrounding background do not affect the result.
    left, top = width * 0.2, height * 0.2
    grid_width, grid_height = width * 0.6, height * 0.6
    stickers: list[str] = []
    confidences: list[float] = []
    for row in range(3):
        for col in range(3):
            cell_left = left + grid_width * col / 3
            cell_top = top + grid_height * row / 3
            cell_right = left + grid_width * (col + 1) / 3
            cell_bottom = top + grid_height * (row + 1) / 3
            inset_x = (cell_right - cell_left) * 0.2
            inset_y = (cell_bottom - cell_top) * 0.2
            sample = rgb.crop(
                (
                    int(cell_left + inset_x),
                    int(cell_top + inset_y),
                    int(cell_right - inset_x),
                    int(cell_bottom - inset_y),
                )
            )
            pixels = list(sample.getdata())
            average = tuple(sum(pixel[channel] for pixel in pixels) / len(pixels) / 255 for channel in range(3))
            color, confidence = _classify_rgb(average)
            stickers.append(color)
            confidences.append(round(confidence, 3))

    return {
        "status": "detected",
        "message": "face colors detected; confirm the grid before saving",
        "face": face,
        "facelets": "".join(stickers),
        "confidence": round(sum(confidences) / len(confidences), 3),
        "sticker_confidence": confidences,
        "image": {"width": width, "height": height, "mode": "RGB"},
    }


def scan_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    try:
        with Image.open(BytesIO(image_bytes)) as img:
            img.verify()
        with Image.open(BytesIO(image_bytes)) as img:
            width, height = img.size
    except Exception as exc:  # pragma: no cover - defensive path
        raise ValueError(f"invalid image payload: {exc}") from exc

    return {
        "status": "received",
        "message": "image received; provide a face label to detect its stickers",
        "image": {"width": width, "height": height},
        "facelets": None,
    }
