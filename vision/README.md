# vision/ — vision tooling (Python)

Python / OpenCV (TFLite as the upgrade path) owns dataset tooling, model
training and evaluation, and the scan-accuracy benchmark — never the solve
path. Scanning inference itself runs on-device (CameraX/AVFoundation +
OpenCV sticker detection, LAB/HSV classification with per-session
calibration); this folder holds the offline tooling that proves its accuracy
against a labeled photo set in CI.

First fragments: **F2.2** (sticker grid detection), **F2.6** (accuracy
benchmark harness, run via `just bench-scan`).

Nothing here yet — F0.1 is scaffold only.
