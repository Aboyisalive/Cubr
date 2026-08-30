from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app

client = TestClient(app)
SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


def test_validate_facelets() -> None:
    resp = client.post("/api/scan/validate", json={"facelets": SOLVED_STATE})
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_validate_invalid_state() -> None:
    resp = client.post("/api/scan/validate", json={"facelets": "BAD"})
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["valid"] is False
    assert payload["errors"]


def test_scan_image_endpoint() -> None:
    img = BytesIO()
    Image.new("RGB", (32, 32), color="white").save(img, format="PNG")
    resp = client.post(
        "/api/scan/image",
        files={"image": ("cube.png", img.getvalue(), "image/png")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "received"
    assert body["image"]["width"] == 32


def test_scan_frame_detects_face_colors() -> None:
    img = BytesIO()
    Image.new("RGB", (300, 300), color=(230, 30, 30)).save(img, format="PNG")
    resp = client.post(
        "/api/scan/frame",
        data={"face": "R"},
        files={"image": ("cube.png", img.getvalue(), "image/png")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "detected"
    assert body["facelets"] == "RRRRRRRRR"
    assert body["confidence"] > 0.5
