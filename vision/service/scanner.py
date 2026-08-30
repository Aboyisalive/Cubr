from __future__ import annotations

from collections import Counter
from io import BytesIO
from typing import Any

from PIL import Image

VALID_COLORS = set("URFDLB")
CENTER_INDEXES = [4, 13, 22, 31, 40, 49]


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


def scan_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    try:
        with Image.open(BytesIO(image_bytes)) as img:
            img.verify()
        with Image.open(BytesIO(image_bytes)) as img:
            rgb = img.convert("RGB")
            width, height = rgb.size
    except Exception as exc:  # pragma: no cover - defensive path
        raise ValueError(f"invalid image payload: {exc}") from exc

    return {
        "status": "queued",
        "message": "image recognition is not implemented yet; waiting for a trained cube detector",
        "image": {"width": width, "height": height, "mode": "RGB"},
        "facelets": None,
    }
