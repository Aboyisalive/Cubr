from __future__ import annotations

from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from scanner import scan_image_bytes, validate_facelets


class FaceletRequest(BaseModel):
    facelets: str


app = FastAPI(title="Cubr Vision Scanner", version="0.1.0")


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "service": "scanner"}


@app.post("/api/scan/validate")
def validate_scan(payload: FaceletRequest) -> dict[str, object]:
    return validate_facelets(payload.facelets)


@app.post("/api/scan/image")
async def scan_image(image: Annotated[UploadFile, File(...)]) -> dict[str, object]:
    if not image.filename:
        raise HTTPException(status_code=400, detail="image upload is required")

    payload = await image.read()
    try:
        return scan_image_bytes(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/scan")
async def scan(
    facelets: Annotated[str | None, Form()] = None,
    image: Annotated[UploadFile | None, File()] = None,
) -> dict[str, object]:
    if facelets is not None:
        return validate_facelets(facelets)
    if image is None:
        raise HTTPException(status_code=400, detail="provide either facelets or an image upload")
    payload = await image.read()
    try:
        return scan_image_bytes(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
